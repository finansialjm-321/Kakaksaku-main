import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Image as ImageIcon, Camera, 
  X, Maximize2, Download ,Heart
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProgramGallery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // State untuk Lightbox (Gambar terpilih)
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("donation_programs")
        .select("title, gallery_1, gallery_2, gallery_3, gallery_4, gallery_5")
        .eq("id", id)
        .single();
      
      setProgram(data);
      setLoading(false);
    };
    if (id) fetchGallery();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-black text-orange-500 bg-[#FDFCFB]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="uppercase tracking-[0.2em] text-xs">Memuat Galeri...</p>
      </div>
    </div>
  );

  const images = [
    program?.gallery_1, program?.gallery_2, program?.gallery_3, 
    program?.gallery_4, program?.gallery_5
  ].filter(url => url && url.trim() !== "");

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1A1A1A]">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Header Navigasi */}
        <div className="mb-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/program/${id}`)}
              className="rounded-full w-14 h-14 p-0 bg-white shadow-xl border border-gray-100 hover:bg-orange-50 hover:text-orange-500 transition-all active:scale-90"
            >
              <ArrowLeft size={24} />
            </Button>
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">{program?.title}</h1>
              <div className="flex items-center gap-2 mt-3">
                <div className="px-3 py-1 bg-orange-100 rounded-lg text-orange-600">
                  <Camera size={14} className="inline mr-1" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Dokumentasi Lapangan</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid Gambar Gaya Masonry */}
        {images.length === 0 ? (
          <div className="bg-white p-20 rounded-[3.5rem] text-center border-2 border-dashed border-gray-200">
             <ImageIcon size={64} className="mx-auto text-gray-200 mb-4" />
             <p className="text-gray-400 font-bold italic text-lg">Belum ada foto dokumentasi yang tersedia.</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {images.map((img, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setSelectedImg(img)} // KLIK UNTUK MEMPERBESAR
                className="relative group cursor-zoom-in overflow-hidden rounded-[2.5rem] border-8 border-white shadow-lg hover:shadow-2xl transition-all duration-500"
              >
                <img 
                  src={img} 
                  alt={`Dokumentasi ${idx + 1}`}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Overlay saat hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white border border-white/30">
                    <Maximize2 size={24} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Action Button Bawah */}
        <div className="mt-24 text-center">
            <Button 
                onClick={() => navigate(`/donate?program=${id}`)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-black text-xl rounded-[2rem] px-12 py-8 h-auto shadow-2xl shadow-orange-200 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-4 mx-auto"
            >
                <Heart className="fill-white" /> Donasi Sekarang
            </Button>
        </div>
      </main>

      {/* --- LIGHTBOX MODAL --- */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-12"
            onClick={() => setSelectedImg(null)}
          >
            {/* Tombol Close */}
            <button 
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-4 rounded-full bg-white/5 hover:bg-white/10"
              onClick={() => setSelectedImg(null)}
            >
              <X size={32} />
            </button>

            {/* Gambar Full Screen */}
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-6xl w-full h-full flex items-center justify-center"
            >
              <img 
                src={selectedImg} 
                className="max-w-full max-h-full object-contain shadow-2xl rounded-2xl border-4 border-white/10" 
                alt="Fullscreen Preview" 
              />
            </motion.div>

            <p className="absolute bottom-10 text-white/40 font-bold uppercase tracking-[0.4em] text-[10px]">
              Klik di mana saja untuk kembali
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}