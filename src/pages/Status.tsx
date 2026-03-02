import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Home, LayoutDashboard, Clock, XCircle, Loader2, RefreshCw } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

export default function Status() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [inquiryResult, setInquiryResult] = useState<any>(null);

  // 1. Ambil data dari URL Faspay
  const trxId = searchParams.get("trx_id");
  const billNo = searchParams.get("bill_no") || searchParams.get("bill_ref");
  const urlStatus = searchParams.get("status");

  // 2. Fungsi Cek Status ke Backend
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

  // 3. Logika Penentuan Status (Inquiry Result > URL Status)
  const pCode = inquiryResult?.payment_status_code || urlStatus;
  const isSuccess = pCode === "2";
  const isPending = pCode === "1" || pCode === "0" || !pCode;

  const formatRupiah = (angka: string | null) => {
    if (!angka) return "Rp 0";
    return new Intl.NumberFormat("id-ID", { 
      style: "currency", 
      currency: "IDR", 
      minimumFractionDigits: 0 
    }).format(parseInt(angka));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow flex items-center justify-center p-4 py-12">
        <Card className={`max-w-md w-full shadow-2xl border-t-8 rounded-3xl overflow-hidden bg-white transition-all duration-500 ${
          isSuccess ? 'border-t-green-500' : isPending ? 'border-t-orange-500' : 'border-t-red-500'
        }`}>
          <CardContent className="p-8 text-center space-y-6">
            
            {/* Ikon Animasi Berdasarkan Status */}
            <div className="relative w-24 h-24 mx-auto">
              <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${
                isSuccess ? 'bg-green-100' : isPending ? 'bg-orange-100' : 'bg-red-100'
              }`}></div>
              <div className={`relative w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
                isSuccess ? 'bg-green-100' : isPending ? 'bg-orange-100' : 'bg-red-100'
              }`}>
                {loading ? <Loader2 className="w-12 h-12 text-gray-400 animate-spin" /> : 
                 isSuccess ? <CheckCircle2 className="w-12 h-12 text-green-500" /> : 
                 isPending ? <Clock className="w-12 h-12 text-orange-500" /> : 
                 <XCircle className="w-12 h-12 text-red-500" />}
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A]">
                {loading ? "Checking Status..." : isSuccess ? "Success!" : isPending ? "Pending" : "Failed"}
              </h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                {isSuccess ? "Tindakan baik Anda telah tercatat. Semoga membawa keberkahan." : 
                 isPending ? "Silakan selesaikan pembayaran sesuai metode yang dipilih." : 
                 "Maaf, transaksi Anda tidak dapat diproses."}
              </p>
            </div>
            
            {/* Info Detail Transaksi */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left text-sm space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-gray-500 font-medium">No. Referensi</span>
                <span className="font-bold text-[#1A1A1A]">{billNo || '-'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <span className="text-gray-500 font-medium">ID Transaksi</span>
                <span className="font-bold text-[#1A1A1A]">{trxId || inquiryResult?.trx_id || '-'}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-gray-500 font-medium">Total Nominal</span>
                <span className="font-black text-orange-600 text-base">
                  {formatRupiah(inquiryResult?.bill_total || searchParams.get("bill_total"))}
                </span>
              </div>
            </div>
            
            <div className="pt-2 flex flex-col gap-3">
              <Button 
                variant="gold" 
                className="w-full font-bold py-6 rounded-xl text-md shadow-lg shadow-orange-500/20"
                onClick={() => navigate('/kakasaku/dashboard')}
              >
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Cek Dashboard Saya
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="font-bold py-6 rounded-xl border-gray-200 text-gray-600"
                  onClick={() => navigate('/')}
                >
                  <Home className="w-5 h-5 mr-2" />
                  Beranda
                </Button>
                <Button 
                  variant="outline" 
                  className="font-bold py-6 rounded-xl border-gray-200 text-gray-600"
                  onClick={fetchStatus}
                  disabled={loading}
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}