import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Heart } from "lucide-react";

interface Program {
  id: string;
  title: string;
  description: string | null;
  target_amount: number;
  image_url: string | null;
}

interface ProgramWithStats extends Program {
  collected_amount: number;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function Donasi() {
  const [programs, setPrograms] = useState<ProgramWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      // PERBAIKAN: Gunakan View program_totals yang sudah diizinkan untuk publik
      // dan filter hanya program yang is_active = true
      const [programsRes, totalsRes] = await Promise.all([
        supabase
          .from("donation_programs")
          .select("id, title, description, target_amount, image_url")
          .eq("is_active", true)
          .order("created_at", { ascending: false }),
        
        supabase
          .from("program_totals")
          .select("program_id, total_collected"),
      ]);

      if (programsRes.error) {
        setError(true);
        return;
      }

      // Cocokkan total uang terkumpul dari View
      const totals: Record<string, number> = {};
      if (!totalsRes.error && totalsRes.data) {
        totalsRes.data.forEach((d) => {
          if (d.program_id) {
            totals[d.program_id] = Number(d.total_collected) || 0;
          }
        });
      }

      setPrograms(
        (programsRes.data || []).map((p) => ({
          ...p,
          collected_amount: totals[p.id] || 0,
        }))
      );
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // REAL-TIME ENGINE: Dengarkan perubahan di transaksi maupun editan Admin
    const channel = supabase
      .channel("donasi-page-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "donations" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "donation_programs" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
            Program <span className="text-gradient-gold">Donasi</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Pilih program yang ingin Anda dukung dan berikan kontribusi terbaik Anda untuk Jakarta.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border border-gray-100 rounded-3xl">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <p className="text-center text-muted-foreground py-12">Data sedang tidak tersedia.</p>
        ) : programs.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">Belum ada program donasi yang aktif.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((p, i) => {
                const target = p.target_amount || 1;
                const pct = Math.min(100, (p.collected_amount / target) * 100);
                
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card 
                      className="shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group cursor-pointer h-full flex flex-col border border-gray-100 rounded-3xl"
                      onClick={() => navigate(`/donate?program=${p.id}`)}
                    >
                      <div className="h-48 bg-gray-100 flex items-center justify-center overflow-hidden relative">
                        {p.image_url ? (
                          <img 
                            src={p.image_url} 
                            alt={p.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                          />
                        ) : (
                          <Heart className="w-14 h-14 text-gray-300 opacity-50 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                      <CardContent className="p-6 flex flex-col flex-grow space-y-4">
                        <div className="flex-grow">
                          <h2 className="font-bold text-xl text-foreground mb-2 line-clamp-1">{p.title}</h2>
                          <p className="text-sm text-muted-foreground line-clamp-2">{p.description || "Program donasi Jakarta Mengabdi"}</p>
                        </div>
                        
                        <div className="pt-2">
                          <div className="flex justify-between text-sm mb-2 items-end">
                            <span className="font-black text-orange-500 text-lg">{formatRupiah(p.collected_amount)}</span>
                            <span className="text-muted-foreground font-bold text-xs">{pct.toFixed(1)}%</span>
                          </div>
                          
                          {/* PERBAIKAN: Menggunakan custom progress bar warna orange */}
                          <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden mb-2 relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: `${pct}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : 'bg-orange-500'}`} 
                            />
                          </div>
                          
                          <p className="text-xs text-muted-foreground font-medium">Target: {formatRupiah(p.target_amount)}</p>
                        </div>
                        
                        <Button
                          variant="gold"
                          className="w-full mt-2 font-bold hover:scale-[1.02] transition-transform py-6 rounded-xl flex items-center justify-center gap-2"
                          onClick={(e) => { e.stopPropagation(); navigate(`/donate?program=${p.id}`); }}
                        >
                          <Heart className="w-4 h-4" /> Donasi Sekarang
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
            
            <p className="text-center text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-12 flex items-center justify-center gap-2">
              <span className="w-2 h-2 block bg-green-500 rounded-full animate-pulse" />
              Data diperbarui otomatis secara Real-Time
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}