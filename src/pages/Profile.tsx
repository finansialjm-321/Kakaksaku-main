import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { User, Package, History, Settings, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

interface Subscription {
  id: string;
  package_id: string;
  is_active: boolean;
  payment_status: string;
  created_at: string;
}

interface KakasakuPkg {
  id: string;
  name: string;
  amount: number;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function Profile() {
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; created_at: string } | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [packages, setPackages] = useState<KakasakuPkg[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, created_at").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setProfile(data);
    });
    supabase.from("kakasaku_subscriptions").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) setSubscriptions(data as Subscription[]);
    });
    supabase.from("kakasaku_packages").select("id, name, amount").then(({ data }) => {
      if (data) setPackages(data as KakasakuPkg[]);
    });
  }, [user]);

  if (loading || !user) return null;

  const activeSub = subscriptions.find(s => s.is_active || s.payment_status === "completed");
  const activePkg = activeSub ? packages.find(p => p.id === activeSub.package_id) : null;
  const totalContribution = subscriptions
    .filter(s => s.payment_status === "completed")
    .reduce((sum, s) => {
      const pkg = packages.find(p => p.id === s.package_id);
      return sum + (pkg?.amount || 0);
    }, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold text-foreground"
        >
          Profil Saya
        </motion.h1>

        {/* User Data */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <CardTitle>Data Pengguna</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Nama</p>
                  <p className="font-semibold text-foreground">{profile?.full_name || user.user_metadata?.full_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-semibold text-foreground">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bergabung Sejak</p>
                  <p className="font-semibold text-foreground">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }) : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paket Kakasaku Aktif</p>
                  {activePkg ? (
                    <Badge className="bg-gradient-gold text-primary-foreground">{activePkg.name}</Badge>
                  ) : (
                    <p className="text-sm text-muted-foreground">Belum berlangganan</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Kakasaku Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                <Package className="w-5 h-5 text-primary-foreground" />
              </div>
              <CardTitle>Statistik Kakasaku</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-2xl font-extrabold text-primary">{subscriptions.length}</p>
                  <p className="text-xs text-muted-foreground">Total Paket</p>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-2xl font-extrabold text-primary">{activePkg?.name || "-"}</p>
                  <p className="text-xs text-muted-foreground">Paket Aktif</p>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <p className="text-2xl font-extrabold text-primary">{formatRupiah(totalContribution)}</p>
                  <p className="text-xs text-muted-foreground">Total Kontribusi</p>
                </div>
              </div>

              {subscriptions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Riwayat Langganan</p>
                  </div>
                  <ul className="space-y-2">
                    {subscriptions.map(sub => {
                      const pkg = packages.find(p => p.id === sub.package_id);
                      return (
                        <li key={sub.id} className="flex items-center justify-between bg-muted rounded-lg px-4 py-2 text-sm">
                          <span className="text-foreground font-medium">{pkg?.name || "Unknown"}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">
                              {new Date(sub.created_at).toLocaleDateString("id-ID")}
                            </span>
                            <Badge variant={sub.payment_status === "completed" ? "default" : "secondary"} className="text-xs">
                              {sub.payment_status}
                            </Badge>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary-foreground" />
              </div>
              <CardTitle>Pengaturan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                  <Label htmlFor="dark-mode" className="text-foreground font-medium">Mode Gelap</Label>
                </div>
                <Switch id="dark-mode" checked={theme === "dark"} onCheckedChange={toggleTheme} />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
