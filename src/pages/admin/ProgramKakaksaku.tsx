import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, CheckCircle2, Clock, 
  MessageCircle, Search, Tag, 
  ShieldCheck, Loader2, Power, ShieldAlert,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminSidebar, { MobileHeader } from "@/components/AdminSidebar"; 
import { toast } from "sonner"; 

export default function ProgramKakaksaku() {
  const [listDonatur, setListDonatur] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("all");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<'all' | 'batch1' | 'batch2'>('all');
  const [filterNama, setFilterNama] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Kontrol Registrasi dengan Batch
  const [batchMode, setBatchMode] = useState<'none' | 'batch1' | 'batch2' | 'both'>('none');
  const [isUpdatingBatch, setIsUpdatingBatch] = useState(false);

  // STATE SIDEBAR
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchData();
    fetchBatchStatus();
  }, []);

  const fetchBatchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value_text')
        .eq('key', 'kakaksaku_batch_mode')
        .maybeSingle();
      
      if (data?.value_text) {
        setBatchMode(data.value_text as any);
      } else {
        setBatchMode('both');
      }
    } catch (err) {
      console.error('Error fetching batch status:', err);
      setBatchMode('both');
    }
  };

  const handleToggleBatch = async (batch: 'batch1' | 'batch2' | 'none') => {
    setIsUpdatingBatch(true);
    let newMode: 'none' | 'batch1' | 'batch2' | 'both' = 'none';
    
    if (batch === 'none') {
      newMode = 'none';
    } else {
      if (batchMode === 'none') {
        newMode = batch;
      } else if (batchMode === batch) {
        newMode = 'none';
      } else if (batchMode === 'batch1' && batch === 'batch2') {
        newMode = 'both';
      } else if (batchMode === 'batch2' && batch === 'batch1') {
        newMode = 'both';
      } else if (batchMode === 'both') {
        newMode = batch === 'batch1' ? 'batch2' : 'batch1';
      }
    }
    
    try {
      const { data: existingData } = await supabase
        .from('site_settings')
        .select('key')
        .eq('key', 'kakaksaku_batch_mode')
        .maybeSingle();

      let result;
      if (existingData?.key) {
        result = await supabase
          .from('site_settings')
          .update({ value_text: newMode })
          .eq('key', 'kakaksaku_batch_mode');
      } else {
        result = await supabase
          .from('site_settings')
          .insert({ key: 'kakaksaku_batch_mode', value_text: newMode });
      }

      if (result.error) throw result.error;

      setBatchMode(newMode);
      const batchText = newMode === 'none' ? 'DITUTUP' : newMode === 'both' ? 'Batch 1 & 2 DIBUKA' : `${newMode.toUpperCase()} DIBUKA`;
      toast.success(`Pendaftaran Kakak Saku: ${batchText}`);
    } catch (error: any) {
      console.error('Error updating batch mode:', error);
      toast.error(error.message || "Gagal memperbarui batch mode.");
    } finally {
      setIsUpdatingBatch(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil data paket donasi
      const { data: pkgData } = await supabase.from('kakasaku_packages').select('id, name, amount').eq('is_active', true);
      if (pkgData) setPackages(pkgData);

      // 2. Ambil data langganan yang AKTIF
      const { data: subsData, error: subError } = await supabase
        .from('kakasaku_subscriptions')
        .select('*')
        .eq('status', 'active');
      
      if (subError) throw subError;

      if (subsData && subsData.length > 0) {
        // 3. Ambil data profil & pembayaran SECARA KESELURUHAN (Menghindari Limit Karakter URL)
        const [profilesRes, payRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, nama_lengkap, no_wa, kakaksaku_batch'),
          supabase
            .from('kakasaku_payments')
            .select('subscription_id, bill_reff, status, created_at')
            .in('status', ['success', 'settled', 'paid'])
            .order('created_at', { ascending: false })
        ]);

        const profilesData = profilesRes.data || [];
        const payData = payRes.data || [];

        // WAKTU SAAT INI (REALTIME BULAN & TAHUN)
        const now = new Date();
        const currentMonthVal = now.getFullYear() * 12 + (now.getMonth() + 1);
        const currentMonthOnly = now.getMonth() + 1;

        // 4. Gabungkan semua data dengan logika perhitungan bulan
        const finalData = subsData.map(sub => {
          const profile = profilesData.find(p => p.id === sub.user_id);
          const pkg = pkgData?.find(p => p.id === sub.package_id);
          const userBatch = sub.batch || profile?.kakaksaku_batch || 'batch1';
          
          // Ambil seluruh riwayat bayar sukses milik user ini
          const subPayments = payData.filter(p => p.subscription_id === sub.id);
          const lastPayment = subPayments.length > 0 ? subPayments[0] : null;

          // CARI BULAN TERAKHIR DIBAYAR (Dari parsing teks tagihan)
          let lastPaidMonthVal = 0;
          subPayments.forEach(p => {
            const match = p.bill_reff?.match(/\d+-\d+/g); // Ekstrak pola "Bulan-Tahun" misal "3-2026"
            if (match) {
              match.forEach(m => {
                const [mVal, yVal] = m.split('-').map(Number);
                const val = yVal * 12 + mVal;
                if (val > lastPaidMonthVal) lastPaidMonthVal = val;
              });
            }
          });

          // Jika user belum pernah bayar sama sekali, set beban dari bulan bergabung
          if (lastPaidMonthVal === 0) {
            const joinDate = new Date(sub.created_at || now);
            lastPaidMonthVal = joinDate.getFullYear() * 12 + (joinDate.getMonth() + 1) - 1; 
          }

          // KONDISI PENGINGAT REALTIME:
          // Status LUNAS (Aman) = jika bulan terakhir dibayar sudah melewati atau sama dengan bulan saat ini.
          let isLunas = lastPaidMonthVal >= currentMonthVal;

          // Toleransi / Grace Period untuk donatur Batch 2:
          // Jika bulan ini sebelum Juni (Bulan 6), jangan tagih mereka
          if (userBatch === 'batch2' && currentMonthOnly < 6) {
            isLunas = true;
          }

          return {
            sub_id: sub.id,
            user_id: sub.user_id,
            nama_lengkap: profile?.nama_lengkap || 'Tanpa Nama',
            no_wa: profile?.no_wa || '-',
            package_id: sub.package_id,
            package_name: pkg?.name || 'Paket Kakak Saku',
            user_batch: userBatch, 
            bill_reff: lastPayment ? lastPayment.bill_reff : null,
            status_bayar: isLunas ? 'success' : 'pending' 
          };
        });
        
        setListDonatur(finalData);
      } else {
        setListDonatur([]);
      }
    } catch (err: any) {
      console.error("Kesalahan sistem:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const kirimWA = (nama: string, wa: string, packageId: string) => {
    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const bulanSekarang = namaBulan[new Date().getMonth()];
    const paket = packages.find(p => p.id === packageId);
    const nominal = paket ? paket.amount.toLocaleString('id-ID') : '0';

    let formattedWa = wa.replace(/\D/g, '');
    if (formattedWa.startsWith('0')) {
      formattedWa = '62' + formattedWa.slice(1);
    }

    const txt = `Halo, Kak ${nama},\nSalam hangat dari Jakarta Mengabdi! 👋🏻✨\n\nKami dari Jakarta Mengabdi ingin mengucapkan terima kasih banyak atas dukungan berkelanjutan yang Kakak berikan selama ini.\n\nUntuk memastikan langkah kebaikan ini terus berjalan, kami izin mengingatkan kembali terkait komitmen donasi bulanan program Kakak Saku untuk bulan ${bulanSekarang} sebesar Rp ${nominal}.\n\nTerima kasih atas partisipasinya, semoga kebaikan yang diberikan memberi kebahagiaan untuk penerima dan pemberinya❤️.\n\nSalam hangat,\nJakarta Mengabdi\nDatang Dari Hati🧡🤎\n\nLAMAN INFORMASI PEMBAYARAN KAKAK SAKU:\nhttps://kakasaku.jakartamengabdi.com/kakasaku`;

    window.open(`https://api.whatsapp.com/send?phone=${formattedWa}&text=${encodeURIComponent(txt)}`, '_blank');
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

  // LOGIKA STATISTIK KPI (TOTAL AKUMULASI & PER BATCH)
  const stats = {
    // Total Keseluruhan
    totalAll: listDonatur.length,
    lunasAll: listDonatur.filter(d => d.status_bayar === 'success' || d.status_bayar === 'settled').length,
    sisaAll: listDonatur.length - listDonatur.filter(d => d.status_bayar === 'success' || d.status_bayar === 'settled').length,

    // Batch 1
    totalB1: listDonatur.filter(d => d.user_batch === 'batch1').length,
    lunasB1: listDonatur.filter(d => d.user_batch === 'batch1' && (d.status_bayar === 'success' || d.status_bayar === 'settled')).length,
    sisaB1: listDonatur.filter(d => d.user_batch === 'batch1').length - listDonatur.filter(d => d.user_batch === 'batch1' && (d.status_bayar === 'success' || d.status_bayar === 'settled')).length,

    // Batch 2
    totalB2: listDonatur.filter(d => d.user_batch === 'batch2').length,
    lunasB2: listDonatur.filter(d => d.user_batch === 'batch2' && (d.status_bayar === 'success' || d.status_bayar === 'settled')).length,
    sisaB2: listDonatur.filter(d => d.user_batch === 'batch2').length - listDonatur.filter(d => d.user_batch === 'batch2' && (d.status_bayar === 'success' || d.status_bayar === 'settled')).length,
  };

  const filtered = listDonatur.filter(d => {
    const matchPkg = selectedPackage === "all" || d.package_id === selectedPackage;
    const matchBatch = selectedBatchFilter === "all" || d.user_batch === selectedBatchFilter;
    const matchNama = d.nama_lengkap?.toLowerCase().includes(filterNama.toLowerCase());
    return matchPkg && matchBatch && matchNama;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar 
        isMobileOpen={isMobileMenuOpen} 
        setIsMobileOpen={setIsMobileMenuOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      <div className="flex-grow flex flex-col min-w-0 transition-all duration-500">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        <main className={`flex-grow transition-all duration-500 pt-20 md:pt-8 p-6 md:p-12 space-y-10 ${
          isCollapsed ? "md:ml-20" : "md:ml-64"
        }`}>
          
          {/* SECTION: BATCH MODE PENDAFTARAN KAKAK SAKU */}
          <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-6 transition-all hover:border-orange-100">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all ${
                batchMode === 'none' ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-green-50 text-green-500'
              }`}>
                {batchMode === 'none' ? <ShieldAlert size={32} /> : <Power size={32} />}
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1A1A1A]">Pendaftaran Kakak Saku</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">
                  Status: {batchMode === 'none' ? 'DITUTUP' : batchMode === 'both' ? 'BATCH 1 & 2 DIBUKA' : `${batchMode.toUpperCase()} DIBUKA ${batchMode === 'batch1' ? '(Mar-Nov)' : '(Jun-Nov)'}`}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <Button 
                disabled={isUpdatingBatch}
                onClick={() => handleToggleBatch('batch1')}
                className={`px-8 h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                  (batchMode === 'batch1' || batchMode === 'both')
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-100' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isUpdatingBatch ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                Batch 1 (Mar-Nov)
              </Button>
              <Button 
                disabled={isUpdatingBatch}
                onClick={() => handleToggleBatch('batch2')}
                className={`px-8 h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                  (batchMode === 'batch2' || batchMode === 'both')
                  ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-purple-100' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isUpdatingBatch ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                Batch 2 (Jun-Nov)
              </Button>
              <Button 
                disabled={isUpdatingBatch}
                onClick={() => handleToggleBatch('none')}
                className={`px-8 h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                  batchMode === 'none'
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-100 border-transparent' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isUpdatingBatch ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
                Tutup Pendaftaran
              </Button>
            </div>
          </div>

          {/* KPI STATISTIK DETAIL */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md space-y-4">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner"><Users size={28}/></div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Total Donatur</p>
                  <p className="text-4xl font-black text-gray-900">{stats.totalAll}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 grid grid-cols-2 text-center text-xs font-bold text-gray-500">
                <div className="border-r border-gray-100">Batch 1: <span className="text-blue-600 font-black">{stats.totalB1}</span></div>
                <div>Batch 2: <span className="text-purple-600 font-black">{stats.totalB2}</span></div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md space-y-4">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 shadow-inner"><CheckCircle2 size={28}/></div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Lunas (Sesuai Bulan)</p>
                  <p className="text-4xl font-black text-green-600">{stats.lunasAll}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 grid grid-cols-2 text-center text-xs font-bold text-gray-500">
                <div className="border-r border-gray-100">Batch 1: <span className="text-green-600 font-black">{stats.lunasB1}</span></div>
                <div>Batch 2: <span className="text-green-600 font-black">{stats.lunasB2}</span></div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-md space-y-4">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-inner"><Clock size={28}/></div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5">Menunggak</p>
                  <p className="text-4xl font-black text-orange-500">{stats.sisaAll}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 grid grid-cols-2 text-center text-xs font-bold text-gray-500">
                <div className="border-r border-gray-100">Batch 1: <span className="text-orange-600 font-black">{stats.sisaB1}</span></div>
                <div>Batch 2: <span className="text-orange-600 font-black">{stats.sisaB2}</span></div>
              </div>
            </div>
          </div>

          {/* UTILITY PANELS (PENCARIAN & FILTER BATCH) */}
          <div className="bg-white/50 p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative w-full max-w-xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 w-6 h-6" />
                <input 
                  placeholder="Cari nama Kakak Saku..." 
                  className="w-full pl-14 pr-8 py-5 rounded-[1.5rem] bg-gray-50 font-bold text-lg outline-none border-2 border-transparent focus:border-orange-500/20 transition-all shadow-inner"
                  onChange={(e) => setFilterNama(e.target.value)} 
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant={selectedPackage === "all" ? "default" : "outline"} onClick={() => setSelectedPackage("all")} className="rounded-2xl font-black text-xs uppercase h-12 px-6">Semua Paket</Button>
                {packages.map(p => (
                  <Button key={p.id} variant={selectedPackage === p.id ? "default" : "outline"} onClick={() => setSelectedPackage(p.id)} className="rounded-2xl font-black text-xs uppercase h-12 px-6">{p.name} (Rp{p.amount / 1000}k)</Button>
                ))}
              </div>
            </div>

            {/* TAB FILTER BATCH */}
            <div className="border-t border-gray-100/80 pt-5 flex items-center gap-3">
              <Layers className="w-4 h-4 text-gray-400 mr-1" />
              <Button 
                variant={selectedBatchFilter === "all" ? "default" : "ghost"} 
                onClick={() => setSelectedBatchFilter("all")} 
                className="rounded-xl font-bold text-xs h-10 px-5 active:scale-95 transition-transform"
              >
                Semua Batch
              </Button>
              <Button 
                variant={selectedBatchFilter === "batch1" ? "default" : "ghost"} 
                onClick={() => setSelectedBatchFilter("batch1")} 
                className="rounded-xl font-bold text-xs h-10 px-5 text-blue-600 hover:text-blue-700 active:scale-95 transition-transform"
              >
                Batch 1 Only
              </Button>
              <Button 
                variant={selectedBatchFilter === "batch2" ? "default" : "ghost"} 
                onClick={() => setSelectedBatchFilter("batch2")} 
                className="rounded-xl font-bold text-xs h-10 px-5 text-purple-600 hover:text-purple-700 active:scale-95 transition-transform"
              >
                Batch 2 Only
              </Button>
            </div>
          </div>

          {/* TABEL DATA */}
          <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-50 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? ( 
                <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-orange-500 w-12 h-12" /></div> 
              ) : (
                <table className="w-full text-left min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      <th className="px-12 py-8">Donatur</th>
                      <th className="px-12 py-8">Paket</th>
                      <th className="px-12 py-8 text-center">Status</th>
                      <th className="px-12 py-8 text-center">Batas Lunas</th>
                      <th className="px-12 py-8 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((row, i) => {
                      const isSuccess = row.status_bayar === 'success' || row.status_bayar === 'settled';
                      const batasLunas = getBatasLunas(row.bill_reff);
                      return (
                        <tr key={i} className="hover:bg-gray-50/50 transition-all group">
                          <td className="px-12 py-8">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="text-xl font-black text-[#1A1A1A] group-hover:text-orange-600 transition-colors">{row.nama_lengkap}</p>
                              {/* BADGE INDIKATOR BATCH */}
                              <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                row.user_batch === 'batch2' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {row.user_batch === 'batch2' ? 'B2' : 'B1'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400 font-bold tracking-tight">{row.no_wa}</p>
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
                            {batasLunas ? (
                              <span className="text-sm font-black text-gray-700 bg-gray-50 px-5 py-2.5 rounded-xl border border-gray-100 uppercase tracking-[0.15em]">{batasLunas}</span>
                            ) : <span className="text-gray-300 font-bold text-lg">-</span>}
                          </td>
                          <td className="px-12 py-8 text-center">
                            {!isSuccess ? (
                              <Button 
                                className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase px-8 h-12 rounded-2xl shadow-lg shadow-orange-500/20 transition-all hover:scale-105"
                                onClick={() => kirimWA(row.nama_lengkap, row.no_wa, row.package_id)}
                              >
                                <MessageCircle className="w-5 h-5 mr-2" /> Ingatkan
                              </Button>
                            ) : (
                              <div className="flex items-center justify-center text-green-600 text-xs font-black uppercase tracking-[0.2em] bg-green-50/50 py-3 rounded-2xl border border-green-100"><ShieldCheck className="w-5 h-5 mr-2" /> Aman</div>
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