import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Home, SearchX, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log error tetap dipertahankan untuk kebutuhan debug admin
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Ilustrasi Visual */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto w-48 h-48 flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-orange-100 rounded-[4rem] rotate-12 animate-pulse" />
          <div className="relative bg-white w-full h-full rounded-[4rem] shadow-2xl border border-orange-50 flex flex-col items-center justify-center text-orange-500">
            <span className="text-6xl font-black mb-2 leading-none">404</span>
            <SearchX size={48} strokeWidth={2.5} />
          </div>
        </motion.div>

        {/* Pesan Kesalahan */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-black text-[#1A1A1A] tracking-tight">
            Halaman Tidak <span className="text-orange-500">Ditemukan</span>
          </h1>
          <p className="text-gray-500 font-medium leading-relaxed px-4">
            Maaf, halaman yang Anda cari tidak ada atau akses dibatasi. Mari kembali ke jalan kebaikan.
          </p>
        </div>

        {/* Tombol Navigasi */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3 pt-4"
        >
          <Button 
            asChild
            className="h-16 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg shadow-xl shadow-orange-200 transition-all active:scale-95"
          >
            <Link to="/">
              <Home className="w-5 h-5 mr-2" /> Kembali ke Beranda
            </Link>
          </Button>

          <Button 
            asChild
            variant="ghost"
            className="h-14 rounded-2xl font-bold text-gray-400 hover:text-orange-500 hover:bg-orange-50"
          >
            <Link to={-1 as any}> {/* Kembali ke halaman sebelumnya */}
              <ArrowLeft className="w-4 h-4 mr-2" /> Halaman Sebelumnya
            </Link>
          </Button>
        </motion.div>

        {/* Teks ID Halaman untuk Debugging (Tipis & Transparan) */}
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em] pt-10">
          Path: {location.pathname}
        </p>
      </div>
    </div>
  );
};

export default NotFound;