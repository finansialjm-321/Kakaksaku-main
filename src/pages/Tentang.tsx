import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Heart, Target, Eye, Users } from "lucide-react";

export default function Tentang() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-gradient-navy py-20">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl md:text-4xl font-extrabold text-primary-foreground mb-4">
                Tentang <span className="text-gradient-gold">Jakarta Mengabdi</span>
              </h1>
              <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
                Bersama membangun Jakarta yang lebih baik melalui aksi sosial dan kemanusiaan.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Siapa Kami */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Siapa Kami</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Jakarta Mengabdi adalah platform sosial dan kemanusiaan yang lahir dari semangat warga Jakarta untuk saling membantu.
                Kami menghubungkan para donatur dengan program-program sosial yang berdampak langsung bagi masyarakat yang membutuhkan di seluruh wilayah Jakarta.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Melalui teknologi dan transparansi, kami memastikan setiap rupiah yang Anda donasikan tersalurkan dengan tepat sasaran
                dan dapat dipertanggungjawabkan. Kami percaya bahwa perubahan besar dimulai dari aksi kecil yang dilakukan bersama-sama.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Visi & Misi */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                    <Eye className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Visi</h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Menjadi platform terdepan dalam menghubungkan kebaikan warga Jakarta, menciptakan ekosistem kepedulian sosial
                  yang berkelanjutan dan berdampak nyata bagi kehidupan masyarakat.
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Misi</h2>
                </div>
                <ul className="text-muted-foreground leading-relaxed space-y-2">
                  <li className="flex gap-2"><Heart className="w-4 h-4 text-primary mt-1 shrink-0" /> Menyalurkan donasi secara transparan dan akuntabel</li>
                  <li className="flex gap-2"><Heart className="w-4 h-4 text-primary mt-1 shrink-0" /> Mengembangkan program sosial yang berdampak langsung</li>
                  <li className="flex gap-2"><Heart className="w-4 h-4 text-primary mt-1 shrink-0" /> Memberdayakan komunitas lokal di seluruh Jakarta</li>
                  <li className="flex gap-2"><Heart className="w-4 h-4 text-primary mt-1 shrink-0" /> Mendorong budaya saling berbagi dan peduli sesama</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Fokus */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground text-center">Fokus Program Kami</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                {[
                  { title: "Pendidikan", desc: "Beasiswa dan bantuan pendidikan untuk anak-anak kurang mampu di Jakarta." },
                  { title: "Kesehatan", desc: "Program kesehatan dan bantuan medis untuk masyarakat prasejahtera." },
                  { title: "Kemanusiaan", desc: "Tanggap darurat dan bantuan bagi korban bencana serta musibah." },
                ].map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 rounded-xl bg-card shadow-card space-y-2"
                  >
                    <h3 className="font-bold text-foreground">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
