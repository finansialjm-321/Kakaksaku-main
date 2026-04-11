import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar, { MobileHeader } from "@/components/AdminSidebar";
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Edit2, Trash2, Save, X, 
  Target, Image as ImageIcon, Power, Loader2, Wallet, TrendingUp, ArrowLeft, FileText, Download, List
} from "lucide-react";
import { toast } from "sonner";

export default function ProgramDonasi() {
  // --- STATE VIEW MANAGER ---
  const [activeView, setActiveView] = useState<"programs" | "pencairan">("programs");

  // --- STATE PROGRAM DONASI ---
  const [programs, setPrograms] = useState<any[]>([]);
  const [totalAllDonations, setTotalAllDonations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_amount: "",
    image_url: "",
    gallery_1: "",
    gallery_2: "",
    gallery_3: "",
    gallery_4: "",
    gallery_5: "",
    is_active: true
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- STATE TAMBAH PENCAIRAN (DARI EDIT PROGRAM) ---
  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState(false);
  const [isSubmittingDisbursement, setIsSubmittingDisbursement] = useState(false);
  const [disbursementData, setDisbursementData] = useState({
    nominal: "",
    tanggal_pencairan: "",
    keterangan: "",
    bukti_url: ""
  });

  // --- STATE MANAJEMEN PENCAIRAN (VIEW BARU) ---
  const [allPencairan, setAllPencairan] = useState<any[]>([]);
  const [loadingPencairan, setLoadingPencairan] = useState(false);
  const [isEditPencairanModalOpen, setIsEditPencairanModalOpen] = useState(false);
  const [editingPencairanId, setEditingPencairanId] = useState<string | null>(null);

  // --- FETCH DATA PROGRAMS ---
  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const { data: progs, error: progErr } = await supabase
        .from("donation_programs")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (progErr) throw progErr;

      const { data: dons, error: donErr } = await supabase
        .from("donations")
        .select("program_id, amount")
        .in("payment_status", ["success", "settled", "paid"]);

      if (donErr) throw donErr;

      let grandTotal = 0;
      const totalsMap: Record<string, number> = {};

      if (dons) {
        dons.forEach(d => {
          const amt = Number(d.amount) || 0;
          grandTotal += amt; 
          if (d.program_id) {
            totalsMap[d.program_id] = (totalsMap[d.program_id] || 0) + amt;
          }
        });
      }

      const enrichedPrograms = progs?.map(p => ({
        ...p,
        real_collected: totalsMap[p.id] || 0 
      })) || [];

      setPrograms(enrichedPrograms);
      setTotalAllDonations(grandTotal);

    } catch (error: any) {
      console.error("Gagal menarik data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH DATA SEMUA PENCAIRAN ---
  const fetchAllPencairan = async () => {
    setLoadingPencairan(true);
    try {
      const { data, error } = await supabase
        .from("pencairan_dana")
        .select(`
          *,
          donation_programs (title)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAllPencairan(data || []);
    } catch (error: any) {
      console.error("Gagal memuat data pencairan:", error.message);
      toast.error("Gagal memuat histori pencairan.");
    } finally {
      setLoadingPencairan(false);
    }
  };

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    fetchPrograms();

    const channel = supabase.channel("realtime-programs")
      .on("postgres_changes", { event: "*", schema: "public", table: "donation_programs" }, () => fetchPrograms())
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () => fetchPrograms())
      .on("postgres_changes", { event: "*", schema: "public", table: "pencairan_dana" }, () => {
        fetchPrograms();
        if (activeView === "pencairan") fetchAllPencairan();
      })
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [activeView]);

  // --- HANDLER: PROGRAM DONASI ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanPayload = {
      title: formData.title,
      description: formData.description,
      target_amount: Number(formData.target_amount) || 0,
      image_url: formData.image_url || null,
      gallery_1: formData.gallery_1 || null,
      gallery_2: formData.gallery_2 || null,
      gallery_3: formData.gallery_3 || null,
      gallery_4: formData.gallery_4 || null,
      gallery_5: formData.gallery_5 || null,
      is_active: formData.is_active
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("donation_programs").update(cleanPayload).eq("id", editingId);
        if (error) throw error;
        toast.success("Program berhasil diperbarui!");
      } else {
        const { error } = await supabase.from("donation_programs").insert([cleanPayload]);
        if (error) throw error;
        toast.success("Program baru berhasil ditambahkan!");
      }
      closeModal();
      fetchPrograms();
    } catch (error: any) {
      console.error("Error Detail:", error.message);
      toast.error(`Gagal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDisbursementModalOpen(false);
    setIsEditPencairanModalOpen(false);
    setEditingId(null);
    setEditingPencairanId(null);
    setFormData({ 
        title: "", description: "", target_amount: "", image_url: "", 
        gallery_1: "", gallery_2: "", gallery_3: "", gallery_4: "", gallery_5: "",
        is_active: true 
    });
    setDisbursementData({ nominal: "", tanggal_pencairan: "", keterangan: "", bukti_url: "" });
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setFormData({
      title: p.title,
      description: p.description || "",
      target_amount: p.target_amount?.toString() || "",
      image_url: p.image_url || "",
      gallery_1: p.gallery_1 || "",
      gallery_2: p.gallery_2 || "",
      gallery_3: p.gallery_3 || "",
      gallery_4: p.gallery_4 || "",
      gallery_5: p.gallery_5 || "",
      is_active: p.is_active
    });
    setIsModalOpen(true);
  };

  // --- HANDLER: PENCAIRAN DANA ---
  const handleDisbursementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDisbursement(true);
    
    try {
      const payload = {
        nominal: Number(disbursementData.nominal) || 0,
        tanggal_pencairan: disbursementData.tanggal_pencairan,
        keterangan: disbursementData.keterangan,
        bukti_url: disbursementData.bukti_url || null
      };

      if (editingPencairanId) {
        // Mode Update (Dari View Data Pencairan)
        const { error } = await supabase.from("pencairan_dana").update(payload).eq("id", editingPencairanId);
        if (error) throw error;
        toast.success("Data pencairan berhasil diupdate!");
        closeModal();
        fetchAllPencairan();
      } else if (editingId) {
        // Mode Insert (Dari Modal Edit Program)
        const { error } = await supabase.from("pencairan_dana").insert([{ ...payload, program_id: editingId }]);
        if (error) throw error;
        toast.success("Data pencairan dana berhasil dilaporkan!");
        setDisbursementData({ nominal: "", tanggal_pencairan: "", keterangan: "", bukti_url: "" });
        setIsDisbursementModalOpen(false);
      }
    } catch (error: any) {
      console.error("Error Detail:", error.message);
      toast.error(`Gagal: ${error.message}`);
    } finally {
      setIsSubmittingDisbursement(false);
    }
  };

  const openEditPencairan = (p: any) => {
    setEditingPencairanId(p.id);
    setDisbursementData({
      nominal: p.nominal?.toString() || "",
      tanggal_pencairan: p.tanggal_pencairan || "",
      keterangan: p.keterangan || "",
      bukti_url: p.bukti_url || ""
    });
    setIsEditPencairanModalOpen(true);
  };

  const handleDeletePencairan = async (id: string) => {
    if (!confirm('Yakin ingin menghapus riwayat pencairan ini?')) return;
    try {
      const { error } = await supabase.from('pencairan_dana').delete().eq('id', id);
      if (error) throw error;
      toast.success("Data pencairan berhasil dihapus.");
      fetchAllPencairan();
    } catch (err: any) {
      toast.error(`Gagal menghapus: ${err.message}`);
    }
  };

  const exportToExcel = () => {
    if (allPencairan.length === 0) {
      toast.error("Tidak ada data untuk diexport");
      return;
    }

    const headers = ["ID", "Program", "Nominal", "Tanggal Pencairan", "Keterangan", "Bukti URL", "Dibuat Pada"];
    
    const csvContent = [
      headers.join(","),
      ...allPencairan.map(p => {
        // Menghindari error comma delimiter pada CSV jika ada koma di text
        const safeProgram = `"${p.donation_programs?.title || 'Unknown Program'}"`;
        const safeKeterangan = `"${(p.keterangan || "").replace(/"/g, '""')}"`;
        
        return [
          p.id,
          safeProgram,
          p.nominal,
          p.tanggal_pencairan,
          safeKeterangan,
          p.bukti_url || "",
          new Date(p.created_at).toLocaleString('id-ID')
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Pencairan_Dana_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPrograms = programs.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()));
  const isDisbursementValid = disbursementData.nominal && disbursementData.tanggal_pencairan && disbursementData.keterangan;

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex text-[#1A1A1A]">
      <AdminSidebar isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      <main className="flex-grow ml-0 md:ml-64 pt-16 md:pt-0 p-4 md:p-6 lg:p-10 transition-all">
        
        {/* =========================================
            VIEW 1: MANAJEMEN PROGRAM DONASI
        ========================================= */}
        {activeView === "programs" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">Program Donasi</h1>
                <p className="text-muted-foreground mt-1 font-medium italic text-sm md:text-base">Manajemen program secara real-time.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => { setActiveView("pencairan"); fetchAllPencairan(); }} 
                  className="flex items-center justify-center gap-2 bg-white text-[#1A1A1A] border border-gray-200 px-6 py-4 rounded-2xl font-black hover:bg-gray-50 shadow-sm transition-all hover:-translate-y-1"
                >
                  <List size={20} /> Data Pencairan
                </button>
                <button 
                  onClick={() => { closeModal(); setIsModalOpen(true); }} 
                  className="flex items-center justify-center gap-2 bg-[#1A1A1A] text-white px-6 py-4 rounded-2xl font-black hover:bg-zinc-800 shadow-xl transition-all hover:-translate-y-1"
                >
                  <Plus size={20} /> Tambah Program
                </button>
              </div>
            </header>

            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                  <Wallet size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Pemasukan Seluruh Program</p>
                  <p className="text-3xl font-black text-[#1A1A1A] tracking-tighter">
                    Rp {totalAllDonations.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl border border-green-100">
                <TrendingUp size={16} />
                <span className="text-xs font-black uppercase tracking-widest">Real-time Sinkron</span>
              </div>
            </div>

            <div className="relative max-w-md mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Cari program..." className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-zinc-400 font-bold" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPrograms.map((p) => {
                const collected = p.real_collected || 0;
                const target = p.target_amount || 1; 
                const percent = Math.min((collected / target) * 100, 100);

                return (
                  <motion.div key={p.id} className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="h-52 bg-gray-100 relative">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><ImageIcon size={48} /></div>
                      )}
                      <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${p.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                        {p.is_active ? 'Aktif' : 'Draft'}
                      </div>
                    </div>
                    
                    <div className="p-8 flex-grow">
                      <h3 className="text-xl font-black mb-3 line-clamp-1">{p.title}</h3>
                      <p className="text-sm text-muted-foreground mb-8 line-clamp-2 font-medium">{p.description}</p>
                      
                      <div className="space-y-3 mb-2">
                        <div className="flex items-end justify-between text-[10px] font-black uppercase tracking-widest">
                          <div>
                            <span className="text-gray-400 block mb-1">Terkumpul</span>
                            <span className="text-orange-500 text-sm">Rp {collected.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-400 block mb-1">Target</span>
                            <span className="text-black">Rp {p.target_amount?.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                        
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${percent >= 100 ? 'bg-green-500' : 'bg-orange-500'}`} 
                          />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 text-right">{percent.toFixed(1)}% Tercapai</p>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex gap-3">
                      <button onClick={() => openEdit(p)} className="flex-grow py-4 rounded-2xl bg-white border border-gray-200 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 hover:text-white transition-all shadow-sm">
                        Edit Program
                      </button>
                      <button onClick={async () => { if(confirm('Yakin ingin menghapus program ini?')) await supabase.from('donation_programs').delete().eq('id', p.id) }} className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* =========================================
            VIEW 2: DATA PENCAIRAN DANA KESELURUHAN
        ========================================= */}
        {activeView === "pencairan" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveView("programs")} className="p-3 bg-white border border-gray-200 hover:bg-gray-100 rounded-2xl transition-all shadow-sm">
                  <ArrowLeft size={24} />
                </button>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight">Data Pencairan Dana</h1>
                  <p className="text-muted-foreground mt-1 font-medium italic text-sm md:text-base">Seluruh histori penarikan dana untuk transparansi donatur.</p>
                </div>
              </div>
              <button 
                onClick={exportToExcel}
                className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-green-700 shadow-xl transition-all hover:-translate-y-1"
              >
                <Download size={20} /> Download Excel
              </button>
            </header>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                {loadingPencairan ? (
                  <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
                ) : allPencairan.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 font-bold">Belum ada riwayat pencairan dana.</div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <th className="p-6">Program Donasi</th>
                        <th className="p-6">Tanggal</th>
                        <th className="p-6">Nominal (Rp)</th>
                        <th className="p-6">Keterangan</th>
                        <th className="p-6">Bukti</th>
                        <th className="p-6 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                      {allPencairan.map((penc) => (
                        <tr key={penc.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="p-6 font-bold text-gray-800 max-w-[200px] truncate" title={penc.donation_programs?.title}>
                            {penc.donation_programs?.title || "Program Tidak Diketahui"}
                          </td>
                          <td className="p-6 whitespace-nowrap">{penc.tanggal_pencairan}</td>
                          <td className="p-6 font-bold text-orange-600">Rp {penc.nominal?.toLocaleString('id-ID')}</td>
                          <td className="p-6 max-w-[250px] truncate" title={penc.keterangan}>{penc.keterangan}</td>
                          <td className="p-6">
                            {penc.bukti_url ? (
                              <a href={penc.bukti_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-bold text-xs">Lihat Link</a>
                            ) : (
                              <span className="text-gray-300 text-xs italic">-</span>
                            )}
                          </td>
                          <td className="p-6 flex items-center justify-center gap-2">
                            <button onClick={() => openEditPencairan(penc)} className="p-2 text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100 rounded-lg transition-all">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeletePencairan(penc.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* =========================================
            MODAL AREA
        ========================================= */}
        {(isModalOpen || isEditPencairanModalOpen) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto relative overflow-x-hidden">
              
              <AnimatePresence mode="wait">
                {isEditPencairanModalOpen ? (
                  // --- MODAL: EDIT DATA PENCAIRAN (DARI VIEW PENCAIRAN) ---
                  <motion.div key="edit-pencairan-form" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <div className="flex items-center justify-between mb-10">
                      <div>
                        <h2 className="text-3xl font-black">Edit Pencairan</h2>
                        <p className="text-muted-foreground text-sm font-medium mt-1">Perbarui histori pencairan dana.</p>
                      </div>
                      <button onClick={closeModal} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"><X /></button>
                    </div>
                    
                    <form onSubmit={handleDisbursementSubmit} className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nominal Pencairan (Rp)*</label>
                        <input type="number" min="0" value={disbursementData.nominal} onChange={e => setDisbursementData({...disbursementData, nominal: e.target.value})} onKeyDown={(e) => { if (["e", "E", "-", "+", ".", ","].includes(e.key)) e.preventDefault(); }} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-400 font-bold" required />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tanggal Pencairan*</label>
                        <input type="date" value={disbursementData.tanggal_pencairan} onChange={e => setDisbursementData({...disbursementData, tanggal_pencairan: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-400 font-bold" required />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Keterangan Penggunaan Dana*</label>
                        <textarea rows={4} value={disbursementData.keterangan} onChange={e => setDisbursementData({...disbursementData, keterangan: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-400 font-bold" required />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bukti URL (Kuitansi)</label>
                        <input type="url" value={disbursementData.bukti_url} onChange={e => setDisbursementData({...disbursementData, bukti_url: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-400 font-bold" placeholder="https://..." />
                      </div>

                      <button type="submit" disabled={!isDisbursementValid || isSubmittingDisbursement} className={`py-6 mt-4 font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl ${!isDisbursementValid ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 hover:scale-[1.02] active:scale-95'}`}>
                        {isSubmittingDisbursement ? <Loader2 className="animate-spin" /> : <Save size={20} />} Update Pencairan
                      </button>
                    </form>
                  </motion.div>

                ) : isDisbursementModalOpen ? (
                  // --- MODAL: INSERT PENCAIRAN (DARI EDIT PROGRAM) ---
                  <motion.div key="disbursement-form" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <div className="flex items-center gap-4 mb-10">
                      <button onClick={() => setIsDisbursementModalOpen(false)} className="p-3 hover:bg-gray-100 rounded-full transition-all">
                        <ArrowLeft />
                      </button>
                      <div>
                        <h2 className="text-3xl font-black">Report Pencairan</h2>
                        <p className="text-muted-foreground text-sm font-medium mt-1">Transparansi penggunaan dana donatur.</p>
                      </div>
                    </div>
                    
                    <form onSubmit={handleDisbursementSubmit} className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nominal Pencairan (Rp)*</label>
                        <input type="number" min="0" value={disbursementData.nominal} onChange={e => setDisbursementData({...disbursementData, nominal: e.target.value})} onKeyDown={(e) => { if (["e", "E", "-", "+", ".", ","].includes(e.key)) e.preventDefault(); }} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-400 font-bold" placeholder="Contoh: 5000000" required />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tanggal Pencairan*</label>
                        <input type="date" value={disbursementData.tanggal_pencairan} onChange={e => setDisbursementData({...disbursementData, tanggal_pencairan: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-400 font-bold" required />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Keterangan Penggunaan Dana*</label>
                        <textarea rows={4} value={disbursementData.keterangan} onChange={e => setDisbursementData({...disbursementData, keterangan: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-400 font-bold" placeholder="Dana dicairkan untuk membeli..." required />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bukti URL (Kuitansi / Dokumentasi)</label>
                        <input type="url" value={disbursementData.bukti_url} onChange={e => setDisbursementData({...disbursementData, bukti_url: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-400 font-bold" placeholder="https://..." />
                      </div>

                      <button type="submit" disabled={!isDisbursementValid || isSubmittingDisbursement} className={`py-6 mt-4 font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl ${!isDisbursementValid ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 hover:scale-[1.02] active:scale-95'}`}>
                        {isSubmittingDisbursement ? <Loader2 className="animate-spin" /> : <Save size={20} />} Simpan Pencairan
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  // --- MODAL: EDIT/TAMBAH PROGRAM UTAMA ---
                  <motion.div key="main-form" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 50, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <div className="flex items-center justify-between mb-10">
                      <h2 className="text-3xl font-black">{editingId ? "Edit Program" : "Program Baru"}</h2>
                      <button onClick={closeModal} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"><X /></button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Judul Program</label>
                        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-400 font-bold" required />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Deskripsi</label>
                        <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-400 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Donasi (Rp)</label>
                        <input type="number" min="0" value={formData.target_amount} onChange={e => setFormData({...formData, target_amount: e.target.value})} onKeyDown={(e) => { if (["e", "E", "-", "+", ".", ","].includes(e.key)) e.preventDefault(); }} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-400 font-bold" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Foto Profil Utama (URL)</label>
                        <input type="url" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-400 font-bold" placeholder="https://..." />
                      </div>

                      {/* BAGIAN GALLERY */}
                      <div className="md:col-span-2 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2 mb-4">
                              <ImageIcon size={16} className="text-orange-500" />
                              <label className="text-[10px] font-black uppercase tracking-widest text-gray-800">Gallery Dokumentasi (Slide Tengah)</label>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                              {[1, 2, 3, 4, 5].map((num) => (
                                  <input 
                                      key={num}
                                      type="url" 
                                      placeholder={`Link Gambar Slide ${num} (URL)`}
                                      value={(formData as any)[`gallery_${num}`]} 
                                      onChange={e => setFormData({...formData, [`gallery_${num}`]: e.target.value})} 
                                      className="w-full px-6 py-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl outline-none text-xs font-bold focus:border-zinc-400 transition-all" 
                                  />
                              ))}
                          </div>
                      </div>

                      <div className="md:col-span-2 flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100 mt-2">
                        <div className="flex items-center gap-3">
                          <Power className={formData.is_active ? "text-green-500" : "text-gray-400"} />
                          <span className="text-xs font-black uppercase tracking-widest text-gray-700">Tampilkan di Halaman Utama</span>
                        </div>
                        <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-6 h-6 accent-zinc-800 cursor-pointer" />
                      </div>
                      
                      {/* TOMBOL REPORT PENCAIRAN (MUNCUL SAAT EDIT AJA) */}
                      {editingId && (
                        <div className="md:col-span-2 pt-6 border-t border-gray-100 flex flex-col gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Transparansi Dana</label>
                          <button 
                            type="button" 
                            onClick={() => setIsDisbursementModalOpen(true)} 
                            className="w-full py-4 bg-orange-50 text-orange-600 border border-orange-100 font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-orange-100 transition-all shadow-sm"
                          >
                            <FileText size={18} /> Report Pencairan Dana Baru
                          </button>
                        </div>
                      )}

                      <button type="submit" disabled={loading} className="md:col-span-2 py-6 mt-4 bg-[#1A1A1A] text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-xl hover:scale-[1.02] active:scale-95">
                        {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} Simpan Perubahan
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
              
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}