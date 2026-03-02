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
  
  const [loading, setLoading] = useState(false);
  const [inquiryResult, setInquiryResult] = useState<any>(null);
  const [showJson, setShowJson] = useState(false);

  // Ambil data dari URL yang dikirim Faspay (Back to Merchant)
  const trxId = searchParams.get("trx_id");
  const billNo = searchParams.get("bill_no") || searchParams.get("bill_ref");
  const urlStatus = searchParams.get("status");

  const fetchStatus = async () => {
    if (!billNo) return;
    setLoading(true);
    try {
      // Memanggil Edge Function untuk Inquiry Status asli ke Faspay
      const { data, error } = await supabase.functions.invoke('swift-api', {
        body: { action: 'check_status', bill_no: billNo }
      });

      if (error) throw error;

      // Simpan hasil inquiry untuk ditampilkan di panel JSON UAT
      setInquiryResult(data);
    } catch (err: any) {
      console.error("Inquiry Error:", err);
      toast({
        title: "Gagal Cek Status",
        description: "Tidak dapat mengambil data terbaru dari server pembayaran.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Jalankan cek status otomatis saat halaman dibuka
  useEffect(() => {
    fetchStatus();
  }, [billNo]);

  // Penentuan Status: Prioritaskan hasil Inquiry (data) daripada URL (searchParams)
  const pCode = inquiryResult?.payment_status_code || urlStatus;
  const isSuccess = pCode === "2"; // 2 = Success (Paid)
  const isPending = pCode === "1" || pCode === "0" || !pCode; // 1 = Pending, 0 = Awaiting

  const formatRupiah = (angka: string | number | null) => {
    if (!angka) return "Rp 0";
    const val = typeof angka === 'string' ? parseInt(angka) : angka;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full space-y-4">
          <Card className={`shadow-xl border-t-8 rounded-3xl overflow-hidden bg-white ${
            isSuccess ? 'border-t-green-500' : isPending ? 'border-t-orange-500' : 'border-t-red-500'
          }`}>
            <CardContent className="p-8 text-center space-y-6">
              
              {/* Ikon Status */}
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                {loading ? <Loader2 className="animate-spin text-gray-400 w-12 h-12" /> : 
                 isSuccess ? <CheckCircle2 className="text-green-500 w-12 h-12" /> : 
                 isPending ? <Clock className="text-orange-500 w-12 h-12" /> : 
                 <XCircle className="text-red-500 w-12 h-12" />}
              </div>

              {/* Teks Status */}
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-[#1A1A1A]">
                  {loading ? "Mengecek..." : isSuccess ? "Terima Kasih!" : isPending ? "Menunggu Bayar" : "Pembayaran Gagal"}
                </h1>
                <p className="text-gray-500 text-sm">
                  {isSuccess ? "Donasi Anda telah kami terima." : "Silakan selesaikan pembayaran Anda."}
                </p>
              </div>

              {/* Info Detail */}
              <div className="bg-gray-50 p-5 rounded-2xl text-left text-sm space-y-3">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-400">No. Referensi</span>
                  <b className="text-[#1A1A1A]">{billNo || '-'}</b>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-400">ID Transaksi</span>
                  <b className="text-[#1A1A1A]">{trxId || inquiryResult?.trx_id || '-'}</b>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-gray-400">Total Nominal</span>
                  <b className="text-orange-600 font-black">{formatRupiah(inquiryResult?.bill_total || searchParams.get("bill_total"))}</b>
                </div>
              </div>

              {/* Navigasi */}
              <div className="flex flex-col gap-3">
                <Button variant="outline" className="w-full font-bold py-6 rounded-xl" onClick={fetchStatus} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Status
                </Button>
                <Button variant="gold" className="w-full font-bold py-6 rounded-xl" onClick={() => navigate('/kakasaku/dashboard')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Ke Dashboard
                </Button>
              </div>
              
              {/* Tombol Rahasia UAT */}
              <Button 
                variant="ghost" 
                className="text-[10px] uppercase text-gray-400 tracking-widest mt-4" 
                onClick={() => setShowJson(!showJson)}
              >
                <Code className="mr-1 h-3 w-3" /> {showJson ? "Tutup JSON" : "Lihat Raw JSON untuk UAT"}
              </Button>
            </CardContent>
          </Card>

          {/* Panel JSON (Actual Result TC-04 & TC-05) */}
          {showJson && (
            <div className="bg-slate-900 p-5 rounded-2xl overflow-auto text-[10px] text-green-400 font-mono shadow-2xl border border-slate-700">
              <p className="text-white/50 mb-2">// Copy JSON di bawah ke Actual Result Excel</p>
              {inquiryResult ? (
                <pre>{JSON.stringify(inquiryResult, null, 2)}</pre>
              ) : (
                <p className="italic text-gray-500">Data belum tersedia. Klik Refresh Status di atas.</p>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}