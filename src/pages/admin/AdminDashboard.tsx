import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import AdminSidebar from "@/components/AdminSidebar";
import { 
  Users, 
  Wallet, 
  HeartHandshake, 
  ArrowUpRight, 
  Loader2,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// Komponen Kartu Statistik
const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between"
  >
    <div className="flex justify-between items-start mb-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={28} />
      </div>
      <span className="flex items-center gap-1 text-green-600 text-[10px] font-black bg-green-50 px-3 py-1 rounded-full uppercase tracking-tighter">
        Live <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
      </span>
    </div>
    <div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{title}</p>
      <h3 className="text-3xl font-black text-[#1A1A1A] tracking-tighter">{value}</h3>
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalDonaturDonasi: 0,
    totalDonaturKakaksaku: 0,
    totalNominalDonasi: 0,
    totalProgramAktif: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // 1. Hitung Total Donatur (Berdasarkan transaksi unik di table donations)
      const { count: countDonasi } = await supabase.from("donations").select("*", { count: 'exact', head: true });
      
      // 2. PERBAIKAN TYPO: Hitung Total Donatur Kakaksaku (kakasaku_subscriptions)
      const { count: countSaku } = await supabase.from("kakasaku_subscriptions").select("*", { count: 'exact', head: true }).eq("status", "active");

      // 3. Hitung Total Nominal (Sum Amount yang Success)
      const { data: amountData } = await supabase.from("donations").select("amount").eq("payment_status", "success");
      const totalAmount = amountData?.reduce((acc, curr) => acc + Number(curr.amount || 0), 0) || 0;

      // 4. Hitung Program Aktif
      const { count: countProgram } = await supabase.from("donation_programs").select("*", { count: 'exact', head: true }).eq("is_active", true);

      // 5. Ambil Aktivitas Terbaru
      const { data: recent } = await supabase
        .from("donations")
        .select(`id, donor_name, amount, payment_status, created_at, donation_programs ( title )`)
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        totalDonaturDonasi: countDonasi || 0,
        totalDonaturKakaksaku: countSaku || 0,
        totalNominalDonasi: totalAmount,
        totalProgramAktif: countProgram || 0
      });
      setRecentActivities(recent || []);
    } catch (error) {
      console.error("Gagal memuat data dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // REAL-TIME ENGINE: PERBAIKAN TYPO DI LISTENER TABEL
    const channel = supabase
      .channel("dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () => fetchDashboardData())
      .on("postgres_changes", { event: "*", schema: "public", table: "donation_programs" }, () => fetchDashboardData())
      .on("postgres_changes", { event: "*", schema: "public", table: "kakasaku_subscriptions" }, () => fetchDashboardData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex text-[#1A1A1A]">
      <AdminSidebar />

      <main className="flex-grow ml-20 md:ml-64 transition-all duration-300 p-6 md:p-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Admin Overview</h1>
            <p className="text-muted-foreground font-medium italic">Monitoring aktivitas hari ini.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white p-2 pr-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-zinc-400 flex items-center justify-center font-black text-white shadow-inner">A</div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Super Admin</p>
                <p className="text-sm font-black">Admin JM25</p>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Donatur Donasi" value={stats.totalDonaturDonasi} icon={Users} color="bg-blue-50 text-blue-600" />
          <StatCard title="Donatur Kakaksaku" value={stats.totalDonaturKakaksaku} icon={HeartHandshake} color="bg-pink-50 text-pink-600" />
          <StatCard title="Total Donasi" value={`Rp ${stats.totalNominalDonasi.toLocaleString('id-ID')}`} icon={Wallet} color="bg-gold/10 text-gold" />
          <StatCard title="Program Aktif" value={stats.totalProgramAktif} icon={ArrowUpRight} color="bg-zinc-100 text-zinc-900" />
        </div>

        <section className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-zinc-400">
                <Clock size={20} />
              </div>
              <h2 className="text-xl font-black tracking-tight">Aktivitas Donasi Terbaru</h2>
            </div>
            <a href="/admin/donatur" className="text-gold font-black text-xs uppercase tracking-widest hover:underline">Lihat Semua Laporan</a>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="pb-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Donatur</th>
                  <th className="pb-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Program</th>
                  <th className="pb-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Nominal</th>
                  <th className="pb-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">Status</th>
                  <th className="pb-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-right">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-gold" /></td></tr>
                ) : recentActivities.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center font-bold text-muted-foreground italic">Belum ada donasi masuk.</td></tr>
                ) : (
                  recentActivities.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="py-6 font-black text-sm">{row.donor_name}</td>
                      <td className="py-6 text-xs text-muted-foreground font-bold">
                        {row.donation_programs?.title || "Umum"}
                      </td>
                      <td className="py-6 font-black text-sm text-[#1A1A1A]">
                        Rp {Number(row.amount || 0).toLocaleString('id-ID')}
                      </td>
                      <td className="py-6 text-center">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          row.payment_status === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}>
                          {row.payment_status === 'success' ? 'Selesai' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-6 text-right text-[10px] font-black text-muted-foreground uppercase">
                        {row.created_at ? format(new Date(row.created_at), "dd MMM, HH:mm", { locale: localeId }) : "-"} WIB
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}