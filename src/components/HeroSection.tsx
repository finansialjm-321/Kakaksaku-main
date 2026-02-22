import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";
import heroBg from "@/assets/image.png";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroBg} alt="Komunitas Jakarta Mengabdi" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: "var(--hero-overlay)" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 mb-6"
          >
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary-foreground/90">Platform Donasi Terpercaya Jakarta</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-primary-foreground leading-tight mb-6">
            Bersama Kita <br />
            <span className="text-gradient-gold">Mengabdi untuk</span><br />
            Jakarta
          </h1>

          <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg">
            Bergabunglah dalam gerakan kebaikan untuk mewujudkan Jakarta yang lebih baik. Setiap donasi membawa perubahan nyata.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button variant="hero" size="lg" onClick={() => navigate("/donasi")}>
              <Heart className="w-5 h-5" /> Donasi Sekarang
            </Button>
            <Button variant="hero-outline" size="lg" onClick={() => navigate("/kakasaku")}>
              Kakasaku <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
