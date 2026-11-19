import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import ProgramsSection from "@/components/ProgramsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Donasi & Program Sosial Jakarta — Jakarta Mengabdi"
        description="Salurkan donasi untuk program sosial di Jakarta bersama Jakarta Mengabdi. Transparan, terverifikasi, dan berdampak nyata bagi warga."
        canonical="/"
      />
      <Header />
      <main>
        <HeroSection />
        <ProgramsSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
