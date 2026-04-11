import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, ShieldCheck, CreditCard, Sparkles, 
  CheckCircle2, ChevronLeft, ChevronRight, Lock 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

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
  const [paidBillIds, setPaidBillIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!subId) {
        navigate('/kakasaku/dashboard');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile({ ...profileData, email: user.email });

      const { data: subscription } = await supabase
        .from('kakasaku_subscriptions')
        .select('*, kakasaku_packages(*)')
        .eq('id', subId)
        .single();
        
      if (subscription) {
        setSubData(subscription);
        const { data: payments } = await supabase
          .from('kakasaku_payments')
          .select('bill_reff')
          .eq('subscription_id', subId)
          .in('status', ['settled', 'success', 'paid']);

        let paidMonths: string[] = [];
        payments?.forEach((p: any) => {
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
    const joinValue = getMonthValue(`${joinDate.getMonth() + 1}-${joinDate.getFullYear()}`);

    return MONTHS.map((monthName, i) => {
      const m = i + 1;
      const y = currentYear;
      const id = `${m}-${y}`;
      const currentVal = getMonthValue(id);
      
      const isBeforeJoin = currentVal < joinValue;
      const isPaid = paidBillIds.includes(id);

      // --- LOGIK BARU: Batasi Desember ---
      const isDecember = m === 12; 

      let isSequentialValid = true;
      if (!isBeforeJoin && !isPaid && !isDecember) {
          let prevM = m - 1;
          let prevY = y;
          if (prevM === 0) { prevM = 12; prevY -= 1; }
          const prevId = `${prevM}-${prevY}`;
          const prevVal = getMonthValue(prevId);
          if (prevVal >= joinValue) {
             isSequentialValid = paidBillIds.includes(prevId) || selectedBillIds.includes(prevId);
          }
      }

      // Desember otomatis isDisabled
      const isDisabled = isBeforeJoin || isPaid || !isSequentialValid || isDecember;

      return {
        id,
        month: monthName,
        year: currentYear,
        amount: subData?.amount || 0,
        isDisabled,
        isPaid,
        isDecember // Flag untuk UI
      };
    });
  }, [currentYear, subData, paidBillIds, selectedBillIds]);

  const toggleBill = (bill: any) => {
    if (bill.isDisabled && !selectedBillIds.includes(bill.id)) return; 

    setSelectedBillIds(prev => {
      if (prev.includes(bill.id)) {
        const targetVal = getMonthValue(bill.id);
        return prev.filter(id => getMonthValue(id) < targetVal);
      } else {
        return [...prev, bill.id];
      }
    });
  };

  const handleSelectAll = () => {
    const joinDate = subData?.created_at ? new Date(subData.created_at) : new Date();
    const joinVal = getMonthValue(`${joinDate.getMonth() + 1}-${joinDate.getFullYear()}`);
    
    let unpaidIdsThisYear: string[] = [];
    // --- LOGIK BARU: Perulangan hanya sampai m=11 (November) ---
    for (let m = 1; m <= 11; m++) {
       const id = `${m}-${currentYear}`;
       const val = getMonthValue(id);
       if (val >= joinVal && !paidBillIds.includes(id)) {
           unpaidIdsThisYear.push(id);
       }
    }

    if (unpaidIdsThisYear.length === 0) return;
    const isAllSelected = unpaidIdsThisYear.every(id => selectedBillIds.includes(id));

    if (isAllSelected) {
      const firstValToRemove = getMonthValue(unpaidIdsThisYear[0]);
      setSelectedBillIds(prev => prev.filter(id => getMonthValue(id) < firstValToRemove));
    } else {
      const firstUnpaidBill = availableBills.find(b => b.id === unpaidIdsThisYear[0]);
      if (firstUnpaidBill?.isDisabled && !selectedBillIds.includes(firstUnpaidBill.id)) {
        alert("Pilih dan lunasi tagihan sebelumnya terlebih dahulu.");
        return;
      }
      setSelectedBillIds(prev => Array.from(new Set([...prev, ...unpaidIdsThisYear])));
    }
  };

  const calculateTotal = () => selectedBillIds.length * (subData?.amount || 0);

  const handleProcessPayment = async () => {
    if (selectedBillIds.length === 0) return;
    setProcessing(true);
    try {
      const billNo = `KKSK-MULTI-${Date.now()}`;
      const totalAmount = calculateTotal();
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

      if (dbError) throw dbError;

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
          phone: profile.no_wa || "08123456789" 
        }
      });

      if (apiError) throw apiError;
      if (result?.redirect_url) window.location.href = result.redirect_url;
    } catch (error: any) {
      alert(error.message); 
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-orange-500 bg-[#FDFCFB]">MENYIAPKAN TAGIHAN...</div>;

  const validBillsThisYear = availableBills.filter(b => !b.isDisabled && !b.isPaid);
  const isAllCurrentYearSelected = validBillsThisYear.length > 0 && validBillsThisYear.every(b => selectedBillIds.includes(b.id));

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <div className="max-w-2xl mx-auto p-4 md:p-8 pt-10 pb-24 space-y-8"> 
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/kakasaku/dashboard')} className="rounded-full w-12 h-12 p-0 bg-white shadow-sm border border-gray-100 shrink-0">
            <ArrowLeft className="h-5 w-5 text-[#1A1A1A]" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-[#1A1A1A]">Pilih Bulan Tagihan</h1>
            <p className="text-muted-foreground text-sm">Pembayaran hanya tersedia sampai bulan November.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 gap-4">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setCurrentYear(y => y - 1)}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <span className="text-2xl font-black text-[#1A1A1A] w-16 text-center">{currentYear}</span>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setCurrentYear(y => y + 1)}>
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
          <Button 
            variant={isAllCurrentYearSelected ? "outline" : "default"}
            onClick={handleSelectAll}
            disabled={validBillsThisYear.length === 0 && !isAllCurrentYearSelected}
            className="rounded-full font-bold px-6"
          >
            {isAllCurrentYearSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {availableBills.map((bill) => {
            const isSelected = selectedBillIds.includes(bill.id);
            return (
              <div 
                key={bill.id}
                onClick={() => !bill.isDecember && toggleBill(bill)}
                className={`relative flex flex-col items-center justify-center p-5 rounded-[1.5rem] border-2 transition-all overflow-hidden
                  ${bill.isDecember 
                    ? 'border-gray-50 bg-gray-50/50 opacity-40 cursor-not-allowed' 
                    : bill.isDisabled && !isSelected 
                      ? 'border-gray-50 bg-gray-50/50 opacity-50 cursor-not-allowed' 
                      : isSelected 
                        ? 'border-orange-500 bg-orange-50/50 shadow-md' 
                        : 'border-gray-100 bg-white hover:border-orange-200 cursor-pointer'
                  }`}
              >
                {bill.isDecember && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                {bill.isPaid && (
                  <div className="absolute top-0 right-0 bg-green-100 text-green-600 text-[10px] px-3 py-1 rounded-bl-xl font-bold uppercase">
                    LUNAS
                  </div>
                )}
                <span className={`text-sm font-bold mb-1 ${bill.isDecember || (bill.isDisabled && !isSelected) ? 'text-gray-400' : 'text-gray-500'}`}>
                  {bill.month}
                </span>
                <span className={`text-sm font-black ${bill.isDecember || (bill.isDisabled && !isSelected) ? 'text-gray-300' : 'text-[#1A1A1A]'}`}>
                  Rp{(bill.amount / 1000)}k
                </span>
              </div>
            );
          })}
        </div>

        {selectedBillIds.length > 0 && (
          <div className="bg-white border-2 border-orange-100 shadow-xl rounded-[2rem] p-6 md:p-8 animate-in slide-in-from-bottom-4 fade-in duration-300 mt-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Terpilih</p>
                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black">
                  {selectedBillIds.length} Bulan
                </span>
              </div>
              <div className="sm:text-right w-full sm:w-auto p-4 sm:p-0 bg-gray-50 sm:bg-transparent rounded-xl">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total Bayar</p>
                <p className="text-3xl font-black text-orange-500">
                  Rp {calculateTotal().toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <Button 
              size="lg" 
              className="w-full py-7 text-lg font-black rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-xl"
              onClick={handleProcessPayment}
              disabled={processing}
            >
              {processing ? <><Sparkles className="w-5 h-5 animate-spin mr-2" /> Memproses...</> : <><CreditCard className="w-5 h-5 mr-2" /> Bayar via Faspay</>}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}