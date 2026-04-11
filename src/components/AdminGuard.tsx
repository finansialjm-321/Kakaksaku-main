import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      try {
        // 1. Ambil data user yang sedang login dari session
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.log("Peringatan: Tidak ada session user ditemukan.");
          setIsAdmin(false);
          return;
        }

        // 2. Cek database tabel 'profiles' untuk memastikan role-nya
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Error mengambil profil:", profileError.message);
          setIsAdmin(false);
          return;
        }

        // 3. Validasi Role (Hanya string 'admin' yang lolos)
        if (profile?.role === 'admin') {
          console.log("Akses Diterima: User adalah Admin.");
          setIsAdmin(true);
        } else {
          // Jika role adalah 'donatur' atau lainnya, lempar ke 404
          console.log(`Akses Ditolak: Role '${profile?.role}' tidak diizinkan di sini.`);
          setIsAdmin(false);
        }

      } catch (err) {
        console.error("Security Guard Error:", err);
        setIsAdmin(false);
      }
    };

    checkRole();
  }, []);

  // Tampilan Loading saat proses verifikasi database
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFCFB]">
        <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
          Memverifikasi Otoritas...
        </p>
      </div>
    );
  }

  // JIKA BUKAN ADMIN (ROLE DONATUR / TIDAK LOGIN) -> TAMPILKAN 404
  if (!isAdmin) {
    return <NotFound />;
  }

  // JIKA ADMIN -> TAMPILKAN HALAMAN ADMIN
  return <>{children}</>;
}