import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, ArrowLeft, Eye, EyeOff, Phone, Mail, 
  User, Info, Calendar, Briefcase, Users, Lock 
} from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [kesibukan, setKesibukan] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // LOGIKA ON/OFF PENDAFTARAN
  const [isRegOpen, setIsRegOpen] = useState<boolean | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cek Status Pendaftaran dari Database
  useEffect(() => {
    const checkStatus = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value_bool')
        .eq('key', 'kakaksaku_reg_open')
        .single();
      
      // Default ke true jika data tidak ditemukan
      setIsRegOpen(data?.value_bool ?? true);
    };
    checkStatus();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jenisKelamin) {
      toast({ title: "Validasi Gagal", description: "Pilih Jenis Kelamin terlebih dahulu.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name } }
      });

      if (authError) throw authError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([
            {
              id: data.user.id, 
              nama_lengkap: name, 
              no_wa: phone, 
              email: email.trim(),
              tanggal_lahir: tanggalLahir || null,
              jenis_kelamin: jenisKelamin, 
              kesibukan: kesibukan,
              role: 'donatur' 
            }
          ], { onConflict: 'id' });

        if (profileError) {
          console.error("Detail Error Profil:", profileError);
          throw new Error(`Gagal menyimpan data profil: ${profileError.message}`);
        }

        await supabase.auth.signOut();
        
        toast({ title: "Berhasil!", description: "Akun Kakaksaku telah siap. Silakan Login." });
        navigate("/login"); 
      }
    } catch (error: any) {
      console.error("Register Error:", error);
      toast({ 
        title: "Gagal Mendaftar", 
        description: error.message || "Terjadi kesalahan saat pendaftaran.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // 1. TAMPILAN LOADING SAAT CEK STATUS
  if (isRegOpen === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30 p-4">
        <Loader2 className="w-10 h-10 animate-spin text-gold mb-4" />
        <p className="font-black text-xs uppercase tracking-[0.3em] text-muted-foreground">Mengecek Status...</p>
      </div>
    );
  }

  // 2. TAMPILAN JIKA PENDAFTARAN DITUTUP (OFF)
  if (!isRegOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-red-100 rounded-[2rem] rotate-12 animate-pulse" />
            <div className="relative bg-white w-full h-full rounded-[2rem] border border-red-50 shadow-2xl flex items-center justify-center text-red-500">
              <Lock size={40} />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-black text-[#1A1A1A]">Pendaftaran <span className="text-red-500">Ditutup</span></h1>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Mohon maaf, saat ini pendaftaran Kakak Saku sedang ditutup sementara oleh Admin. Silakan kembali lagi nanti atau hubungi kami untuk informasi lebih lanjut.
            </p>
          </div>

          <Button 
            onClick={() => navigate("/")} 
            className="w-full h-16 rounded-2xl bg-[#1A1A1A] hover:bg-zinc-800 font-black text-lg shadow-xl flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} /> Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  // 3. TAMPILAN JIKA DIBUKA (FORM ASLI TIDAK BERUBAH)
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 relative py-12">
      <Button variant="ghost" className="absolute top-4 left-4" onClick={() => navigate("/")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Beranda
      </Button>

      <div className="max-w-xl w-full space-y-6">
        <Card className="shadow-2xl border-t-4 border-t-gold">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-3xl font-bold font-heading">Daftar Kakak Saku</CardTitle>
            <p className="text-muted-foreground mt-2">Langkah kecil Anda, perubahan besar bagi Jakarta</p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleRegister} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <div className="relative">
                      <Input id="name" placeholder="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" required />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Input id="email" type="email" placeholder="email@contoh.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor WhatsApp</Label>
                    <div className="relative">
                      <Input id="phone" type="tel" placeholder="0812xxxxxxxx" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" required />
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                    <div className="relative">
                      <Input id="tanggalLahir" type="date" value={tanggalLahir} onChange={(e) => setTanggalLahir(e.target.value)} className="pl-10" required />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Jenis Kelamin</Label>
                    <Select value={jenisKelamin} onValueChange={setJenisKelamin} required>
                      <SelectTrigger className="w-full pl-10 relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="Pilih Jenis Kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                        <SelectItem value="Perempuan">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kesibukan">Kesibukan Saat Ini</Label>
                    <div className="relative">
                      <Input id="kesibukan" placeholder="Mahasiswa, Pekerja, dll..." value={kesibukan} onChange={(e) => setKesibukan(e.target.value)} className="pl-10" required />
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Min. 6 karakter" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="pr-10"
                    required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full py-7 font-bold text-lg mt-6 bg-gold hover:bg-[#B8860B] text-black" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : "Buat Akun Sekarang"}
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2">
                Sudah punya akun?{" "}
                <Link to="/login" className="text-gold font-black hover:underline">Masuk di sini</Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex gap-4">
          <Info className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 leading-relaxed">
            <p className="font-bold mb-1">Informasi Penting:</p>
            Setelah pendaftaran berhasil, data Anda akan kami simpan untuk keperluan koordinasi program Kakak Saku. Tim admin akan memproses verifikasi dalam waktu maksimal 1x24 jam.
          </div>
        </div>
      </div>
    </div>
  );
}