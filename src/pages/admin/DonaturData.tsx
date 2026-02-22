import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar from "@/components/AdminSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Calculator } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function DonaturData() {
  const [activeTab, setActiveTab] = useState("semua"); // "semua", "donasi", "keberlanjutan"
  const [search, setSearch] = useState("");
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      // Mengambil data dari tabel donations & join dengan nama program
      const { data, error } = await supabase
        .from("donations")
        .select(`
          id, donor_name, amount, sustainability_amount, payment_status, created_at,
          donation_programs ( title )
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
    // Realtime listener
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () => fetchDonations())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  // 1. Logika Filter Pencarian & Tab
  const filteredData = donations.filter((d) => {
    const nameMatch = (d.donor_name || "Hamba Allah").toLowerCase().includes(search.toLowerCase());
    
    // Filter berdasarkan Tab
    if (activeTab === "keberlanjutan") return nameMatch && (Number(d.sustainability_amount) || 0) > 0;
    return nameMatch;
  });

  // 2. Kalkulasi Total Dinamis (HANYA YANG LUNAS/SUCCESS)
  const totalAccumulated = filteredData
    .filter(item => item.payment_status === 'success' || item.payment_status === 'settled' || item.payment_status === 'paid')
    .reduce((acc, item) => {
      let amt = Number(item.amount || 0);
      let sAmt = Number(item.sustainability_amount || 0);
      
      let displayAmount = amt;
      if (activeTab === "donasi") displayAmount = amt - sAmt; // Murni donasi program
      if (activeTab === "keberlanjutan") displayAmount = sAmt; // Murni tip platform

      return acc + displayAmount;
    }, 0);

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex text-[#1A1A1A]">
      <AdminSidebar />
      <main className="flex-grow md:ml-64 p-6 md:p-10 transition-all">
        <header className="mb-10">
          <h1 className="text-4xl font-black tracking-tight">Data Donatur</h1>
          <p className="text-muted-foreground mt-1 font-medium italic">
            Monitoring kontribusi program donasi
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
          
          <div className="flex gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 w-fit">
            {["semua", "donasi", "keberlanjutan"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab ? "bg-white text-gold shadow-sm" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* TABEL DATA */}
        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50">Donatur</th>
                  <th className="px-8 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50">Program</th>
                  <th className="px-8 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50 text-right">Nominal</th>
                  <th className="px-8 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50">Waktu</th>
                  <th className="px-8 py-6 font-black text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    <tr><td colSpan={5} className="py-24 text-center text-xs font-black text-gray-400 uppercase tracking-widest">Menyiapkan Data...</td></tr>
                  ) : filteredData.length === 0 ? (
                    <tr><td colSpan={5} className="py-24 text-center text-sm font-bold text-gray-400">Belum ada donasi yang sesuai.</td></tr>
                  ) : (
                    filteredData.map((item) => {
                      // Ambil nominal sesuai tab
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
                            <span className="px-3 py-1.5 bg-gray-100 rounded-lg text-[10px] font-black uppercase text-gray-500 tracking-tight">
                              {activeTab === 'keberlanjutan' ? "Sumbangan Platform" : (item.donation_programs?.title || "Program Umum")}
                            </span>
                          </td>
                          <td className="px-8 py-6 font-black text-[#1A1A1A] text-right text-sm">
                            <span className={activeTab === 'keberlanjutan' ? 'text-gold' : ''}>
                              Rp {displayAmount.toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-xs font-bold text-gray-500">
                            {item.created_at ? format(new Date(item.created_at), "dd MMM yyyy HH:mm", { locale: localeId }) : "-"} WIB
                          </td>
                          <td className="px-8 py-6 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center justify-center w-fit mx-auto ${
                              isSuccess ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                            }`}>
                              {item.payment_status || 'PENDING'}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* FOOTER RINGKASAN: Menghitung Akumulasi Sukses */}
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
    </div>
  );
}