import { motion } from "framer-motion";
import { Users, Heart, Target, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

function formatRupiah(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}K`;
  return `Rp ${value}`;
}

async function fetchStats() {
  const [donationsRes, programsRes] = await Promise.all([
    supabase
      .from("donations")
      .select("amount, donor_name")
      .eq("payment_status", "paid"),
    supabase
      .from("donation_programs")
      .select("target_amount, collected_amount")
      .eq("is_active", true),
  ]);

  if (donationsRes.error) throw donationsRes.error;
  if (programsRes.error) throw programsRes.error;

  const donations = donationsRes.data ?? [];
  const programs = programsRes.data ?? [];

  const totalCollected = donations.reduce((sum, d) => sum + d.amount, 0);
  const uniqueDonors = new Set(donations.map((d) => d.donor_name)).size;
  const activePrograms = programs.length;
  const totalTarget = programs.reduce((sum, p) => sum + p.target_amount, 0);
  const totalDistributed = programs.reduce((sum, p) => sum + p.collected_amount, 0);
  const percentDistributed = totalCollected > 0
    ? Math.round((totalDistributed / totalCollected) * 100)
    : 0;

  return { totalCollected, uniqueDonors, activePrograms, percentDistributed };
}

const iconMap = [
  { icon: Heart, color: "text-primary" },
  { icon: Users, color: "text-accent" },
  { icon: Target, color: "text-secondary" },
  { icon: TrendingUp, color: "text-primary" },
];

export default function StatsSection() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["homepage-stats"],
    queryFn: fetchStats,
    staleTime: 60_000,
  });

  const stats = data
    ? [
        { value: formatRupiah(data.totalCollected), label: "Total Donasi Terkumpul" },
        { value: data.uniqueDonors.toLocaleString("id-ID"), label: "Donatur Aktif" },
        { value: `${data.activePrograms}`, label: "Program Berjalan" },
        { value: `${data.percentDistributed}%`, label: "Dana Tersalurkan" },
      ]
    : [];

  return (
    <section className="py-16 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="text-center p-6 space-y-3">
                  <Skeleton className="w-12 h-12 rounded-xl mx-auto" />
                  <Skeleton className="h-8 w-24 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              ))
            : isError
              ? Array.from({ length: 4 }).map((_, i) => {
                  const { icon: Icon, color } = iconMap[i];
                  return (
                    <div key={i} className="text-center p-6">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-3 ${color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-2xl md:text-3xl font-extrabold text-foreground">-</div>
                      <div className="text-sm text-muted-foreground mt-1">Data tidak tersedia</div>
                    </div>
                  );
                })
              : stats.map((stat, i) => {
                  const { icon: Icon, color } = iconMap[i];
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="text-center p-6"
                    >
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-3 ${color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="text-2xl md:text-3xl font-extrabold text-foreground">{stat.value}</div>
                      <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </motion.div>
                  );
                })}
        </div>
        {!isLoading && !isError && (
          <p className="text-center text-xs text-muted-foreground mt-6">
            Data diperbarui secara otomatis berdasarkan transaksi terbaru.
          </p>
        )}
      </div>
    </section>
  );
}
