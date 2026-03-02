import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Home, LayoutDashboard, Clock, XCircle, Loader2, RefreshCw, Code } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Status() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // 1. Ambil data awal dari URL (Data dari Faspay Redirect)
  const trxIdFromUrl = searchParams.get("trx_id");
  const billNoFromUrl = searchParams.get("bill_no") || searchParams.get("bill_ref");
  
  // 2. State untuk mengelola hasil pengecekan asli (Inquiry)
  const [loading, setLoading] = useState(false);
  const [inquiryResult, setInquiryResult] = useState<any>(null);
  const [showJson, setShowJson] = useState(false); // Untuk memudahkan copy-paste UAT

  // 3. Fungsi utama untuk Cek Status ke Server (Inquiry)
  const fetchLatestStatus = async () => {
    if (!billNoFromUrl || !trxIdFromUrl) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('swift-api', {
        body: {
          action: 'check_status',
          bill_no: billNoFromUrl,
          trx_id: trxIdFromUrl
        }
      });

      if (error) throw error;
      setInquiryResult(data);
      
      console.log("Faspay Inquiry Response:", data);
    } catch (err: any) {
      console.error("Inquiry Error:", err);
      toast({
        title: "Gagal Update Status",
        description: "Tidak bisa terhubung ke server pembayaran.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 4. Jalankan pengecekan otomatis saat halaman dibuka
  useEffect(() => {
    fetchLatestStatus();
  }, [trxIdFromUrl, billNoFromUrl]);

  // 5. Logika penentuan tampilan berdasarkan hasil Inquiry
  const paymentStatusCode = inquiryResult?.payment_status_code || searchParams.get("status");
  const isSuccess = paymentStatusCode === "2";
  const isPending = paymentStatusCode === "1" || paymentStatusCode === "0";
  const amount = inquiryResult?.bill_total || searchParams.get("bill_total");

  const formatRupiah = (angka: string | null) => {
    if (!angka) return "Rp 0";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(parseInt(angka));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full space-y-4">
          <Card className={`shadow-2xl border-t-8 rounded-3xl overflow-hidden bg-white transition-all duration-500 ${
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
                  {loading ? "Mengecek Status..." : isSuccess ? "Terima Kasih!" : isPending ? "Menunggu Pembayaran" : "Pembayaran Gagal"}
                </h1>
                <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                  {isSuccess ? "Tindakan baik Anda telah tercatat. Semoga membawa keberkahan." : 
                   isPending ? "Silakan selesaikan pembayaran Anda sesuai dengan metode yang telah dipilih." : 
                   "Maaf, transaksi Anda tidak dapat diproses atau telah dibatalkan."}
                </p>
              </div>
              
              {/* Kotak Info Detail Transaksi */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left text-sm space-y-3 my-6">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-gray-500 font-medium">No. Referensi</span>
                  <span className="font-bold text-[#1A1A1A]">{billNoFromUrl || '-'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-gray-500 font-medium">ID Transaksi</span>
                  <span className="font-bold text-[#1A1A1A]">{trxIdFromUrl || '-'}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-500 font-medium">Total Nominal</span>
                  <span className="font-black text-orange-600 text-base">{formatRupiah(amount)}</span>
                </div>
              </div>
              
              <div className="pt-2 flex flex-col gap-3">
                <Button 
                  variant="gold" 
                  className="w-full font-bold py-6 rounded-xl text-md shadow-lg shadow-orange-500/20"
                  onClick={() => navigate('/kakasaku/dashboard')}
                >
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Dashboard Saya
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
                    onClick={fetchLatestStatus}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Tombol Rahasia buat UAT (Munculkan JSON) */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] text-gray-400 uppercase tracking-widest mt-4"
                onClick={() => setShowJson(!showJson)}
              >
                <Code className="w-3 h-3 mr-1" /> {showJson ? "Sembunyikan Raw JSON" : "Lihat Raw JSON untuk UAT"}
              </Button>

            </CardContent>
          </Card>

          {/* Panel JSON yang muncul saat diklik (Tinggal Copy ke Excel) */}
          {showJson && inquiryResult && (
            <Card className="bg-slate-900 border-none rounded-2xl p-4">
              <p className="text-white text-[10px] mb-2 font-mono">Actual Result untuk TC-04 / TC-05:</p>
              <pre className="text-green-400 text-[10px] overflow-x-auto font-mono text-left">
                {JSON.stringify(inquiryResult, null, 2)}
              </pre>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}