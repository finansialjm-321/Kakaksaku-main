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
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname.includes("dashboard");

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

  const goToDashboard = () => {
    if (userRole === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/kakasaku/dashboard");
    }
    setMenuOpen(false);
  };

  const navLinks = [
    { label: "Beranda", href: "/" },
    { label: "Tentang", href: "/tentang" },
    { label: "Donasi", href: "/donasi" },
    { label: "Kakasaku", href: "/kakasaku" },
  ];

  // PERUBAHAN: Background diganti ke warna coklat dari gambar (#413224)
  return (
    <header className="sticky top-0 z-50 bg-[#413224] border-b border-[#5a4632]">
      <div className="container mx-auto flex items-center justify-between h-20 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/logo.png" 
            alt="Logo Jakarta Mengabdi" 
            className="w-10 h-10 object-contain" 
          />
          {/* PERUBAHAN: Teks logo diubah jadi putih agar terbaca */}
          <span className="text-xl font-bold text-white tracking-tight">
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
                className={`text-sm font-semibold transition-colors hover:text-orange-300 ${
                  location.pathname === l.href ? "text-orange-400" : "text-gray-200"
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
                className="border-red-400 bg-transparent text-red-400 hover:bg-red-500 hover:text-white font-bold transition-colors"
                onClick={() => setLogoutDialogOpen(true)}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          ) : (
            <>
              {/* PERUBAHAN: Teks Masuk diubah jadi putih */}
              <Button variant="ghost" size="sm" className="font-bold text-white hover:bg-white/10" onClick={() => navigate("/login")}>
                Masuk
              </Button>
              <Button variant="gold" size="sm" className="font-bold" onClick={() => navigate("/register")}>
                Daftar
              </Button>
            </>
          )}
        </div>

        {/* PERUBAHAN: Ikon hamburger menu mobile jadi putih */}
        <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6 text-gold" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#5a4632] bg-[#413224] px-4 py-6 space-y-4 shadow-xl">
          {!isDashboard && navLinks.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className={`block text-lg font-bold transition-colors ${
                location.pathname === l.href ? "text-orange-400" : "text-gray-200"
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          
          <div className="flex flex-col gap-3 pt-4 border-t border-[#5a4632]">
            {user ? (
              <>
                <Button variant="gold" className="w-full font-bold" onClick={goToDashboard}>
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Ke Dashboard
                </Button>
                <Button variant="outline" className="w-full bg-transparent border-red-400 text-red-400 font-bold hover:bg-red-500 hover:text-white transition-colors" onClick={() => setLogoutDialogOpen(true)}>
                  <LogOut className="w-4 h-4 mr-2" /> Keluar
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="w-full font-bold text-white hover:bg-white/10" onClick={() => navigate("/login")}>Masuk</Button>
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
            <AlertDialogAction onClick={handleLogoutConfirm} className="bg-red-600 hover:bg-red-700 font-bold text-white">
              Ya, Keluar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}