import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, ShieldCheck, CreditCard, Sparkles, 
  CheckCircle2, ChevronLeft, ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

// Helper function untuk mengubah "Bulan-Tahun" menjadi angka agar mudah dibandingkan
// Contoh: bulan 2 tahun 2026 -> (2026 * 12) + 2 = 24314
const getMonthValue = (id: string) => {
  const [m, y] = id.split('-').map(Number);
  return y * 12 + m;
};

export default function KakasakuPayBill() {
  const location = useLocation();
  const navigate = useNavigate();
  const subId = location.state?.subId;

  const [subData, setSubData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>([]);
  const [paidBillIds, setPaidBillIds] = useState<string[]>([]); // State untuk bulan yang sudah lunas

  useEffect(() => {
    const fetchData = async () => {
      if (!subId) {
        alert("Data langganan tidak ditemukan!");
        navigate('/kakasaku/dashboard');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Mengambil profil
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile({ ...profileData, email: user.email });

      // Mengambil data langganan
      const { data: subscription } = await supabase
        .from('kakasaku_subscriptions')
        .select('*, kakasaku_packages(*)')
        .eq('id', subId)
        .single();
        
      if (subscription) {
        setSubData(subscription);

        // Mengambil riwayat pembayaran yang sudah SETTLED/SUCCESS untuk menandai bulan lunas
        const { data: payments } = await supabase
          .from('kakasaku_payments')
          .select('bill_reff')
          .eq('subscription_id', subId)
          .in('status', ['settled', 'success', 'paid']); // Sesuaikan dengan status sukses Faspay di DB Anda

        let paidMonths: string[] = [];
        payments?.forEach((p: any) => {
          // Ekstrak ID bulan di dalam kurung (...) dari bill_reff
          // Contoh format: "Bayar 2 bulan (1-2026, 2-2026)"
          const match = p.bill_reff?.match(/\((.*?)\)/);
          if (match) {
            const months = match[1].split(',').map((s: string) => s.trim());
            paidMonths = [...paidMonths, ...months];
          }
        });
        setPaidBillIds(paidMonths);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [subId, navigate]);

  const availableBills = useMemo(() => {
    const joinDate = subData?.created_at ? new Date(subData.created_at) : new Date();
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth() + 1; // 1-indexed
    const joinValue = getMonthValue(`${joinMonth}-${joinYear}`);

    return MONTHS.map((monthName, i) => {
      const m = i + 1;
      const y = currentYear;
      const id = `${m}-${y}`;
      const currentVal = getMonthValue(id);
      
      const isBeforeJoin = currentVal < joinValue;
      const isPaid = paidBillIds.includes(id);

      // Logika berurutan: Cek apakah bulan sebelumnya sudah lunas atau sedang dipilih
      let isSequentialValid = true;
      if (!isBeforeJoin && !isPaid) {
         let prevM = m - 1;
         let prevY = y;
         if (prevM === 0) { 
           prevM = 12; 
           prevY -= 1; 
         }
         
         const prevId = `${prevM}-${prevY}`;
         const prevVal = getMonthValue(prevId);

         // Jika bulan sebelumnya masih dalam masa langganan, ia WAJIB lunas atau sedang dipilih
         if (prevVal >= joinValue) {
            isSequentialValid = paidBillIds.includes(prevId) || selectedBillIds.includes(prevId);
         }
      }

      // Disabled jika: sebelum join, sudah lunas, atau urutannya belum terbuka
      const isDisabled = isBeforeJoin || isPaid || !isSequentialValid;

      return {
        id,
        month: monthName,
        year: currentYear,
        amount: subData?.amount || 0,
        isDisabled,
        isPaid
      };
    });
  }, [currentYear, subData, paidBillIds, selectedBillIds]);

  const toggleBill = (bill: any) => {
    // Jika disabled dan tidak sedang dipilih, batalkan klik
    if (bill.isDisabled && !selectedBillIds.includes(bill.id)) return; 

    setSelectedBillIds(prev => {
      if (prev.includes(bill.id)) {
        // JIKA UNCHECK: Hapus bulan ini dan SEMUA bulan setelahnya agar urutan tidak bolong
        const targetVal = getMonthValue(bill.id);
        return prev.filter(id => getMonthValue(id) < targetVal);
      } else {
        // JIKA CHECK: Tambahkan ke pilihan
        return [...prev, bill.id];
      }
    });
  };

  const handleSelectAll = () => {
    // Cari semua bulan di tahun ini yang valid (setelah join & belum lunas)
    const joinDate = subData?.created_at ? new Date(subData.created_at) : new Date();
    const joinVal = getMonthValue(`${joinDate.getMonth() + 1}-${joinDate.getFullYear()}`);
    
    let unpaidIdsThisYear: string[] = [];
    for (let m = 1; m <= 12; m++) {
       const id = `${m}-${currentYear}`;
       const val = getMonthValue(id);
       if (val >= joinVal && !paidBillIds.includes(id)) {
           unpaidIdsThisYear.push(id);
       }
    }

    if (unpaidIdsThisYear.length === 0) return;

    const isAllSelected = unpaidIdsThisYear.every(id => selectedBillIds.includes(id));

    if (isAllSelected) {
      // Uncheck semua pilihan dari tahun ini ke depan
      const firstValToRemove = getMonthValue(unpaidIdsThisYear[0]);
      setSelectedBillIds(prev => prev.filter(id => getMonthValue(id) < firstValToRemove));
    } else {
      // Validasi: Apakah bulan pertama di tahun ini bisa diklik? (Mencegah loncat tahun)
      const firstUnpaidBill = availableBills.find(b => b.id === unpaidIdsThisYear[0]);
      if (firstUnpaidBill?.isDisabled && !selectedBillIds.includes(firstUnpaidBill.id)) {
        alert("Pilih dan lunasi tagihan di tahun sebelumnya terlebih dahulu.");
        return;
      }
      
      // Check semua sisa tagihan di tahun ini
      setSelectedBillIds(prev => Array.from(new Set([...prev, ...unpaidIdsThisYear])));
    }
  };

  const calculateTotal = () => selectedBillIds.length * (subData?.amount || 0);

  const handleProcessPayment = async () => {
    if (selectedBillIds.length === 0) {
      alert("Pilih minimal satu bulan tagihan!");
      return;
    }

    setProcessing(true);
    
    try {
      const billNo = `KKSK-MULTI-${Date.now()}`;
      const totalAmount = calculateTotal();

      // URUTKAN selectedBillIds sebelum di-save supaya di database rapi (opsional tapi disarankan)
      const sortedBillIds = [...selectedBillIds].sort((a, b) => getMonthValue(a) - getMonthValue(b));

      const { error: dbError } = await supabase.from('kakasaku_payments').insert({
        bill_no: billNo,
        amount: totalAmount,
        bill_total: totalAmount, 
        status: 'pending',
        user_id: profile.id,
        subscription_id: subId,
        bill_reff: `Bayar ${sortedBillIds.length} bulan (${sortedBillIds.join(', ')})`
      });

      if (dbError) throw new Error(`Gagal membuat record pembayaran: ${dbError.message}`);

      const { data: result, error: apiError } = await supabase.functions.invoke('swift-api', {
        body: {
          action: 'request_payment',
          payment_type: 'kakasaku', 
          bill_no: billNo,
          bill_total: totalAmount, 
          amount: totalAmount,
          cust_name: profile.nama_lengkap || 'Kakak Saku',
          email: profile.email,
          program_name: `Iuran Kakak Saku - ${sortedBillIds.length} Bulan`,
          phone: profile.no_hp || "08123456789" 
        }
      });

      if (apiError) throw new Error(`Gagal memanggil server: ${apiError.message}`);

      const linkFaspay = result?.redirect_url || result?.payment_url || result?.url;

      if (linkFaspay) {
        window.location.href = linkFaspay; 
      } else {
        const errorDesc = result?.response_desc || "Gagal mendapatkan link pembayaran dari Faspay.";
        throw new Error(`Faspay Error: ${errorDesc}`);
      }

    } catch (error: any) {
      console.error("Payment Process Error:", error);
      alert(error.message); 
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-orange-500 bg-[#FDFCFB]">MENYIAPKAN TAGIHAN...</div>;

  // Cek apakah tombol "Pilih Semua" perlu di-disable atau berubah text-nya
  const validBillsThisYear = availableBills.filter(b => !b.isDisabled && !b.isPaid);
  const isAllCurrentYearSelected = validBillsThisYear.length > 0 && validBillsThisYear.every(b => selectedBillIds.includes(b.id));

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <div className="max-w-2xl mx-auto p-4 md:p-8 pt-10 pb-24 space-y-8"> 
        
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/kakasaku/dashboard')} className="rounded-full w-12 h-12 p-0 bg-white shadow-sm border border-gray-100 shrink-0">
            <ArrowLeft className="h-5 w-5 text-[#1A1A1A]" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-[#1A1A1A]">Pilih Bulan Tagihan</h1>
            <p className="text-muted-foreground text-sm">Pilih satu atau lebih untuk dibayar sekaligus.</p>
          </div>
        </div>

        {/* NAVIGASI TAHUN */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 gap-4">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-orange-50 hover:text-orange-500" onClick={() => setCurrentYear(y => y - 1)}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <span className="text-2xl font-black text-[#1A1A1A] w-16 text-center">{currentYear}</span>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-orange-50 hover:text-orange-500" onClick={() => setCurrentYear(y => y + 1)}>
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
          
          <Button 
            variant={isAllCurrentYearSelected ? "outline" : "default"}
            onClick={handleSelectAll}
            disabled={validBillsThisYear.length === 0 && !isAllCurrentYearSelected}
            className={`rounded-full font-bold px-6 ${
              (validBillsThisYear.length === 0 && !isAllCurrentYearSelected)
                ? 'bg-gray-100 text-gray-400' 
                : isAllCurrentYearSelected 
                  ? 'border-orange-200 text-orange-500 hover:bg-orange-50' 
                  : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
            }`}
          >
            {isAllCurrentYearSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
          </Button>
        </div>

        {/* GRID KALENDER BULAN */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {availableBills.map((bill) => {
            const isSelected = selectedBillIds.includes(bill.id);
            return (
              <div 
                key={bill.id}
                onClick={() => toggleBill(bill)}
                className={`relative flex flex-col items-center justify-center p-5 rounded-[1.5rem] border-2 transition-all overflow-hidden
                  ${bill.isDisabled && !isSelected 
                    ? 'border-gray-50 bg-gray-50/50 opacity-50 cursor-not-allowed' 
                    : isSelected 
                      ? 'border-orange-500 bg-orange-50/50 shadow-md shadow-orange-500/10 cursor-pointer hover:scale-[1.02] active:scale-95' 
                      : 'border-gray-100 bg-white hover:border-orange-200 cursor-pointer hover:scale-[1.02] active:scale-95'
                  }`}
              >
                {/* Badge Lunas */}
                {bill.isPaid && (
                  <div className="absolute top-0 right-0 bg-green-100 text-green-600 text-[10px] px-3 py-1 rounded-bl-xl font-bold tracking-wider">
                    LUNAS
                  </div>
                )}
                
                {isSelected && !bill.isDisabled && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5 text-orange-500" />
                  </div>
                )}
                
                <span className={`text-sm font-bold mb-1 ${bill.isDisabled && !isSelected ? 'text-gray-400' : isSelected ? 'text-orange-600' : 'text-gray-500'}`}>
                  {bill.month}
                </span>
                <span className={`text-sm font-black ${bill.isDisabled && !isSelected ? 'text-gray-300' : isSelected ? 'text-[#1A1A1A]' : 'text-gray-400'}`}>
                  Rp{(bill.amount / 1000)}k
                </span>
              </div>
            );
          })}
        </div>

        {/* KOTAK PEMBAYARAN */}
        {selectedBillIds.length > 0 && (
          <div className="bg-white border-2 border-orange-100 shadow-xl shadow-orange-500/10 rounded-[2rem] p-6 md:p-8 animate-in slide-in-from-bottom-4 fade-in duration-300 mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Terpilih</p>
                <div className="flex items-center gap-2">
                  <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black">
                    {selectedBillIds.length} Bulan
                  </span>
                </div>
              </div>
              <div className="sm:text-right w-full sm:w-auto p-4 sm:p-0 bg-gray-50 sm:bg-transparent rounded-xl">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Bayar</p>
                <p className="text-3xl font-black text-orange-500">
                  Rp {calculateTotal().toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full py-7 text-lg font-black rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-500/30 transition-all hover:-translate-y-1 active:scale-95 disabled:bg-gray-200"
              onClick={handleProcessPayment}
              disabled={processing || selectedBillIds.length === 0}
            >
              {processing ? (
                <><Sparkles className="w-5 h-5 animate-spin mr-2" /> Memproses...</>
              ) : (
                <><CreditCard className="w-5 h-5 mr-2" /> Bayar via Faspay</>
              )}
            </Button>
            
            <div className="flex justify-center items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-5 opacity-80">
              <ShieldCheck className="w-4 h-4" /> Secured by Faspay
            </div>
          </div>
        )}

      </div>
    </div>
  );
}