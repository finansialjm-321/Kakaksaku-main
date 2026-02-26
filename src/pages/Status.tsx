import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Home, LayoutDashboard, Clock, XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Status() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 1. Menangkap data yang dikirim Faspay dari URL
  const trxId = searchParams.get("trx_id");
  const billNo = searchParams.get("bill_no") || searchParams.get("bill_ref");
  const status = searchParams.get("status");
  const amount = searchParams.get("bill_total");

  // 2. Menentukan kondisi berdasarkan kode status Faspay
  const isSuccess = status === "2";
  const isPending = status === "0";

  const formatRupiah = (angka: string | null) => {
    if (!angka) return "Rp 0";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(parseInt(angka));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow flex items-center justify-center p-4 py-12">
        <Card className={`max-w-md w-full shadow-2xl border-t-8 rounded-3xl overflow-hidden bg-white ${
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
                {isSuccess ? <CheckCircle2 className="w-12 h-12 text-green-500" /> : 
                 isPending ? <Clock className="w-12 h-12 text-orange-500" /> : 
                 <XCircle className="w-12 h-12 text-red-500" />}
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A]">
                {isSuccess ? "Terima Kasih!" : isPending ? "Menunggu Pembayaran" : "Pembayaran Gagal"}
              </h1>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                {isSuccess ? "Tindakan baik Anda telah tercatat di sistem kami. Semoga donasi ini membawa keberkahan." : 
                 isPending ? "Silakan selesaikan pembayaran Anda sesuai dengan metode yang telah dipilih." : 
                 "Maaf, transaksi Anda tidak dapat diproses atau telah dibatalkan."}
              </p>
            </div>
            
            {/* Kotak Info Detail Transaksi dari Faspay */}
            {(trxId || billNo) && (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-left text-sm space-y-3 my-6">
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-gray-500 font-medium">No. Referensi</span>
                  <span className="font-bold text-[#1A1A1A]">{billNo || '-'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <span className="text-gray-500 font-medium">ID Transaksi</span>
                  <span className="font-bold text-[#1A1A1A]">{trxId || '-'}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-500 font-medium">Total Nominal</span>
                  <span className="font-black text-orange-600 text-base">{formatRupiah(amount)}</span>
                </div>
              </div>
            )}
            
            <div className="pt-2 flex flex-col gap-3">
              <Button 
                variant="gold" 
                className="w-full font-bold py-6 rounded-xl text-md shadow-lg shadow-orange-500/20"
                onClick={() => navigate('/kakasaku/dashboard')}
              >
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Cek Dashboard Saya
              </Button>
              <Button 
                variant="outline" 
                className="w-full font-bold py-6 rounded-xl text-md border-gray-200 text-gray-600 hover:bg-gray-50"
                onClick={() => navigate('/')}
              >
                <Home className="w-5 h-5 mr-2" />
                Kembali ke Beranda
              </Button>
            </div>

          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}