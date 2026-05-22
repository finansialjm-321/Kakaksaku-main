import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, CheckCircle2, Wallet, Users, 
  Loader2, Download, TrendingUp, Layers 
} from "lucide-react";
import { Button } from "@/components/ui/button"; 
import AdminSidebar, { MobileHeader } from "@/components/AdminSidebar"; 
import * as XLSX from 'xlsx'; 
import { toast } from "sonner";

export default function LaporanKakaksaku() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNama, setFilterNama] = useState("");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<'all' | 'batch1' | 'batch2'>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: subs } = await supabase.from('kakasaku_subscriptions').select('*');
      // PERBAIKAN: Ambil juga kakaksaku_batch dari tabel profiles
      const { data: profiles } = await supabase.from('profiles').select('id, nama_lengkap, kakaksaku_batch');
      const { data: packages } = await supabase.from('kakasaku_packages').select('id, name, amount');
      
      const { data: payments } = await supabase
        .from('kakasaku_payments')
        .select('user_id, bill_reff, status')
        .in('status', ['success', 'settled', 'paid']);

      if (!subs) return;

      const report = subs.map(s => {
        const profile = profiles?.find(p => p.id === s.user_id);
        const pkg = packages?.find(p => p.id === s.package_id);

        const nominal = (pkg?.name?.toLowerCase() === 'jayawijaya') 
          ? (Number(s.amount) || 0) 
          : (Number(pkg?.amount) || 0);

        const userPayments = payments?.filter(p => p.user_id === s.user_id) || [];
        const paidMonths = userPayments.flatMap(p => {
          const match = p.bill_reff?.match(/\((.*?)\)/);
          return match ? match[1].split(',').map(m => m.trim().split('-')[0]) : [];
        });

        return {
          id: s.id,
          nama: profile?.nama_lengkap || 'Pendaftar Baru',
          paket: pkg?.name || 'Tanpa Paket',
          nominal: nominal,
          paidMonths: paidMonths,
          status: s.status,
          user_batch: s.batch || profile?.kakaksaku_batch || 'batch1' // Penentuan batch
        };
      });

      setData(report);
    } catch (err: any) {
      console.error("Gagal memproses data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const excelData = data.map(item => {
        const row: any = {
          "Nama Donatur": item.nama,
          "Batch": item.user_batch === 'batch2' ? 'Batch 2' : 'Batch 1',
          "Paket": item.paket,
          "Komitmen Bulanan": item.nominal,
          "Total Bayar (Lunas)": item.nominal * item.paidMonths.length,
          "Status Akun": item.status === 'active' ? 'Aktif' : item.status,
        };
        months.forEach((m, idx) => {
          row[m] = item.paidMonths.includes((idx + 1).toString()) ? "LUNAS" : "-";
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Kakak Saku");
      XLSX.writeFile(workbook, `Laporan_Kakak_Saku_Paid_${new Date().getFullYear()}.xlsx`);
      toast.success("Laporan berhasil diunduh!");
    } catch (error) {
      toast.error("Gagal mengekspor data");
    }
  };

  // LOGIKA KPI STATISTIK REALTIME (TOTAL & PER BATCH)
  const activeData = data.filter(i => i.status === 'active');
  
  const totalTargetBulanan = activeData.reduce((sum, item) => sum + item.nominal, 0);
  const targetBulananB1 = activeData.filter(d => d.user_batch === 'batch1').reduce((sum, item) => sum + item.nominal, 0);
  const targetBulananB2 = activeData.filter(d => d.user_batch === 'batch2').reduce((sum, item) => sum + item.nominal, 0);

  const totalDanaMasuk = data.reduce((sum, item) => sum + (Number(item.nominal) * item.paidMonths.length), 0);
  const danaMasukB1 = data.filter(d => d.user_batch === 'batch1').reduce((sum, item) => sum + (Number(item.nominal) * item.paidMonths.length), 0);
  const danaMasukB2 = data.filter(d => d.user_batch === 'batch2').reduce((sum, item) => sum + (Number(item.nominal) * item.paidMonths.length), 0);

  const subsAll = activeData.length;
  const subsB1 = activeData.filter(d => d.user_batch === 'batch1').length;
  const subsB2 = activeData.filter(d => d.user_batch === 'batch2').length;

  // LOGIKA FILTER TABEL
  const filtered = data.filter(d => {
    const matchBatch = selectedBatchFilter === "all" || d.user_batch === selectedBatchFilter;
    const matchNama = d.nama.toLowerCase().includes(filterNama.toLowerCase());
    return matchBatch && matchNama;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
      
      <div className="flex-grow flex flex-col min-w-0 transition-all duration-500">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        <main className={`flex-grow transition-all duration-500 pt-24 md:pt-10 p-4 md:p-12 space-y-8 ${
          isCollapsed ? "md:ml-20" : "md:ml-64"
        }`}>
          
          <div className="flex flex-col gap-8">
            {/* STATS GRID: Disesuaikan strukturnya untuk memuat rincian B1 & B2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              
              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-green-50 rounded-2xl md:rounded-3xl flex items-center justify-center text-green-500 shadow-inner shrink-0"><Wallet size={28}/></div>
                  <div>
                    <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Target Bulanan</p>
                    <p className="text-xl md:text-2xl font-black text-gray-900">Rp {totalTargetBulanan.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3 grid grid-cols-2 text-center text-[11px] font-bold text-gray-500 w-full">
                  <div className="border-r border-gray-100">B1: <span className="text-gray-900 font-black">Rp {(targetBulananB1/1000).toLocaleString('id-ID')}k</span></div>
                  <div>B2: <span className="text-gray-900 font-black">Rp {(targetBulananB2/1000).toLocaleString('id-ID')}k</span></div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4 border-b-4 border-b-green-500">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-green-500 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shadow-lg shadow-green-200 shrink-0"><TrendingUp size={28}/></div>
                  <div>
                    <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Dana Masuk (Paid)</p>
                    <p className="text-xl md:text-2xl font-black text-green-600">Rp {totalDanaMasuk.toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3 grid grid-cols-2 text-center text-[11px] font-bold text-gray-500 w-full">
                  <div className="border-r border-gray-100">B1: <span className="text-green-600 font-black">Rp {(danaMasukB1/1000).toLocaleString('id-ID')}k</span></div>
                  <div>B2: <span className="text-green-600 font-black">Rp {(danaMasukB2/1000).toLocaleString('id-ID')}k</span></div>
                </div>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all sm:col-span-2 lg:col-span-1 space-y-4">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-50 rounded-2xl md:rounded-3xl flex items-center justify-center text-blue-500 shadow-inner shrink-0"><Users size={28}/></div>
                  <div>
                    <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Subscriber Aktif</p>
                    <p className="text-xl md:text-2xl font-black text-gray-900">{subsAll} Akun</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-3 grid grid-cols-2 text-center text-[11px] font-bold text-gray-500 w-full">
                  <div className="border-r border-gray-100">Batch 1: <span className="text-blue-600 font-black">{subsB1}</span></div>
                  <div>Batch 2: <span className="text-purple-600 font-black">{subsB2}</span></div>
                </div>
              </div>

            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleExportExcel}
                className="w-full md:w-auto bg-[#1A1A1A] hover:bg-zinc-800 text-white font-black px-8 py-7 md:py-8 rounded-[1.5rem] shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
              >
                <Download size={20} /> Export ke Excel
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-50 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                  <input 
                    placeholder="Cari nama donatur..." 
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 font-bold text-sm outline-none border-2 border-transparent focus:border-orange-500/20" 
                    onChange={(e) => setFilterNama(e.target.value)} 
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Update Real-time 2026</p>
                </div>
              </div>

              {/* TAB FILTER BATCH DI LAPORAN */}
              <div className="flex items-center gap-3 pt-2 overflow-x-auto pb-1 scrollbar-none">
                <Layers className="w-4 h-4 text-gray-400 shrink-0" />
                <Button 
                  variant={selectedBatchFilter === "all" ? "default" : "ghost"} 
                  onClick={() => setSelectedBatchFilter("all")} 
                  className="rounded-xl font-bold text-xs h-10 px-5 shrink-0"
                >
                  Semua Batch
                </Button>
                <Button 
                  variant={selectedBatchFilter === "batch1" ? "default" : "ghost"} 
                  onClick={() => setSelectedBatchFilter("batch1")} 
                  className={`rounded-xl font-bold text-xs h-10 px-5 shrink-0 ${selectedBatchFilter !== 'batch1' && 'text-blue-600 hover:bg-blue-50'}`}
                >
                  Batch 1 Only
                </Button>
                <Button 
                  variant={selectedBatchFilter === "batch2" ? "default" : "ghost"} 
                  onClick={() => setSelectedBatchFilter("batch2")} 
                  className={`rounded-xl font-bold text-xs h-10 px-5 shrink-0 ${selectedBatchFilter !== 'batch2' && 'text-purple-600 hover:bg-purple-50'}`}
                >
                  Batch 2 Only
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200">
              {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div>
              ) : (
                <table className="w-full text-left min-w-[1200px]">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-8 py-6 border-r border-gray-100/50 sticky left-0 bg-gray-50/50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">Donatur & Paket</th>
                      {months.map(m => (
                        <th key={m} className="px-2 py-6 text-center border-r border-gray-100/50">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-all group">
                        <td className="px-8 py-6 border-r border-gray-100/50 bg-white sticky left-0 z-10 group-hover:bg-gray-50 transition-colors shadow-[2px_0_5px_rgba(0,0,0,0.01)]">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-black text-[#1A1A1A] group-hover:text-orange-600 transition-colors truncate max-w-[180px]">{item.nama}</p>
                            {/* BADGE BATCH DI TABEL */}
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                              item.user_batch === 'batch2' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.user_batch === 'batch2' ? 'B2' : 'B1'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">{item.paket}</span>
                            <span className="text-[10px] font-black text-orange-500">Rp {item.nominal.toLocaleString('id-ID')}</span>
                          </div>
                        </td>
                        {months.map((_, mIdx) => {
                          const isPaid = item.paidMonths.includes((mIdx + 1).toString());
                          return (
                            <td key={mIdx} className="px-2 py-6 text-center border-r border-gray-100/30">
                              {isPaid ? (
                                <div className="flex justify-center scale-110 animate-in zoom-in duration-300">
                                  <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-50" strokeWidth={2.5} />
                                </div>
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-200 rounded-lg mx-auto transition-colors group-hover:border-orange-200" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}