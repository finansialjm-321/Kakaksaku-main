import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Heart, ArrowRight } from "lucide-react"; // Tambah ArrowRight untuk pemanis tombol

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
    <div className="min-h-screen bg-background text-[#1A1A1A]">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
            Program <span className="text-orange-500">Donasi</span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto font-medium">
            Pilih program yang ingin Anda dukung dan berikan kontribusi terbaik Anda untuk Jakarta.
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border border-gray-100 rounded-[2rem]">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {programs.map((p, i) => {
                const target = p.target_amount || 1;
                const actualPct = (p.collected_amount / target) * 100;
                
                // Logika agar visual bar tetap muncul meski donasi kecil (Rp 100)
                const displayPct = p.collected_amount > 0 ? Math.max(0.1, actualPct) : 0;
                const barPct = p.collected_amount > 0 ? Math.max(2, Math.min(100, actualPct)) : 0;
                
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card 
                      className="shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer h-full flex flex-col border border-gray-100 rounded-[2.5rem] bg-white"
                      // REVISI: Klik Card sekarang masuk ke Detail Deskripsi
                      onClick={() => navigate(`/program/${p.id}`)}
                    >
                      <div className="h-56 bg-gray-100 overflow-hidden relative">
                        {p.image_url ? (
                          <img 
                            src={p.image_url} 
                            alt={p.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-orange-50">
                            <Heart className="w-16 h-16 text-orange-200 fill-orange-100" />
                          </div>
                        )}
                      </div>
                      
                      <CardContent className="p-8 flex flex-col flex-grow space-y-6">
                        <div className="flex-grow">
                          <h2 className="font-black text-2xl text-gray-900 mb-3 line-clamp-1 group-hover:text-orange-600 transition-colors">{p.title}</h2>
                          <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed">{p.description || "Mari bergotong-royong membantu sesama melalui Jakarta Mengabdi."}</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Terkumpul</span>
                              <span className="font-black text-orange-500 text-xl">{formatRupiah(p.collected_amount)}</span>
                            </div>
                            <span className="text-gray-900 font-black text-sm bg-gray-100 px-3 py-1 rounded-full">
                              {displayPct < 0.1 && p.collected_amount > 0 ? "< 0.1" : displayPct.toFixed(1)}%
                            </span>
                          </div>
                          
                          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden relative shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              whileInView={{ width: `${barPct}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.5, ease: "circOut" }}
                              className={`h-full rounded-full shadow-lg ${actualPct >= 100 ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-orange-600'}`} 
                            />
                          </div>
                          
                          <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                            <span>Target: {formatRupiah(p.target_amount)}</span>
                          </div>
                        </div>
                        
                        {/* REVISI: Tombol sekarang masuk ke Detail Deskripsi */}
                        <Button
                          className="w-full h-16 text-lg font-black rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            navigate(`/program/${p.id}`); 
                          }}
                        >
                          Lihat Detail <ArrowRight className="w-5 h-5" />
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