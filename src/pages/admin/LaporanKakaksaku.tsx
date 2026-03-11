import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileSpreadsheet, Search, CheckCircle2, 
  Wallet, Users, Loader2, 
  Download // <-- Tambahkan ini
} from "lucide-react";
// PERBAIKAN: Import Button dari folder UI
import { Button } from "@/components/ui/button"; 
import AdminSidebar, { MobileHeader } from "@/components/AdminSidebar"; 
import * as XLSX from 'xlsx'; 
import { toast } from "sonner";

export default function LaporanKakaksaku() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNama, setFilterNama] = useState("");
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
      const { data: profiles } = await supabase.from('profiles').select('id, nama_lengkap');
      const { data: packages } = await supabase.from('kakasaku_packages').select('id, name, amount');
      const { data: payments } = await supabase.from('kakasaku_payments').select('user_id, bill_reff, status').in('status', ['success', 'settled', 'paid']);

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
          nama: profile?.nama_lengkap || 'Pendaftar Baru',
          paket: pkg?.name || 'Tanpa Paket',
          nominal: nominal,
          paidMonths: paidMonths,
          status: s.status
        };
      });

      setData(report);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const excelData = data.map(item => {
        const row: any = {
          "Nama Donatur": item.nama,
          "Paket": item.paket,
          "Komitmen Bulanan": item.nominal,
          "Status Akun": item.status,
        };
        months.forEach((m, idx) => {
          row[m] = item.paidMonths.includes((idx + 1).toString()) ? "LUNAS" : "-";
        });
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Kakak Saku");
      XLSX.writeFile(workbook, `Laporan_Kakak_Saku_${new Date().getFullYear()}.xlsx`);
      toast.success("Laporan berhasil diunduh!");
    } catch (error) {
      toast.error("Gagal mengekspor data");
    }
  };

  const totalUang = data.filter(i => i.status === 'active').reduce((sum, item) => sum + item.nominal, 0);
  const filtered = data.filter(d => d.nama.toLowerCase().includes(filterNama.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} isMobileOpen={isMobileMenuOpen} setIsMobileOpen={setIsMobileMenuOpen} />
      
      <div className="flex-grow flex flex-col min-w-0 transition-all duration-500">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        <main className={`flex-grow transition-all duration-500 pt-20 md:pt-8 p-6 md:p-12 space-y-10 ${
          isCollapsed ? "md:ml-20" : "md:ml-64"
        }`}>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 transition-all hover:shadow-md">
                <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center text-green-500 shadow-inner"><Wallet size={32}/></div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Komitmen</p>
                  <p className="text-4xl font-black text-gray-900">Rp {totalUang.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 transition-all hover:shadow-md">
                <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-500 shadow-inner"><Users size={32}/></div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Subscriber Aktif</p>
                  <p className="text-4xl font-black text-gray-900">{data.filter(i => i.status === 'active').length} Akun</p>
                </div>
              </div>
            </div>

            {/* TOMBOL EXPORT */}
            <Button 
              onClick={handleExportExcel}
              className="bg-[#1A1A1A] hover:bg-zinc-800 text-white font-black px-10 py-8 rounded-[1.5rem] shadow-xl shadow-zinc-200 flex items-center gap-3 shrink-0"
            >
              <Download size={24} /> Export ke Excel
            </Button>
          </div>

          <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="relative w-full max-w-md">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                <input 
                  placeholder="Cari nama donatur..." 
                  className="w-full pl-14 pr-6 py-4 rounded-2xl bg-gray-50 font-bold text-sm outline-none" 
                  onChange={(e) => setFilterNama(e.target.value)} 
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div>
              ) : (
                <table className="w-full text-left min-w-[1300px]">
                  <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <th className="px-10 py-6 border-r border-gray-100/50 sticky left-0 bg-gray-50/50 z-20">Donatur & Paket</th>
                      {months.map(m => (
                        <th key={m} className="px-2 py-6 text-center border-r border-gray-100/50">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-all group">
                        <td className="px-10 py-6 border-r border-gray-100/50 bg-white sticky left-0 z-10 group-hover:bg-gray-50 transition-colors">
                          <p className="font-black text-[#1A1A1A] group-hover:text-orange-600 transition-colors">{item.nama}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase">{item.paket}</span>
                            <span className="text-[10px] font-black text-orange-500">Rp {item.nominal.toLocaleString('id-ID')}</span>
                          </div>
                        </td>
                        {months.map((_, mIdx) => {
                          const isPaid = item.paidMonths.includes((mIdx + 1).toString());
                          return (
                            <td key={mIdx} className="px-2 py-6 text-center border-r border-gray-100/30">
                              {isPaid ? <CheckCircle2 className="w-6 h-6 text-green-500 mx-auto fill-green-50" strokeWidth={2.5} /> : <div className="w-5 h-5 border-2 border-gray-200 rounded-lg mx-auto" />}
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