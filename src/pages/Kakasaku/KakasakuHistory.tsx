import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, CheckCircle2, Clock, 
  XCircle, ReceiptText, Sparkles
} from "lucide-react";

export default function KakasakuHistory() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Ambil data riwayat pembayaran user, urutkan dari yang terbaru
      const { data, error } = await supabase
        .from('kakasaku_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPayments(data);
      }
      setLoading(false);
    };

    fetchHistory();
  }, [navigate]);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { 
      style: "currency", 
      currency: "IDR", 
      minimumFractionDigits: 0 
    }).format(angka);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // Komponen untuk merender badge status dengan warna yang sesuai
  const StatusBadge = ({ status }: { status: string }) => {
    const s = status?.toLowerCase();
    
    if (s === 'settled' || s === 'success' || s === 'paid') {
      return (
        <div className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
          <CheckCircle2 className="w-3 h-3" /> Sukses
        </div>
      );
    }
    
    if (s === 'pending') {
      return (
        <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-100">
          <Clock className="w-3 h-3" /> Pending
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100">
        <XCircle className="w-3 h-3" /> Gagal
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-orange-500 font-bold bg-[#FDFCFB]">
        <Sparkles className="w-8 h-8 animate-pulse mb-4" /> Memuat Riwayat...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto max-w-2xl pt-8 md:pt-12 pb-20 px-4 sm:px-6 space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/kakasaku/dashboard')} 
            className="rounded-full w-12 h-12 p-0 bg-white shadow-sm border border-gray-100 shrink-0 hover:bg-orange-50 hover:text-orange-500"
          >
            <ArrowLeft className="h-5 w-5 text-[#1A1A1A]" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-[#1A1A1A]">Riwayat Pembayaran</h1>
            <p className="text-muted-foreground text-sm">Cek status dan histori tagihanmu di sini.</p>
          </div>
        </div>

        {/* LIST TRANSAKSI */}
        <div className="space-y-4">
          {payments.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center">
              <div className="bg-gray-50 p-4 rounded-full mb-4">
                <ReceiptText className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">Belum Ada Transaksi</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Kamu belum pernah melakukan pembayaran tagihan Kakak Saku.
              </p>
            </div>
          ) : (
            payments.map((trx) => (
              <div 
                key={trx.id} 
                className="bg-white p-5 md:p-6 rounded-[1.5rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-orange-200"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {formatDate(trx.created_at)}
                    </p>
                    <div className="sm:hidden">
                      <StatusBadge status={trx.status} />
                    </div>
                  </div>
                  
                  {/* bill_reff menampilkan informasi bulan yang dibayar (misal: "Bayar 2 bulan (1-2026, 2-2026)") */}
                  <h3 className="text-sm md:text-base font-black text-[#1A1A1A] leading-tight">
                    {trx.bill_reff || 'Pembayaran Tagihan Kakak Saku'}
                  </h3>
                  
                  <p className="text-xs text-gray-400 font-mono">ID: {trx.bill_no}</p>
                </div>

                <div className="flex items-end sm:items-center justify-between sm:flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-50">
                  <p className="text-lg font-black text-orange-500">
                    {formatRupiah(trx.amount)}
                  </p>
                  <div className="hidden sm:block">
                    <StatusBadge status={trx.status} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </main>
    </div>
  );
}