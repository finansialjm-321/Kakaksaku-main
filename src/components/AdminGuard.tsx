import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "@/pages/NotFound";
import { Loader2, ShieldCheck } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  // isAdmin: null (sedang cek), true (admin), false (bukan admin)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        // 1. Ambil data user yang sedang login
        // Menggunakan getUser() lebih aman daripada getSession() untuk verifikasi server
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.warn("AdminGuard: Tidak ada session aktif.");
          setIsAdmin(false);
          return;
        }

        // 2. Ambil role dari tabel profiles berdasarkan ID user
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("AdminGuard Error (Fetch Profile):", profileError.message);
          setIsAdmin(false);
          return;
        }

        // 3. Validasi ketat: Harus string 'admin'
        if (profile?.role === 'admin') {
          console.log("AdminGuard: Akses diberikan untuk Admin.");
          setIsAdmin(true);
        } else {
          console.log(`AdminGuard: Akses ditolak. Role Anda adalah '${profile?.role}'`);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("AdminGuard Critical Error:", err);
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, []);

  // --- TAMPILAN LOADING (Sangat penting agar tidak bocor) ---
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB]">
        <div className="relative mb-6">
          <div className="w-20 h-20 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
          <ShieldCheck className="absolute inset-0 m-auto text-orange-500 w-8 h-8" />
        </div>
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">
          Memverifikasi Otoritas
        </h2>
      </div>
    );
  }

  // --- JIKA BUKAN ADMIN (DONATUR / GUEST) -> LEMPAR KE 404 ---
  if (!isAdmin) {
    return <NotFound />;
  }

  // --- JIKA LOLOS VALIDASI -> TAMPILKAN KONTEN ADMIN ---
  return <>{children}</>;
}