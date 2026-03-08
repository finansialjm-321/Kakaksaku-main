import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Eye, EyeOff, Phone, Mail, User, Info, Calendar, Briefcase, Users } from "lucide-react";

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
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi basic sebelum nembak ke Supabase
    if (!jenisKelamin) {
      toast({ title: "Validasi Gagal", description: "Pilih Jenis Kelamin terlebih dahulu.", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // 1. Daftar ke Auth Supabase
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name } }
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Simpan semua data lengkap ke tabel profiles menggunakan UPSERT (Bukan Insert)
        // Ini akan mencegah error duplicate key jika ada Trigger database yang berjalan
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([
            {
              id: data.user.id, 
              nama_lengkap: name, 
              no_wa: phone, 
              email: email.trim(),
              tanggal_lahir: tanggalLahir || null, // Handle jika kosong
              jenis_kelamin: jenisKelamin, 
              kesibukan: kesibukan,
              role: 'donatur' 
            }
          ], { onConflict: 'id' }); // Mengandalkan kolom ID untuk ngecek duplikat

        if (profileError) {
          console.error("Detail Error Profil:", profileError);
          throw new Error(`Gagal menyimpan data profil: ${profileError.message}`);
        }

        // 3. Logout paksa user yang baru terdaftar agar mereka harus login manual
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
                {/* Kolom Kiri */}
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

                {/* Kolom Kanan */}
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

              {/* Password Full Width */}
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