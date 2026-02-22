import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; 
import { ArrowLeft, CheckCircle2, Heart, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function KakasakuPackages() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<any | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [hasActivePackage, setHasActivePackage] = useState(false);
  
  const [isAgreed, setIsAgreed] = useState(false);
  
  // STATE BARU UNTUK UI MODAL (MENGGANTIKAN ALERT NATIVE)
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserProfile({ id: user.id, email: user.email, name: user.user_metadata?.full_name || 'Donatur' });
      } else {
        navigate('/login');
        return;
      }

      const { data: subscription } = await supabase
        .from('kakasaku_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active') 
        .maybeSingle();

      if (subscription) {
        setHasActivePackage(true);
        setFetching(false);
        return; 
      }

      const { data, error } = await supabase
        .from('kakasaku_packages')
        .select('*')
        .order('amount', { ascending: true }); 

      if (data) setPackages(data);
      if (error) console.error("Gagal ambil paket:", error);
      
      setFetching(false);
    };
    initData();
  }, [navigate]);

  const handleConfirmPackage = async () => {
    if (!selectedPkg || !isAgreed) return; // Validasi aman karena tombolnya sudah di-disable

    setLoading(true);
    
    try {
      const { error: dbError } = await supabase.from('kakasaku_subscriptions').upsert({
        user_id: userProfile.id,
        package_id: selectedPkg.id,
        amount: selectedPkg.amount, 
        status: 'active', 
      }, { onConflict: 'user_id' });

      if (dbError) throw new Error(`Gagal menyimpan pilihan paket: ${dbError.message}`);

      // Munculkan Modal Sukses yang elegan
      setShowSuccessModal(true);

    } catch (error: any) {
      console.error("Selection error:", error);
      // Munculkan Modal Error yang elegan
      setErrorMessage(error.message || "Terjadi kesalahan sistem saat memproses pilihan paket.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPackage = (pkg: any) => {
    setSelectedPkg(pkg);
    setIsAgreed(false); 
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  if (fetching) return <div className="min-h-screen flex items-center justify-center font-bold text-orange-500 bg-gray-50">Memuat Data Paket...</div>;

  if (hasActivePackage) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Card className="max-w-md text-center p-8 rounded-3xl border-none shadow-lg">
          <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-[#1A1A1A]">Kamu Sudah Berlangganan!</h2>
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
            Sistem mendeteksi bahwa kamu sudah memiliki paket Kakak Saku yang aktif. Sesuai ketentuan, satu akun hanya dapat memiliki satu paket komitmen rutin.
          </p>
          <Button className="w-full rounded-2xl py-6 font-bold bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20" onClick={() => navigate('/kakasaku/dashboard')}>
            Kembali ke Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] p-4 md:p-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate('/kakasaku/dashboard')} className="rounded-full w-12 h-12 p-0 bg-white shadow-sm border border-gray-100 hover:bg-gray-50 shrink-0">
            <ArrowLeft className="h-5 w-5 text-[#1A1A1A]" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1A1A1A]">Pilih Paket Kakak Saku</h1>
            <p className="text-muted-foreground text-sm mt-1">Tentukan komitmen rutin bulananmu untuk adik-adik di Jakarta.</p>
          </div>
        </div>

        {/* LIST PAKET */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isSelected = selectedPkg?.id === pkg.id;
            return (
              <Card 
                key={pkg.id} 
                className={`cursor-pointer transition-all duration-300 rounded-[2rem] border-2 relative overflow-hidden group ${
                  isSelected 
                    ? 'border-orange-500 bg-orange-50 shadow-lg scale-[1.02] ring-4 ring-orange-500/20' 
                    : 'border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-orange-200'
                }`}
                onClick={() => handleSelectPackage(pkg)}
              >
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className={`p-4 rounded-full mb-6 transition-all duration-300 ${
                    isSelected ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40 scale-110' : 'bg-gray-50 text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-500'
                  }`}>
                    <Heart className={`w-8 h-8 transition-all ${isSelected ? 'fill-white/30' : ''}`} />
                  </div>
                  
                  <h3 className="font-black text-xl text-[#1A1A1A] mb-2">{pkg.name}</h3>
                  
                  <div className="mb-4">
                    <span className={`text-3xl font-black transition-colors ${isSelected ? 'text-orange-600' : 'text-[#1A1A1A]'}`}>
                      Rp {pkg.amount.toLocaleString('id-ID')}
                    </span>
                    <span className="text-sm font-bold text-muted-foreground block mt-1">/ bulan</span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed">{pkg.description}</p>
                  
                  {pkg.benefits && Array.isArray(pkg.benefits) && (
                    <ul className={`text-xs text-left w-full space-y-3 p-4 rounded-2xl border transition-colors ${isSelected ? 'bg-white border-orange-200' : 'bg-white border-gray-100'}`}>
                      {pkg.benefits.map((benefit: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-gray-600">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 transition-colors ${isSelected ? 'text-orange-500' : 'text-gray-300 group-hover:text-orange-400'}`}/> 
                          <span className="leading-snug">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
                      Terpilih
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* KONFIRMASI SIMPEL (MUNCUL JIKA PAKET DIPILIH) */}
        {selectedPkg && (
          <div className="max-w-2xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
              
              <h3 className="text-xl font-black text-center mb-6 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" /> Satu Langkah Lagi!
              </h3>
              
              <div className="bg-gray-50 rounded-3xl p-6 mb-6 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left border border-gray-100 gap-4">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Paket Terpilih</p>
                  <p className="font-black text-lg text-[#1A1A1A] leading-none mb-2">{selectedPkg.name}</p>
                  <p className="text-[11px] text-gray-400 font-medium">Akun: {userProfile?.email}</p>
                </div>
                <div className="sm:text-right w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-200">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Komitmen Bulanan</p>
                  <p className="text-2xl font-black text-orange-500">Rp {selectedPkg.amount.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="mb-6">
                 <Textarea 
                   placeholder="Tulis pesan atau doa untuk adik-adik (Opsional)..." 
                   className="rounded-2xl resize-none bg-gray-50/50 border-gray-200 min-h-[80px] text-sm focus:border-orange-300 focus:ring-orange-200"
                   value={note}
                   onChange={(e) => setNote(e.target.value)}
                 />
              </div>

              <div className={`rounded-3xl p-5 border-2 transition-all duration-300 cursor-pointer ${
                isAgreed ? 'border-green-500 bg-green-50/50' : 'border-red-200 bg-red-50/50 hover:bg-red-50'
              }`}>
                <label className="flex items-start gap-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className={`w-6 h-6 mt-0.5 rounded cursor-pointer transition-colors ${isAgreed ? 'accent-green-600' : 'accent-red-500'}`}
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                  />
                  <div className="flex-1 select-none">
                    <span className={`text-sm font-black block mb-1 ${isAgreed ? 'text-green-800' : 'text-red-800'}`}>
                      Saya setuju dan yakin dengan komitmen ini.
                    </span>
                    <span className={`text-xs leading-relaxed block ${isAgreed ? 'text-green-700/80' : 'text-red-700/80'}`}>
                      Saya memahami bahwa pilihan paket <strong>{selectedPkg.name}</strong> ini bersifat permanen untuk kedepannya dan tidak dapat diturunkan nominalnya.
                    </span>
                  </div>
                </label>
              </div>

              <Button 
                size="lg" 
                className={`w-full mt-8 py-7 text-lg font-black rounded-2xl shadow-xl transition-all duration-300 ${
                  !isAgreed ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none hover:bg-gray-300' : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30 hover:-translate-y-1'
                }`} 
                onClick={handleConfirmPackage} 
                disabled={loading || !isAgreed}
              >
                {loading ? 'Menyimpan...' : 'Lanjut Simpan Paket Kakak Saku'}
              </Button>

            </div>
          </div>
        )}

      </div>

      {/* ==============================================================
          UI KUSTOM UNTUK NOTIFIKASI SUKSES & ERROR (PENGGANTI ALERT) 
          ============================================================== */}

      {/* MODAL SUKSES */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-sm text-center rounded-[2.5rem] border-none shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <CardContent className="p-8 pt-10">
              <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
                <CheckCircle2 className="w-12 h-12 relative z-10" />
              </div>
              <h3 className="text-2xl font-black text-[#1A1A1A] mb-3">Berhasil Tersimpan!</h3>
              <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                Komitmen paket Kakak Saku kamu sudah dicatat. Yuk, kembali ke Dashboard untuk menyelesaikan tagihan pertamamu.
              </p>
              <Button 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl py-6 shadow-lg shadow-orange-500/30 text-base"
                onClick={() => navigate('/kakasaku/dashboard')}
              >
                Ke Dashboard Sekarang
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL ERROR */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-sm text-center rounded-[2.5rem] border-none shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <CardContent className="p-8 pt-10">
              <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
                <AlertCircle className="w-12 h-12 relative z-10" />
              </div>
              <h3 className="text-2xl font-black text-[#1A1A1A] mb-3">Yah, Gagal!</h3>
              <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                {errorMessage}
              </p>
              <Button 
                variant="outline"
                className="w-full font-bold rounded-2xl py-6 text-base"
                onClick={() => setErrorMessage("")}
              >
                Tutup & Coba Lagi
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}