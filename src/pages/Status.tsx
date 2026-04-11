import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Home, LayoutDashboard, Clock, XCircle, Loader2, RefreshCw, CreditCard } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

export default function Status() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [inquiryResult, setInquiryResult] = useState<any>(null);

  const billNo = searchParams.get("bill_no") || searchParams.get("bill_ref");
  const urlStatus = searchParams.get("status");

  const fetchStatus = async () => {
    if (!billNo) return;
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('swift-api', {
        body: { action: 'check_status', bill_no: billNo }
      });
      setInquiryResult(data);
    } catch (err) { 
      console.error("Inquiry Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchStatus(); 
  }, [billNo]);

  const pCode = inquiryResult?.payment_status_code || urlStatus;
  const isSuccess = pCode === "2";
  const isPending = pCode === "1" || pCode === "0" || !pCode;

  const formatRupiah = (angka: any) => {
    if (!angka) return "Rp 0";
    const val = typeof angka === 'string' ? parseInt(angka) : angka;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
  };

  // --- LOGIKA NAVIGASI DINAMIS (FIX NOT FOUND) ---
  const handlePayNow = async () => {
    if (!billNo) return;
    setLoading(true);

    try {
      if (billNo.startsWith('DON-')) {
        // A. KEMBALI KE DONASI UMUM
        const { data: oldDonation } = await supabase.from("donations").select("*").eq("bill_no", billNo).single();
        if (oldDonation) {
          const params = new URLSearchParams({
            amount: oldDonation.amount?.toString() || "",
            name: oldDonation.donor_name || "",
            phone: oldDonation.donor_phone || "",
            email: oldDonation.donor_email || "",
            msg: oldDonation.message || "",
            program: oldDonation.program_id || ""
          });
          navigate(`/donate?${params.toString()}`);
        }
      } 
      else if (billNo.startsWith('KKSK-')) {
        // B. KEMBALI KE PEMBAYARAN TAGIHAN KAKAK SAKU
        const { data: oldPayment } = await supabase.from("kakasaku_payments").select("subscription_id").eq("bill_no", billNo).single();
        if (oldPayment) {
          // PERBAIKAN: Menggunakan rute '/kakasaku/bayar-tagihan' sesuai App.tsx
          navigate('/kakasaku/bayar-tagihan', { state: { subId: oldPayment.subscription_id } });
        } else {
          navigate('/kakasaku/dashboard');
        }
      }
    } catch (err) {
      console.error("Redirect Error:", err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-[#1A1A1A]">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 py-12">
        <Card className={`max-w-md w-full shadow-2xl border-t-8 rounded-3xl overflow-hidden bg-white transition-all duration-500 ${
          isSuccess ? 'border-t-green-500' : isPending ? 'border-t-orange-500' : 'border-t-red-500'
        }`}>
          <CardContent className="p-8 text-center space-y-6">
            <div className={`relative w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
              isSuccess ? 'bg-green-100' : isPending ? 'bg-orange-100' : 'bg-red-100'
            }`}>
              {loading ? <Loader2 className="w-12 h-12 text-gray-400 animate-spin" /> : 
               isSuccess ? <CheckCircle2 className="w-12 h-12 text-green-500" /> : 
               isPending ? <Clock className="w-12 h-12 text-orange-500" /> : 
               <XCircle className="w-12 h-12 text-red-500" />}
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-black">
                {loading ? "Checking..." : isSuccess ? "Success!" : isPending ? "Pending" : "Failed"}
              </h1>
              <p className="text-gray-500 text-sm">
                {isSuccess ? "Terima kasih atas bantuan Anda!" : 
                 isPending ? "Pembayaran belum kami terima. Silakan ulangi atau selesaikan pembayaran." : "Transaksi gagal."}
              </p>
            </div>
            
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left text-sm space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-gray-500 font-medium">No. Referensi</span>
                <span className="font-bold">{billNo || '-'}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-500 font-medium">Total Nominal</span>
                <span className="font-black text-orange-600 text-base">
                  {formatRupiah(inquiryResult?.bill_total || searchParams.get("bill_total"))}
                </span>
              </div>
            </div>
            
            <div className="pt-2 flex flex-col gap-3">
              {isPending && !loading && (
                <Button 
                  className="w-full font-bold py-7 rounded-xl text-lg bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20"
                  onClick={handlePayNow}
                >
                  <CreditCard className="w-6 h-6 mr-2" />
                  Bayar Sekarang (Ulangi)
                </Button>
              )}

              <Button 
                variant="gold" 
                className="w-full font-bold py-6 rounded-xl"
                onClick={() => navigate(billNo?.startsWith('KKSK-') ? '/kakasaku/dashboard' : '/')}
              >
                <LayoutDashboard className="w-5 h-5 mr-2" />
                {billNo?.startsWith('KKSK-') ? 'Dashboard Kakak Saku' : 'Beranda'}
              </Button>
              
              <Button variant="outline" className="font-bold py-6 rounded-xl border-gray-200" onClick={fetchStatus} disabled={loading}>
                <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}