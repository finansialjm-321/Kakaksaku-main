import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Siti Rahayu",
    role: "Donatur Tetap",
    text: "Jakarta Mengabdi membuat proses donasi sangat mudah dan transparan. Saya bisa melihat langsung dampak dari setiap kontribusi.",
  },
  {
    name: "Ahmad Fauzi",
    role: "Relawan",
    text: "Sebagai relawan, saya bangga menjadi bagian dari gerakan ini. Program-programnya sangat tepat sasaran dan dikelola dengan baik.",
  },
  {
    name: "Maria Dewi",
    role: "Donatur Kakasaku",
    text: "Dengan Kakasaku, saya bisa berkontribusi secara rutin tanpa repot. Laporan bulanannya sangat detail dan memuaskan.",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">Kata <span className="text-gradient-gold">Mereka</span></h2>
          <p className="text-muted-foreground">Cerita dari para donatur dan relawan kami</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <Card className="shadow-card h-full">
                <CardContent className="p-6 space-y-4">
                  <Quote className="w-8 h-8 text-primary/30" />
                  <p className="text-foreground/80 italic">&ldquo;{t.text}&rdquo;</p>
                  <div>
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
