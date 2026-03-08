import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, CheckCircle2, Clock, 
  MessageCircle, Search, Tag, 
  ShieldCheck, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminSidebar, { MobileHeader } from "@/components/AdminSidebar"; 

export default function ProgramKakaksaku() {
  const [listDonatur, setListDonatur] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("all");
  const [filterNama, setFilterNama] = useState("");
  const [loading, setLoading] = useState(true);
  
  // STATE UNTUK SIDEBAR (Dinaikkan ke sini agar konten bisa geser)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pkgData } = await supabase.from('kakasaku_packages').select('id, name, amount').eq('is_active', true);
      if (pkgData) setPackages(pkgData);

      const { data: monitorData, error } = await supabase.from('admin_kakasaku_monitoring').select('*');
      if (error) throw error;

      if (monitorData && monitorData.length > 0) {
        const subIds = monitorData.map(d => d.sub_id);
        const { data: payData } = await supabase
          .from('kakasaku_payments')
          .select('subscription_id, bill_reff, status')
          .in('subscription_id', subIds)
          .in('status', ['success', 'settled', 'paid'])
          .order('created_at', { ascending: false });

        const finalData = monitorData.map(donatur => {
          const lastPayment = payData?.find(p => p.subscription_id === donatur.sub_id);
          return {
            ...donatur,
            bill_reff: lastPayment ? lastPayment.bill_reff : null,
            status_bayar: lastPayment ? 'success' : donatur.status_bayar 
          };
        });
        setListDonatur(finalData);
      }
    } catch (err: any) {
      console.error("Kesalahan sistem:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const getBatasLunas = (billReff: string) => {
    if (!billReff) return "";
    const match = billReff.match(/\((.*?)\)/);
    if (match && match[1]) {
      const periods = match[1].split(','); 
      const lastPeriod = periods[periods.length - 1].trim(); 
      const [bulan, tahun] = lastPeriod.split('-');
      const namaBulan = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
      const idx = parseInt(bulan) - 1;
      return idx >= 0 ? `${namaBulan[idx]} ${tahun}` : "";
    }
    return "";
  };

  const stats = {
    total: listDonatur.length,
    lunas: listDonatur.filter(d => d.status_bayar === 'success' || d.status_bayar === 'settled').length,
    sisa: listDonatur.length - listDonatur.filter(d => d.status_bayar === 'success' || d.status_bayar === 'settled').length
  };

  const filtered = listDonatur.filter(d => {
    const matchPkg = selectedPackage === "all" || d.package_id === selectedPackage;
    return matchPkg && d.nama_lengkap?.toLowerCase().includes(filterNama.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-white flex">
      {/* SIDEBAR DENGAN CONTROL STATE */}
      <AdminSidebar 
        isMobileOpen={isMobileMenuOpen} 
        setIsMobileOpen={setIsMobileMenuOpen}
      />
      
      <div className="flex-grow flex flex-col min-w-0">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        {/* MAIN CONTENT */}
        <main className="flex-grow transition-all duration-500 pt-20 md:pt-8 p-6 md:p-12 md:ml-64 space-y-10">
          
          {/* STATS CARDS - Diperbesar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 transition-all hover:shadow-md">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-500 shadow-inner"><Users size={30}/></div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Donatur</p>
                <p className="text-4xl font-black text-gray-900">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 transition-all hover:shadow-md">
              <div className="w-16 h-16 bg-green-50 rounded-3xl flex items-center justify-center text-green-500 shadow-inner"><CheckCircle2 size={30}/></div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Lunas</p>
                <p className="text-4xl font-black text-green-600">{stats.lunas}</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 transition-all hover:shadow-md">
              <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 shadow-inner"><Clock size={30}/></div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Belum Bayar</p>
                <p className="text-4xl font-black text-orange-500">{stats.sisa}</p>
              </div>
            </div>
          </div>

          {/* FILTER & SEARCH - Diperbesar */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/50 p-8 rounded-[2rem]">
              <div className="relative w-full max-w-xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 w-6 h-6" />
                <input 
                  placeholder="Cari nama Kakak Saku..." 
                  className="w-full pl-14 pr-8 py-5 rounded-[1.5rem] bg-white font-bold text-lg outline-none border-2 border-transparent focus:border-orange-500/20 shadow-sm"
                  onChange={(e) => setFilterNama(e.target.value)} 
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant={selectedPackage === "all" ? "default" : "outline"} onClick={() => setSelectedPackage("all")} className="rounded-2xl font-black text-xs uppercase h-12 px-6">Semua</Button>
                {packages.map(p => (
                  <Button key={p.id} variant={selectedPackage === p.id ? "default" : "outline"} onClick={() => setSelectedPackage(p.id)} className="rounded-2xl font-black text-xs uppercase h-12 px-6">
                    {p.name} (Rp{p.amount / 1000}k)
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* TABLE - Lebih Lega & Teks Lebih Besar */}
          <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-50 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? ( 
                <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-orange-500 w-12 h-12" /></div> 
              ) : (
                <table className="w-full text-left min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-50/30 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      <th className="px-12 py-8">Donatur</th>
                      <th className="px-12 py-8">Paket</th>
                      <th className="px-12 py-8 text-center">Status</th>
                      <th className="px-12 py-8 text-center">Batas Lunas</th>
                      <th className="px-12 py-8 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((row, i) => {
                      const isSuccess = row.status_bayar === 'success' || row.status_bayar === 'settled';
                      const batasLunas = getBatasLunas(row.bill_reff);
                      return (
                        <tr key={i} className="hover:bg-gray-50/20 transition-all group">
                          <td className="px-12 py-8">
                            <p className="text-xl font-black text-[#1A1A1A] group-hover:text-orange-600 transition-colors mb-1">{row.nama_lengkap || 'Tanpa Nama'}</p>
                            <p className="text-sm text-gray-400 font-bold tracking-tight">{row.no_wa || '-'}</p>
                          </td>
                          <td className="px-12 py-8">
                            <span className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">{row.package_name}</span>
                          </td>
                          <td className="px-12 py-8 text-center">
                            <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                              {isSuccess ? 'LUNAS' : 'PENDING'}
                            </span>
                          </td>
                          <td className="px-12 py-8 text-center">
                            {isSuccess && batasLunas ? (
                              <span className="text-sm font-black text-gray-700 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 uppercase tracking-[0.15em]">
                                {batasLunas}
                              </span>
                            ) : <span className="text-gray-300 font-bold">-</span>}
                          </td>
                          <td className="px-12 py-8 text-center">
                            {!isSuccess ? (
                              <Button className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase px-6 h-12 rounded-2xl shadow-lg shadow-orange-500/20">
                                <MessageCircle className="w-5 h-5 mr-2" /> Ingatkan
                              </Button>
                            ) : (
                              <div className="flex items-center justify-center text-green-600 text-xs font-black uppercase tracking-[0.2em] bg-green-50 py-3 rounded-2xl"><ShieldCheck className="w-5 h-5 mr-2" /> Aman</div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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