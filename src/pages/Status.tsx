import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Home, LayoutDashboard, Heart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Status() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header />
      
      <main className="flex-grow flex items-center justify-center p-4 py-12">
        <Card className="max-w-md w-full shadow-2xl border-t-8 border-t-green-500 rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-8 text-center space-y-6">
            
            {/* Ikon Sukses Animasi */}
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-50"></div>
              <div className="relative bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A]">Terima Kasih!</h1>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                Tindakan baik Anda telah tercatat di sistem kami. 
                Semoga donasi ini menjadi kebaikan yang terus mengalir dan membawa keberkahan.
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center justify-center gap-2 text-orange-600 font-semibold text-sm my-6">
              <Heart className="w-4 h-4 fill-orange-600" />
              <span>Jakarta Mengabdi sangat menghargai dukunganmu!</span>
            </div>
            
            <div className="pt-2 flex flex-col gap-3">
              <Button 
                variant="gold" 
                className="w-full font-bold py-6 rounded-xl text-md"
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