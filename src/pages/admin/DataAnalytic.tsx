import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar, { MobileHeader } from "@/components/AdminSidebar";
import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Activity, PieChart as PieIcon, Users, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";

// Warna tema buat Pie Chart
const COLORS = ['#D4AF37', '#131313', '#F3E5AB', '#808080', '#4b463e', '#FF8C00'];

export default function DataAnalytic() {
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State untuk filter bulan
  const [currentDate, setCurrentDate] = useState(new Date());

  // State untuk masing-masing chart & total
  const [trendData, setTrendData] = useState<any[]>([]);
  const [programData, setProgramData] = useState<any[]>([]);
  const [kakasakuData, setKakasakuData] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  
  // State untuk Total Pemasukan di Header Chart
  const [totalDonasi, setTotalDonasi] = useState(0);
  const [totalKakasaku, setTotalKakasaku] = useState(0);

  // Fungsi ganti bulan
  const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        // Ambil tanggal awal dan akhir dari bulan yang dipilih
        const start = startOfMonth(currentDate).toISOString();
        const end = endOfMonth(currentDate).toISOString();

        // 1. Fetch Donasi Reguler
        const { data: donations } = await supabase
          .from("donations")
          .select(`amount, created_at, payment_status, donation_programs(title)`)
          .gte('created_at', start)
          .lte('created_at', end)
          .in('payment_status', ['success', 'settled', 'paid']);

        // 2. Fetch Pembayaran Kakaksaku
        const { data: kakasakuPayments } = await supabase
          .from("kakasaku_payments")
          .select(`amount, created_at, status`)
          .gte('created_at', start)
          .lte('created_at', end)
          .in('status', ['success', 'settled', 'paid']);

        // 3. Fetch Langganan Kakaksaku (untuk Pie Chart Paket)
        const { data: kakasakuSubs } = await supabase
          .from("kakasaku_subscriptions")
          .select(`created_at, kakasaku_packages(name)`)
          .gte('created_at', start)
          .lte('created_at', end);

        // 4. Fetch User Baru (Demografi Pertumbuhan)
        const { data: profiles } = await supabase
          .from("profiles")
          .select(`created_at`)
          .gte('created_at', start)
          .lte('created_at', end);

        processChartData(donations || [], kakasakuPayments || [], kakasakuSubs || [], profiles || []);
      } catch (error: any) {
        console.error("Gagal mengambil data analitik:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [currentDate]); // Akan refetch data setiap kali currentDate (bulan) berubah

  const processChartData = (donations: any[], kakasakuPayments: any[], kakasakuSubs: any[], profiles: any[]) => {
    // Siapkan array berisi semua tanggal di bulan ini
    const daysInMonth = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
    
    // 1. Proses Data Tren Pendanaan & Hitung Total
    const trendMap: { [key: string]: { tanggal: string, donasi: number, kakaksaku: number } } = {};
    let sumDonasi = 0;
    let sumKakasaku = 0;
    
    daysInMonth.forEach(day => {
      const dateKey = format(day, "yyyy-MM-dd");
      trendMap[dateKey] = { tanggal: format(day, "dd MMM", { locale: localeId }), donasi: 0, kakaksaku: 0 };
    });

    donations.forEach(item => {
      const dateKey = format(parseISO(item.created_at), "yyyy-MM-dd");
      const amount = Number(item.amount);
      if(trendMap[dateKey]) trendMap[dateKey].donasi += amount;
      sumDonasi += amount;
    });

    kakasakuPayments.forEach(item => {
      const dateKey = format(parseISO(item.created_at), "yyyy-MM-dd");
      const amount = Number(item.amount);
      if(trendMap[dateKey]) trendMap[dateKey].kakaksaku += amount;
      sumKakasaku += amount;
    });
    
    setTrendData(Object.values(trendMap));
    setTotalDonasi(sumDonasi);
    setTotalKakasaku(sumKakasaku);

    // 2. Proses Data Distribusi Program (Bar Chart)
    const programMap: { [key: string]: number } = {};
    donations.forEach(item => {
      const programName = item.donation_programs?.title || "Program Umum";
      programMap[programName] = (programMap[programName] || 0) + Number(item.amount);
    });
    setProgramData(Object.keys(programMap).map(name => ({ name, value: programMap[name] })).sort((a, b) => b.value - a.value));

    // 3. Proses Data Kakaksaku (Pie Chart)
    const packageMap: { [key: string]: number } = {};
    kakasakuSubs.forEach(item => {
      const packageName = item.kakasaku_packages?.name || "Paket Lainnya";
      packageMap[packageName] = (packageMap[packageName] || 0) + 1;
    });
    setKakasakuData(Object.keys(packageMap).map(name => ({ name, value: packageMap[name] })));

    // 4. Proses Pertumbuhan Donatur Baru (Bar Chart)
    const growthMap: { [key: string]: number } = {};
    daysInMonth.forEach(day => {
      const dateKey = format(day, "dd MMM", { locale: localeId });
      growthMap[dateKey] = 0;
    });
    
    profiles.forEach(item => {
      const dateStr = format(parseISO(item.created_at), "dd MMM", { locale: localeId });
      if (growthMap[dateStr] !== undefined) growthMap[dateStr] += 1;
    });
    setGrowthData(Object.keys(growthMap).map(tanggal => ({ tanggal, jumlah: growthMap[tanggal] })));
  };

  // Custom Tooltip untuk Rupiah (TERANG)
  const CustomTooltipRupiah = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white text-[#1A1A1A] p-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] text-sm border border-gray-100 z-50 relative">
          <p className="font-black mb-2 text-gray-400 border-b border-gray-100 pb-2 uppercase tracking-wide text-xs">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-bold py-1">
              {entry.name}: Rp {entry.value.toLocaleString('id-ID')}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex text-[#1A1A1A]">
      <AdminSidebar isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      
      <main className="flex-grow md:ml-64 pt-16 md:pt-0 p-4 md:p-6 lg:p-10 transition-all overflow-hidden max-w-7xl mx-auto">
        
        {/* HEADER & FILTER BULAN */}
        <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Data Analitik</h1>
            <p className="text-muted-foreground mt-1 font-medium italic text-sm md:text-base">
              Visualisasi performa donasi dan demografi Kakak Saku
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold w-32 text-center text-lg">
              {format(currentDate, "MMMM yyyy", { locale: localeId })}
            </span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="h-[50vh] flex items-center justify-center">
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Memuat Visualisasi Data...</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* CHART 1: TREN PEMASUKAN (AREA CHART KOMPARASI) */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black">Tren Pemasukan</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Donasi vs Kakaksaku</p>
                  </div>
                </div>
                
                {/* TOTAL SUMMARY DIMASUKIN KE SINI */}
                <div className="flex items-center gap-6 bg-gray-50/50 p-3 rounded-2xl border border-gray-100/50">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Donasi</p>
                    <p className="text-lg md:text-xl font-black text-[#D4AF37]">
                      Rp {totalDonasi.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Kakaksaku</p>
                    <p className="text-lg md:text-xl font-black text-[#1A1A1A]">
                      Rp {totalKakasaku.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="h-[300px] w-full mt-8">
                {trendData.every(d => d.donasi === 0 && d.kakaksaku === 0) ? (
                  <div className="h-full flex items-center justify-center text-gray-400 font-medium italic">Belum ada transaksi di bulan ini.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorDonasi" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorKakasaku" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1A1A1A" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1A1A1A" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} tickFormatter={(val) => `Rp${val/1000}k`} />
                      <Tooltip content={<CustomTooltipRupiah />} />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }}/>
                      <Area type="monotone" name="Donasi Reguler" dataKey="donasi" stroke="#D4AF37" strokeWidth={3} fill="url(#colorDonasi)" />
                      <Area type="monotone" name="Kakaksaku" dataKey="kakaksaku" stroke="#1A1A1A" strokeWidth={3} fill="url(#colorKakasaku)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* CHART 2: PERFORMA PROGRAM DONASI (BAR CHART) */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black">Performa Program Donasi</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Program terlaris bulan ini</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                {programData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 font-medium italic">Belum ada donasi masuk.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={programData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(val) => `Rp${val/1000}k`} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1A1A1A', fontWeight: 'bold' }} width={120} />
                      <Tooltip content={<CustomTooltipRupiah />} cursor={{ fill: '#f9fafb' }} />
                      <Bar name="Total Terkumpul" dataKey="value" fill="#D4AF37" radius={[0, 8, 8, 0]} barSize={25} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CHART 3: DISTRIBUSI KAKAKSAKU (PIE CHART) */}
              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                    <PieIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black">Distribusi Kakaksaku</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Berdasarkan pilihan paket</p>
                  </div>
                </div>
                <div className="h-[250px] w-full flex items-center justify-center">
                  {kakasakuData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400 font-medium italic">Belum ada langganan.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={kakasakuData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                          {kakasakuData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* CHART 4: PERTUMBUHAN DONATUR (BAR CHART) */}
              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black">Pertumbuhan Donatur</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">User baru mendaftar</p>
                  </div>
                </div>
                <div className="h-[250px] w-full">
                  {growthData.every(d => d.jumlah === 0) ? (
                    <div className="h-full flex items-center justify-center text-gray-400 font-medium italic">Belum ada pendaftar baru.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={growthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1A1A1A', fontWeight: 'bold' }} />
                        <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px' }} />
                        <Bar name="User Baru" dataKey="jumlah" fill="#1A1A1A" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </main>
    </div>
  );
}