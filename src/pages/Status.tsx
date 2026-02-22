import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Home, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

export default function Status() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [donorName, setDonorName] = useState("");
  const navigate = useNavigate();

  const billNo = searchParams.get("bill_no");

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!billNo) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("donations")
        .select("payment_status, donor_name")
        .eq("bill_no", billNo)
        .single();

      if (data) {
        setStatus(data.payment_status);
        setDonorName(data.donor_name);
      }
      setLoading(false);
    };

    checkPaymentStatus();
  }, [billNo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="font-medium">Memverifikasi Kontribusi Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <Card className="shadow-2xl border-none bg-card overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-gold via-yellow-500 to-gold" />
            <CardContent className="p-8 text-center">
              {status === 'paid' ? (
                <>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-foreground mb-4">Terima Kasih, {donorName}!</h1>
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    Donasi Anda telah kami terima dengan selamat. Setiap rupiah yang Anda berikan sangat berarti bagi keberlangsungan program di <strong>Jakarta Mengabdi</strong>.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Heart className="w-10 h-10 text-gold animate-pulse" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-4">Menunggu Konfirmasi</h1>
                  <p className="text-muted-foreground mb-8">
                    Kami sedang menunggu laporan resmi dari sistem pembayaran. Jangan khawatir, status Anda akan segera diperbarui.
                  </p>
                </>
              )}

              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={() => navigate("/")} 
                  variant="gold" 
                  size="lg" 
                  className="w-full font-bold group"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Kembali ke Beranda
                  <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-all" />
                </Button>
                <Button 
                  onClick={() => navigate("/donasi")} 
                  variant="outline" 
                  className="w-full"
                >
                  Lihat Program Lainnya
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <p className="mt-8 text-sm text-center text-muted-foreground italic">
            "Kebaikan kecil Anda adalah napas baru bagi mereka yang membutuhkan."
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}