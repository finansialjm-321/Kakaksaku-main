import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react"; // Ikon untuk menutup perbesaran

const testimonialImages = [
  "/1.png",
  "/2.png",
  "/3.png",
  "/4.png",
  "/5.png",
];

export default function TestimonialsSection() {
  // State untuk menyimpan gambar yang sedang diperbesar
  const [selectedImg, setSelectedImg] = useState<string | null>(null);

  // Duplikasi array untuk looping
  const duplicatedImages = [...testimonialImages, ...testimonialImages];

  return (
    <section className="py-24 bg-gray-50/50 overflow-hidden relative">
      <div className="container mx-auto px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Cerita Kebaikan</p>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
            Kata <span className="text-gradient-gold">Mereka</span>
          </h2>
        </motion.div>
      </div>

      {/* Container Marquee */}
      <div className="relative w-full overflow-hidden">
        <motion.div
          className="flex gap-8 px-4 cursor-pointer"
          // Animasi berhenti (false) jika ada gambar yang dipilih
          animate={selectedImg ? false : { x: ["0%", "-50%"] }}
          transition={{
            duration: 35,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {duplicatedImages.map((src, index) => (
            <motion.div
              key={index}
              className="flex-shrink-0 w-[300px] md:w-[450px]"
              whileHover={{ scale: 1.05 }} // Efek angkat sedikit saat mouse di atas gambar
              onClick={() => setSelectedImg(src)} // Klik untuk perbesar
            >
              <img
                src={src}
                alt="Testimonial"
                className="w-full h-auto rounded-[2.5rem] shadow-xl border border-white/20"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* --- MODAL PERBESAR GAMBAR --- */}
      <AnimatePresence>
        {selectedImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-10"
            onClick={() => setSelectedImg(null)} // Klik di mana saja untuk menutup
          >
            {/* Tombol Close */}
            <button 
              className="absolute top-10 right-10 text-white hover:rotate-90 transition-transform duration-300"
              onClick={() => setSelectedImg(null)}
            >
              <X size={40} strokeWidth={3} />
            </button>

            <motion.img
              src={selectedImg}
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-w-full max-h-[85vh] rounded-[2.5rem] shadow-2xl border-4 border-white/10"
              onClick={(e) => e.stopPropagation()} // Cegah klik gambar ikut menutup modal
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}