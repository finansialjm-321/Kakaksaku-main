import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Menu, X, LayoutDashboard, LogOut } from "lucide-react";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null); // State untuk simpan role
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname.includes("dashboard");

  // Efek untuk mengambil Role pengguna dari database profiles
  useEffect(() => {
    if (user) {
      const fetchRole = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        
        if (data) setUserRole(data.role);
      };
      fetchRole();
    } else {
      setUserRole(null);
    }
  }, [user]);

  const handleLogoutConfirm = async () => {
    await signOut();
    setLogoutDialogOpen(false);
    setMenuOpen(false);
    navigate("/");
  };

  // Logika Navigasi Dashboard Berdasarkan Role
  const goToDashboard = () => {
    if (userRole === "admin") {
      navigate("/admin/dashboard"); // Route khusus admin
    } else {
      navigate("/kakasaku/dashboard"); // Route khusus donatur
    }
    setMenuOpen(false);
  };

  const navLinks = [
    { label: "Beranda", href: "/" },
    { label: "Donasi", href: "/donasi" },
    { label: "Tentang", href: "/tentang" },
    { label: "Kakasaku", href: "/kakasaku" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Logo Jakarta Mengabdi" 
            className="w-10 h-10 object-contain" 
          />
          <span className="text-xl font-bold text-foreground tracking-tight">
            Jakarta <span className="text-gradient-gold">Mengabdi</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        {!isDashboard && (
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className={`text-sm font-semibold transition-colors hover:text-gold ${
                  location.pathname === l.href ? "text-gold" : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        {/* Action Area */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {/* TOMBOL DASHBOARD BARU (Ganti Tombol Profil) */}
              {!isDashboard && (
                <Button 
                  variant="gold" 
                  size="sm" 
                  className="font-bold shadow-md shadow-gold/10 flex items-center gap-2"
                  onClick={goToDashboard}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Ke Dashboard
                </Button>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="border-red-200 text-red-600 hover:bg-red-50 font-bold"
                onClick={() => setLogoutDialogOpen(true)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="font-bold" onClick={() => navigate("/login")}>
                Masuk
              </Button>
              <Button variant="gold" size="sm" className="font-bold" onClick={() => navigate("/register")}>
                Daftar
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6 text-gold" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-card/95 backdrop-blur-xl px-4 py-6 space-y-4 shadow-xl">
          {!isDashboard && navLinks.map((l) => (
            <Link key={l.href} to={l.href} className="block text-lg font-bold text-muted-foreground" onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          
          <div className="flex flex-col gap-3 pt-4 border-t">
            {user ? (
              <>
                <Button variant="gold" className="w-full font-bold" onClick={goToDashboard}>
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Ke Dashboard
                </Button>
                <Button variant="outline" className="w-full text-red-600 font-bold" onClick={() => setLogoutDialogOpen(true)}>
                  <LogOut className="w-4 h-4 mr-2" /> Keluar
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="w-full font-bold" onClick={() => navigate("/login")}>Masuk</Button>
                <Button variant="gold" className="w-full font-bold" onClick={() => navigate("/register")}>Daftar</Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Keluar */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogTitle className="font-bold">Konfirmasi Keluar</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah kamu yakin ingin keluar dari akun Kakaksaku?
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end mt-4">
            <AlertDialogCancel className="font-semibold">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm} className="bg-red-600 hover:bg-red-700 font-bold">
              Ya, Keluar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}