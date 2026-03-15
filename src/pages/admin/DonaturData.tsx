import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar, { MobileHeader } from "@/components/AdminSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calculator, Eye, X, Mail, Phone, Calendar, User, Briefcase, Download } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function DonaturData() {
  const [activeTab, setActiveTab] = useState("semua"); 
  const [search, setSearch] = useState("");
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // STATE BARU: Untuk nampilin Modal Detail Profil
  const [selectedDonatur, setSelectedDonatur] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      // REVISI: Tambahin join ke tabel profiles buat narik data lengkap registrasi
      const { data, error } = await supabase
        .from("donations")
        .select(`
          id, donor_name, amount, sustainability_amount, payment_status, created_at,
          donation_programs ( title ),
          profiles ( email, no_wa, tanggal_lahir, jenis_kelamin, kesibukan )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDonations(data || []);
    } catch (error: any) {
      console.error("Gagal mengambil data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () => fetchDonations())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredData = donations.filter((d) => {
    const nameMatch = (d.donor_name || "Hamba Allah").toLowerCase().includes(search.toLowerCase());
    if (activeTab === "keberlanjutan") return nameMatch && (Number(d.sustainability_amount) || 0) > 0;
    return nameMatch;
  });

  const totalAccumulated = filteredData
    .filter(item => item.payment_status === 'success' || item.payment_status === 'settled' || item.payment_status === 'paid')
    .reduce((acc, item) => {
      let amt = Number(item.amount || 0);
      let sAmt = Number(item.sustainability_amount || 0);
      let displayAmount = amt;
      
      if (activeTab === "donasi") displayAmount = amt - sAmt; 
      if (activeTab === "keberlanjutan") displayAmount = sAmt; 

      return acc + displayAmount;
    }, 0);

  // FUNGSI BARU: Untuk Export Data format Excel (CSV teroptimasi)
  const handleExportExcel = () => {
    if (filteredData.length === 0) return alert("Tidak ada data untuk di-export!");

    // 1. Buat Header (Pakai titik koma biar otomatis jadi kolom di Excel versi Indonesia)
    const headers = ["Nama Donatur", "Program", "Nominal (Rp)", "Waktu", "Status", "Email", "No WhatsApp", "Tanggal Lahir", "Gender", "Kesibukan"];

    // 2. Looping data yang ada di tabel saat ini
    const excelRows = filteredData.map(item => {
      let amt = Number(item.amount || 0);
      let sAmt = Number(item.sustainability_amount || 0);
      let displayAmount = amt;
      if (activeTab === "donasi") displayAmount = amt - sAmt;
      if (activeTab === "keberlanjutan") displayAmount = sAmt;

      const programName = activeTab === 'keberlanjutan' ? "Sumbangan Platform" : (item.donation_programs?.title || "Program Umum");
      const donaturName = item.donor_name || 'Hamba Allah';
      const time = item.created_at ? format(new Date(item.created_at), "dd-MM-yyyy HH:mm") : "-";

      // PENTING: Pakai petik ganda biar format text aman, dan petik satu buat No WA biar ga jadi angka error di Excel
      return [
        `"${donaturName}"`,
        `"${programName}"`,
        displayAmount,
        `"${time}"`,
        `"${item.payment_status || 'PENDING'}"`,
        `"${item.profiles?.email || '-'}"`,
        `'${item.profiles?.no_wa || '-'}'`, 
        `"${item.profiles?.tanggal_lahir || '-'}"`,
        `"${item.profiles?.jenis_kelamin || '-'}"`,
        `"${item.profiles?.kesibukan || '-'}"`
      ].join(";"); // Pakai semicolon (;) buat kompatibilitas Excel yang lebih baik
    });

    // 3. Gabung Header dan Baris Data (tambah BOM \uFEFF biar Excel baca karakter khusus dengan bener)
    const excelContent = "\uFEFF" + [headers.join(";"), ...excelRows].join("\n");

    // 4. Bikin file blob dan trigger download
    const blob = new Blob([excelContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_Donatur_Kakasaku_${activeTab}_${format(new Date(), "dd-MMM-yyyy")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex text-[#1A1A1A]">
      <AdminSidebar isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      <main className="flex-grow md:ml-64 pt-16 md:pt-0 p-4 md:p-6 lg:p-10 transition-all">
        <header className="mb-6 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Data Donatur</h1>
          <p className="text-muted-foreground mt-1 font-medium italic text-sm md:text-base">
            Monitoring kontribusi program donasi & profil donatur
          </p>
        </header>

        {/* TOOLBAR */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama donatur..."
              className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:border-gold/30 transition-all font-bold text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {/* Wrapper buat Tabs dan Tombol Excel biar rapi */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 w-fit">
              {["semua", "donasi", "keberlanjutan"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)} 
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    activeTab === tab ? "bg-white text-gold shadow-sm" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* TOMBOL EXPORT EXCEL DI SINI */}
            <button 
              onClick={handleExportExcel}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2 px-5 py-3 bg-[#1A1A1A] text-white rounded-xl shadow-sm hover:bg-gold transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Download size={16} className="text-white group-hover:text-[#1A1A1A] transition-colors" />
              Download Excel
            </button>
          </div>
        </div>

        {/* TABEL DATA */}
        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col relative z-10">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50">Donatur</th>
                  <th className="px-8 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50">Program</th>
                  <th className="px-8 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50 text-right">Nominal</th>
                  <th className="px-8 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50">Waktu</th>
                  <th className="px-8 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50 text-center">Status</th>
                  {/* REVISI: Kolom Baru buat Aksi */}
                  <th className="px-8 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50 text-center">Profil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <tr><td colSpan={6} className="py-24 text-center text-xs font-black text-gray-400 uppercase tracking-widest">Menyiapkan Data...</td></tr>
                  ) : filteredData.length === 0 ? (
                    <tr><td colSpan={6} className="py-24 text-center text-sm font-bold text-gray-400">Belum ada donasi yang sesuai.</td></tr>
                  ) : (
                    filteredData.map((item) => {
                      let amt = Number(item.amount || 0);
                      let sAmt = Number(item.sustainability_amount || 0);
                      let displayAmount = amt;
                      if (activeTab === "donasi") displayAmount = amt - sAmt;
                      if (activeTab === "keberlanjutan") displayAmount = sAmt;

                      const donaturName = item.donor_name || 'Hamba Allah';
                      const isSuccess = item.payment_status === 'success' || item.payment_status === 'settled';

                      return (
                        <motion.tr 
                          key={item.id} 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          className="hover:bg-gray-50/30 transition-colors group"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gold/10 flex items-center justify-center text-gold font-black text-xs uppercase shrink-0">
                                {donaturName.charAt(0)}
                              </div>
                              <span className="font-black text-sm group-hover:text-gold transition-colors">{donaturName}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-[10px] font-black uppercase text-gray-500 tracking-tight whitespace-nowrap">
                              {activeTab === 'keberlanjutan' ? "Sumbangan Platform" : (item.donation_programs?.title || "Program Umum")}
                            </span>
                          </td>
                          <td className="px-8 py-6 font-black text-[#1A1A1A] text-right text-sm whitespace-nowrap">
                            <span className={activeTab === 'keberlanjutan' ? 'text-gold' : ''}>
                              Rp {displayAmount.toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-xs font-bold text-gray-500 whitespace-nowrap">
                            {item.created_at ? format(new Date(item.created_at), "dd MMM yyyy", { locale: localeId }) : "-"}
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center w-fit mx-auto ${
                              isSuccess ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              {item.payment_status || 'PENDING'}
                            </span>
                          </td>
                          {/* REVISI: Tombol Lihat Profil */}
                          <td className="px-8 py-6 text-center">
                            <button 
                              onClick={() => setSelectedDonatur(item)}
                              className="p-2 text-gray-400 bg-gray-50 rounded-xl hover:text-gold hover:bg-gold/10 transition-all mx-auto block group-hover:bg-white group-hover:border group-hover:border-gray-100 shadow-sm"
                              title="Lihat Detail Profil"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {!loading && filteredData.length > 0 && (
            <div className="bg-gray-50/50 p-6 flex flex-row items-center justify-between border-t border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gold shadow-sm border border-gray-100">
                  <Calculator size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ringkasan Tab {activeTab}</p>
                  <p className="text-sm font-black text-[#1A1A1A]">{filteredData.length} Total Transaksi</p>
                </div>
              </div>

              <div className="bg-white px-8 py-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col items-end">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Dana Lunas</p>
                <p className="text-2xl font-black text-gold tracking-tighter">
                  Rp {totalAccumulated.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* MODAL DETAIL PROFIL */}
      <AnimatePresence>
        {selectedDonatur && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-[#1A1A1A]">Profil Donatur</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Detail Transaksi & Personal</p>
                  </div>
                  <button 
                    onClick={() => setSelectedDonatur(null)}
                    className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-[#1A1A1A] hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Info Transaksi */}
                  <div className="p-5 bg-gold/5 rounded-2xl border border-gold/10 mb-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gold mb-1">Nama Di Transaksi</p>
                    <p className="text-lg font-black text-[#1A1A1A]">{selectedDonatur.donor_name || 'Hamba Allah'}</p>
                  </div>

                  {selectedDonatur.profiles ? (
                    <>
                      {/* Info dari Join Tabel Profiles */}
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm shrink-0"><Mail size={18} /></div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Email</p>
                          <p className="text-sm font-bold text-[#1A1A1A]">{selectedDonatur.profiles.email || "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm shrink-0"><Phone size={18} /></div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">No. WhatsApp</p>
                          <p className="text-sm font-bold text-[#1A1A1A]">{selectedDonatur.profiles.no_wa || "-"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <Calendar size={16} className="text-gray-400 mb-3" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Tanggal Lahir</p>
                          <p className="text-sm font-bold text-[#1A1A1A]">{selectedDonatur.profiles.tanggal_lahir || "-"}</p>
                        </div>
                        <div className="flex flex-col p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <User size={16} className="text-gray-400 mb-3" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Gender</p>
                          <p className="text-sm font-bold text-[#1A1A1A] capitalize">{selectedDonatur.profiles.jenis_kelamin || "-"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm shrink-0"><Briefcase size={18} /></div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">Kesibukan</p>
                          <p className="text-sm font-bold text-[#1A1A1A] capitalize">{selectedDonatur.profiles.kesibukan || "-"}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100 border-dashed mt-4">
                      <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-400 leading-relaxed">
                        Data profil tidak tersedia. Donatur ini mungkin melakukan donasi tanpa login (Guest).
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}