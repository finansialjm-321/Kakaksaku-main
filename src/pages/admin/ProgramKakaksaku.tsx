import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, CheckCircle2, Clock, 
  MessageCircle, Search, Tag, 
  ShieldCheck, Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminSidebar from "@/components/AdminSidebar"; 

export default function ProgramKakaksaku() {
  const [listDonatur, setListDonatur] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("all");
  const [filterNama, setFilterNama] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data Paket
      const { data: pkgData } = await supabase.from('kakasaku_packages').select('id, name, amount').eq('is_active', true);
      if (pkgData) setPackages(pkgData);

      // 2. Ambil data Monitoring (View lama yang aman)
      const { data: monitorData, error } = await supabase.from('admin_kakasaku_monitoring').select('*');
      if (error) throw error;

      if (monitorData && monitorData.length > 0) {
        // KUMPULKAN SEMUA ID LANGGANAN
        const subIds = monitorData.map(d => d.sub_id);
        
        // 3. MURNI KODINGAN: Tarik data bill_reff dari tabel payments tanpa sentuh SQL
        const { data: payData } = await supabase
          .from('kakasaku_payments')
          .select('subscription_id, bill_reff, status')
          .in('subscription_id', subIds)
          .in('status', ['success', 'settled', 'paid']) // Cuma ambil yang lunas
          .order('created_at', { ascending: false }); // Urutkan dari yang paling baru

        // 4. Gabungkan data bill_reff ke tabel donatur
        const finalData = monitorData.map(donatur => {
          // Cari pembayaran lunas terakhir untuk orang ini
          const lastPayment = payData?.find(p => p.subscription_id === donatur.sub_id);
          return {
            ...donatur,
            bill_reff: lastPayment ? lastPayment.bill_reff : null,
            // Pastikan status di-update jika ada pembayaran sukses yang nyangkut
            status_bayar: lastPayment ? 'success' : donatur.status_bayar 
          };
        });

        setListDonatur(finalData);
      } else {
        setListDonatur([]);
      }
    } catch (err: any) {
      console.error("Terjadi kesalahan sistem:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const kirimWA = (nama: string, wa: string) => {
    const txt = `Halo Kak ${nama}, iuran rutin Kakak Saku sudah bisa dilunasi ya. Terima kasih banyak atas kebaikannya!`;
    window.open(`https://wa.me/${wa.replace(/\D/g, '')}?text=${encodeURIComponent(txt)}`, '_blank');
  };

  // FUNGSI MENGAMBIL BULAN DARI BILL_REFF (Contoh: "1-2026, 2-2026" jadi "FEBRUARI 2026")
  const getBatasLunas = (billReff: string) => {
    if (!billReff) return "";
    
    const match = billReff.match(/\((.*?)\)/);
    if (match && match[1]) {
      const periods = match[1].split(','); 
      const lastPeriod = periods[periods.length - 1].trim(); 
      const [bulan, tahun] = lastPeriod.split('-');

      const namaBulan = [
        "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
        "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
      ];

      const idxBulan = parseInt(bulan) - 1;
      if (idxBulan >= 0 && idxBulan < 12 && tahun) {
        return `${namaBulan[idxBulan]} ${tahun}`;
      }
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
    const matchName = d.nama_lengkap?.toLowerCase().includes(filterNama.toLowerCase());
    return matchPkg && matchName;
  });

  return (
    <div className="flex min-h-screen bg-[#FDFCFB]">
      <AdminSidebar />
      <main className="flex-1 md:ml-64 p-8 space-y-8 animate-in fade-in duration-700">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner"><Users size={22}/></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Donatur</p><p className="text-2xl font-black text-gray-900">{stats.total}</p></div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 shadow-inner"><CheckCircle2 size={22}/></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lunas</p><p className="text-2xl font-black text-green-600">{stats.lunas}</p></div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner"><Clock size={22}/></div>
            <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Belum Bayar</p><p className="text-2xl font-black text-orange-500">{stats.sisa}</p></div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Tag size={14}/> Pilih Paket Mentoring</p>
          <div className="flex flex-wrap gap-2">
            <Button variant={selectedPackage === "all" ? "default" : "outline"} onClick={() => setSelectedPackage("all")} className="rounded-xl font-bold text-xs uppercase">Semua</Button>
            {packages.map(p => (
              <Button key={p.id} variant={selectedPackage === p.id ? "default" : "outline"} onClick={() => setSelectedPackage(p.id)} className="rounded-xl font-bold text-xs uppercase">{p.name} (Rp{p.amount / 1000}k)</Button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
              <input placeholder="Cari nama Kakak Saku..." className="w-full pl-12 pr-6 py-4 rounded-2xl bg-gray-50/50 font-bold text-sm outline-none border-2 border-transparent focus:border-orange-500/20 transition-all text-gray-700" onChange={(e) => setFilterNama(e.target.value)} />
            </div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Pusat Monitoring Keuangan</p>
          </div>

          <div className="overflow-x-auto min-h-[350px]">
            {loading ? ( 
              <div className="py-24 flex justify-center"><Loader2 className="animate-spin text-orange-500 w-10 h-10" /></div> 
            ) : listDonatur.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-gray-400"><p className="font-bold">Belum ada data donatur.</p></div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/30 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-10 py-6">Donatur</th>
                    <th className="px-10 py-6">Paket</th>
                    <th className="px-10 py-6">Status</th>
                    {/* KOLOM BARU UNTUK BATAS LUNAS */}
                    <th className="px-10 py-6">Batas Lunas</th>
                    <th className="px-10 py-6 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((row, i) => {
                    const isSuccess = row.status_bayar === 'success' || row.status_bayar === 'settled';
                    const batasLunas = getBatasLunas(row.bill_reff);

                    return (
                      <tr key={i} className="hover:bg-gray-50/20 transition-all duration-300 group">
                        <td className="px-10 py-7">
                          <p className="font-black text-[#1A1A1A] group-hover:text-orange-600 transition-colors">{row.nama_lengkap || 'Tanpa Nama'}</p>
                          <p className="text-xs text-gray-400 font-medium">{row.no_wa || '-'}</p>
                        </td>
                        
                        <td className="px-10 py-7">
                          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">{row.package_name}</span>
                        </td>
                        
                        <td className="px-10 py-7">
                          {/* Label Status Murni */}
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${isSuccess ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                            {isSuccess ? 'LUNAS' : 'PENDING'}
                          </span>
                        </td>

                        {/* KOLOM BARU: Menampilkan teks Batas Lunas yang lebih besar & jelas */}
                        <td className="px-10 py-7">
                          {isSuccess && batasLunas ? (
                            <span className="text-xs font-black text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 uppercase tracking-widest">
                              {batasLunas}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-gray-300">-</span>
                          )}
                        </td>
                        
                        <td className="px-10 py-7 text-center">
                          {!isSuccess ? (
                            <Button size="sm" variant="ghost" className="text-green-600 font-black text-[10px] uppercase hover:bg-green-50 rounded-xl" onClick={() => kirimWA(row.nama_lengkap, row.no_wa)}>
                              <MessageCircle className="w-4 h-4 mr-2" /> Ingatkan
                            </Button>
                          ) : (
                            <div className="flex items-center justify-center text-green-600 text-[10px] font-black uppercase tracking-widest"><ShieldCheck className="w-4 h-4 mr-2" /> Aman</div>
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
  );
}