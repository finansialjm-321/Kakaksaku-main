import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar, { MobileHeader } from "@/components/AdminSidebar";
import { motion } from "framer-motion";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from "recharts";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Activity, PieChart as PieIcon, Users } from "lucide-react";

// Warna tema buat Pie Chart
const COLORS = ['#D4AF37', '#1A1A1A', '#F3E5AB', '#808080', '#E5E4E2'];

export default function DataAnalytic() {
  const [loading, setLoading] = useState(true);
  
  // State untuk masing-masing chart
  const [trendData, setTrendData] = useState<any[]>([]);
  const [programData, setProgramData] = useState<any[]>([]);
  const [demographicData, setDemographicData] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        // Tarik data donasi yang SUKSES aja
        const { data, error } = await supabase
          .from("donations")
          .select(`
            amount, created_at, payment_status,
            donation_programs ( title ),
            profiles ( kesibukan, jenis_kelamin )
          `)
          .in('payment_status', ['success', 'settled', 'paid'])
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        if (data) {
          processChartData(data);
        }
      } catch (error: any) {
        console.error("Gagal mengambil data analitik:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  const processChartData = (data: any[]) => {
    // 1. Proses Data Tren Pendanaan (Group by Tanggal)
    const trendMap: { [key: string]: number } = {};
    data.forEach(item => {
      const dateStr = format(parseISO(item.created_at), "dd MMM", { locale: localeId });
      trendMap[dateStr] = (trendMap[dateStr] || 0) + Number(item.amount);
    });
    const formattedTrend = Object.keys(trendMap).map(date => ({
      tanggal: date,
      total: trendMap[date]
    }));
    setTrendData(formattedTrend);

    // 2. Proses Data Distribusi Program (Group by Program Title)
    const programMap: { [key: string]: number } = {};
    data.forEach(item => {
      const programName = item.donation_programs?.title || "Sumbangan Platform/Umum";
      programMap[programName] = (programMap[programName] || 0) + Number(item.amount);
    });
    const formattedProgram = Object.keys(programMap).map(name => ({
      name,
      value: programMap[name]
    }));
    setProgramData(formattedProgram);

    // 3. Proses Data Demografi - Kesibukan (Group by Kesibukan Donatur)
    const demoMap: { [key: string]: number } = {};
    data.forEach(item => {
      const kesibukan = item.profiles?.kesibukan || "Tidak Diketahui";
      demoMap[kesibukan] = (demoMap[kesibukan] || 0) + 1; // Hitung jumlah orangnya
    });
    const formattedDemo = Object.keys(demoMap).map(kesibukan => ({
      kategori: kesibukan,
      jumlah: demoMap[kesibukan]
    })).sort((a, b) => b.jumlah - a.jumlah); // Urutkan dari yang terbanyak
    setDemographicData(formattedDemo);
  };

  // Custom Tooltip buat nampilin format Rupiah di Chart
  const CustomTooltipRupiah = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1A1A] text-white p-4 rounded-xl shadow-xl text-sm border border-gray-800">
          <p className="font-bold mb-1 text-gray-300">{label}</p>
          <p className="font-black text-gold">
            Rp {payload[0].value.toLocaleString('id-ID')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex text-[#1A1A1A]">
      <AdminSidebar isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
      <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
      <main className="flex-grow md:ml-64 pt-16 md:pt-0 p-4 md:p-6 lg:p-10 transition-all overflow-hidden">
        <header className="mb-6 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Data Analitik</h1>
          <p className="text-muted-foreground mt-1 font-medium italic text-sm md:text-base">
            Visualisasi mendalam performa donasi dan demografi Kakak Saku
          </p>
        </header>

        {loading ? (
          <div className="h-[60vh] flex items-center justify-center">
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest animate-pulse">Memuat Visualisasi Data...</p>
          </div>
        ) : trendData.length === 0 ? (
          <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
            <p className="text-lg font-bold text-gray-500">Belum ada data donasi sukses untuk dianalisis.</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* CHART 1: TREN PENDANAAN (FULL WIDTH) */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black">Tren Pendanaan</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Akumulasi donasi sukses per hari</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="tanggal" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} tickFormatter={(val) => `Rp${val/1000}k`} />
                    <Tooltip content={<CustomTooltipRupiah />} cursor={{ stroke: '#D4AF37', strokeWidth: 1, strokeDasharray: '5 5' }} />
                    <Area type="monotone" dataKey="total" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GRID BAWAH: PIE CHART & BAR CHART */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* CHART 2: DISTRIBUSI PROGRAM */}
              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                    <PieIcon size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black">Distribusi Program</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Berdasarkan nominal masuk</p>
                  </div>
                </div>
                <div className="h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={programData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {programData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltipRupiah />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CHART 3: DEMOGRAFI KESIBUKAN */}
              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black">Profil Kakak Saku</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Berdasarkan kesibukan donatur</p>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demographicData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 'bold' }} />
                      <YAxis dataKey="kategori" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#1A1A1A', fontWeight: 'bold' }} width={80} />
                      <Tooltip 
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        itemStyle={{ color: '#1A1A1A', fontWeight: 'black' }}
                      />
                      <Bar dataKey="jumlah" fill="#1A1A1A" radius={[0, 8, 8, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}