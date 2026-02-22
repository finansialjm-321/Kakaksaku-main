import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  ShieldCheck, 
  HandHeart // Pastikan HandHeart diimport
} from "lucide-react";

export default function KakasakuLanding() {
  const navigate = useNavigate();

  // Variasi Animasi Fade In Up
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* 1. HERO SECTION: Bersih tanpa tombol */}
        <section className="relative pt-40 pb-32 px-4">
          {/* Background Glow Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gold/5 blur-[120px] rounded-full -z-10"></div>
          
          <div className="container mx-auto text-center max-w-4xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-10 border border-gold/20 shadow-sm">
                <Sparkles className="w-4 h-4" />
                Program Unggulan Jakarta Mengabdi
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[#1A1A1A] mb-8 leading-[1]">
                <span className="text-gold">Datang Dari Hati.</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium max-w-2xl mx-auto">
                Kakaksaku adalah program donasi rutin setiap bulan yang dirancang untuk memberikan kepastian masa depan bagi anak-anak di Jakarta.
              </p>

              {/* TOMBOL DI SINI SUDAH DIHAPUS */}
            </motion.div>
          </div>
        </section>

        {/* 2. WHY SECTION: Storytelling Cards dengan Ikon Lengkap */}
        <section className="py-24 bg-gold/5">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Kartu 1: Dukungan Berkelanjutan (Heart) */}
              <motion.div 
                variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-white p-10 rounded-[3rem] shadow-sm border border-gold/10"
              >
                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-6">
                  <Heart className="w-8 h-8 fill-current" />
                </div>
                <h3 className="text-2xl font-black mb-4">Dukungan Berkelanjutan</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Bukan sekadar bantuan sekali waktu, donasi rutin Anda memastikan biaya pendidikan terpenuhi setiap bulan.
                </p>
              </motion.div>

              {/* Kartu 2: Impact yang Nyata (HandHeart) */}
              <motion.div 
                variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-white p-10 rounded-[3rem] shadow-xl border border-gold/20 scale-105 z-10"
              >
                <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-gold/20">
                  <div className="text-black text-3xl">✨</div>
                </div>
                <h3 className="text-2xl font-black mb-4">Impact yang Nyata</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Setiap rupiah dialokasikan secara transparan untuk nutrisi, buku, dan seragam sekolah bagi anak marginal.
                </p>
              </motion.div>

              {/* Kartu 3: Laporan Real-Time (ShieldCheck) */}
              <motion.div 
                variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-white p-10 rounded-[3rem] shadow-sm border border-gold/10"
              >
                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black mb-4">Laporan Real-Time</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Pantau perkembangan adik asuh Anda secara transparan melalui Dashboard eksklusif kapan saja.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 3. STEP SECTION: Visual Timeline */}
        <section className="py-32 container mx-auto px-4 text-center">
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className="text-4xl font-black mb-16 italic">"Kebaikan kecil yang dilakukan rutin, akan berbuah dampak besar."</h2>
            
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center">
                <div className="text-5xl font-black text-gold/20 mb-4 tracking-tighter">01</div>
                <h4 className="font-bold text-lg">Daftar Akun</h4>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-5xl font-black text-gold/20 mb-4 tracking-tighter">02</div>
                <h4 className="font-bold text-lg">Pilih Paket</h4>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-5xl font-black text-gold/20 mb-4 tracking-tighter">03</div>
                <h4 className="font-bold text-lg">Berbagi Rutin</h4>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 4. FINAL CTA: Dark Themed Centered Button */}
        <section className="py-32 bg-[#1A1A1A] relative overflow-hidden">
          <div className="absolute inset-0 bg-gold/5 blur-[150px] -z-0"></div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              whileInView={{ opacity: 1, scale: 1 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight">
                Siap Menjadi Pahlawan <br />Bagi Mereka?
              </h2>
              <p className="text-white/60 text-xl mb-16 max-w-xl mx-auto leading-relaxed">
                Bergabunglah bersama ratusan Kakaksaku lainnya dan berikan harapan baru bagi Jakarta setiap bulannya.
              </p>

              {/* Satu-satunya Tombol Daftar, di tengah */}
              <div className="flex justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={() => navigate("/register")}
                    className="
                      bg-[#D4AF37] hover:bg-[#B8860B] 
                      text-white text-2xl font-black 
                      px-20 py-12 rounded-full 
                      shadow-[0_25px_60px_-15px_rgba(212,175,55,0.7)] 
                      transition-all flex items-center gap-6 
                      border-4 border-white/20
                    "
                  >
                    Daftar Kakak Saku
                    <ArrowRight className="w-10 h-10" />
                  </Button>
                </motion.div>
              </div>
              
              {/* Badge Footer Info */}
              <div className="mt-12 flex items-center justify-center gap-6 text-white/40">
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4 text-gold" /> Transparan
                </div>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4 text-gold" /> Mudah
                </div>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4 text-gold" /> Berdampak
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}