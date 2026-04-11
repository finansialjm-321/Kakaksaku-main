import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // 1. Cek apakah ada user yang login
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // 2. Cek role di tabel profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  // Tampilan saat sedang loading mengecek database
  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  // JIKA BUKAN ADMIN, TAMPILKAN 404 (Halaman Tidak Ditemukan)
  if (!isAdmin) {
    return <NotFound />;
  }

  // JIKA ADMIN, IZINKAN MASUK
  return <>{children}</>;
}