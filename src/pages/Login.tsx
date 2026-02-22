import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // FIXED: Mengambil dari komponen lokal, bukan radix-ui langsung
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react"; // DITAMBAHKAN: ArrowLeft

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Proses Autentikasi Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // 2. Ambil data Role dari tabel profiles untuk menentukan tujuan dashboard
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        toast.success("Berhasil masuk!");
        
        // 3. Pengalihan cerdas sesuai folder baru yang kamu buat
        if (profile.role === 'admin') {
          navigate("/admin/dashboard");
        } else {
          navigate("/kakasaku/dashboard");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Email atau password salah. Silakan cek kembali.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] px-4">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gold/5 border border-gold/5 relative">
        
        <div className="absolute top-8 left-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali Ke Beranda
          </Link>
        </div>

        <div className="text-center pt-6">
          <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A]">Masuk Kakak Saku</h1>
          <p className="text-muted-foreground mt-2">Lanjutkan aksi kebaikan Anda hari ini</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="nama@email.com" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl py-6"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <button type="button" className="text-xs text-gold font-bold hover:underline">Lupa Password?</button>
            </div>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-xl py-6 pr-12"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gold hover:bg-[#B8860B] text-black font-bold py-7 rounded-2xl shadow-lg shadow-gold/20 transition-all hover:scale-[1.02]"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : "Masuk Sekarang"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Belum menjadi Kakak Saku?{" "}
          <Link to="/register" className="text-gold font-black hover:underline">Daftar Sekarang</Link>
        </p>
      </div>
    </div>
  );
}