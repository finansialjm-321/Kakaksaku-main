import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar from "@/components/AdminSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Edit2, Trash2, Save, X, 
  Target, Image as ImageIcon, Power, Loader2, Wallet, TrendingUp
} from "lucide-react";
import { toast } from "sonner";

export default function ProgramDonasi() {
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
    is_active: true
  });

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      // 1. Tarik data semua program
      const { data: progs, error: progErr } = await supabase
        .from("donation_programs")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (progErr) throw progErr;

      // 2. Tarik SEMUA donasi yang sudah LUNAS (success / settled)
      const { data: dons, error: donErr } = await supabase
        .from("donations")
        .select("program_id, amount")
        .in("payment_status", ["success", "settled", "paid"]);

      if (donErr) throw donErr;

      // 3. Olah datanya: Hitung total per-program & total keseluruhan
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

      // 4. Gabungkan total donasi asli ke dalam data program
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

  useEffect(() => {
    fetchPrograms();

    const channel = supabase.channel("realtime-programs")
      .on("postgres_changes", { event: "*", schema: "public", table: "donation_programs" }, () => fetchPrograms())
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () => fetchPrograms())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanPayload = {
      title: formData.title,
      description: formData.description,
      target_amount: Number(formData.target_amount) || 0,
      image_url: formData.image_url || null,
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
    setEditingId(null);
    setFormData({ title: "", description: "", target_amount: "", image_url: "", is_active: true });
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setFormData({
      title: p.title,
      description: p.description || "",
      target_amount: p.target_amount?.toString() || "",
      image_url: p.image_url || "",
      is_active: p.is_active
    });
    setIsModalOpen(true);
  };

  const filteredPrograms = programs.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex text-[#1A1A1A]">
      <AdminSidebar />
      <main className="flex-grow ml-20 md:ml-64 p-6 md:p-10 transition-all">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Program Donasi</h1>
            <p className="text-muted-foreground mt-1 font-medium italic">Manajemen program secara real-time.</p>
          </div>
          <button onClick={() => { closeModal(); setIsModalOpen(true); }} className="flex items-center gap-2 bg-[#1A1A1A] text-white px-8 py-4 rounded-2xl font-black hover:bg-zinc-800 shadow-xl transition-all hover:scale-105 active:scale-95">
            <Plus size={20} /> Tambah Program
          </button>
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
                    
                    {/* Progress Bar Visual - DIUBAH KE WARNA ORANGE */}
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

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
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
                  <input type="number" value={formData.target_amount} onChange={e => setFormData({...formData, target_amount: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-400 font-bold" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">URL Gambar Valid</label>
                  <input type="url" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-400 font-bold" placeholder="https://..." />
                </div>
                <div className="md:col-span-2 flex items-center justify-between p-6 bg-gray-50 rounded-2xl border border-gray-100 mt-2">
                  <div className="flex items-center gap-3">
                    <Power className={formData.is_active ? "text-green-500" : "text-gray-400"} />
                    <span className="text-xs font-black uppercase tracking-widest text-gray-700">Tampilkan di Halaman Utama</span>
                  </div>
                  <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-6 h-6 accent-zinc-800 cursor-pointer" />
                </div>
                <button type="submit" disabled={loading} className="md:col-span-2 py-6 mt-4 bg-[#1A1A1A] text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all shadow-xl hover:scale-[1.02] active:scale-95">
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />} Simpan Perubahan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}