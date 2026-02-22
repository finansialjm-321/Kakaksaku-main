import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, Wallet, LogOut, CheckCircle2, 
  History, ArrowRight, AlertCircle, CreditCard, 
  User, Sparkles, ReceiptText, Clock, XCircle, 
  HeartHandshake, ImageIcon, ChevronLeft, ChevronRight
} from "lucide-react";

export default function KakasakuDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  
  // State untuk Riwayat
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [totalTransactions, setTotalTransactions] = useState<number>(0);
  const [totalDonasi, setTotalDonasi] = useState<number>(0);

  // State untuk Program Donasi
  const [programs, setPrograms] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Ref untuk Slider Program Donasi
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // 1. Ambil Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      // 2. Ambil Langganan Kakak Saku Aktif
      const { data: subData } = await supabase
        .from('kakasaku_subscriptions')
        .select('*, kakasaku_packages(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle(); 
      
      if (subData) setSubscription(subData);

      // 3. Ambil Semua Riwayat Pembayaran
      const { data: paymentsData } = await supabase
        .from('kakasaku_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (paymentsData) {
        setRecentPayments(paymentsData.slice(0, 4));
        setTotalTransactions(paymentsData.length);

        const total = paymentsData
          .filter(p => ['settled', 'success', 'paid'].includes(p.status?.toLowerCase()))
          .reduce((sum, current) => sum + (current.amount || current.bill_total || 0), 0);
        
        setTotalDonasi(total);
      }

      // 4. Ambil Data Program Donasi (Ambil 5 terbaru untuk slider)
      const { data: programsData } = await supabase
        .from('donation_programs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (programsData) {
        setPrograms(programsData);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const handleExitToHome = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Fungsi untuk menggeser slider ke Kiri
  const slideLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  // Fungsi untuk menggeser slider ke Kanan
  const slideRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka || 0);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const getJoinDate = () => {
    const dateStr = subscription?.created_at || profile?.created_at;
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const s = status?.toLowerCase();
    if (s === 'settled' || s === 'success' || s === 'paid') {
      return <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3"/> Sukses</span>;
    }
    if (s === 'pending') {
      return <span className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3"/> Pending</span>;
    }
    return <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3"/> Gagal</span>;
  };

  if (loading) return <div className="min-h-screen flex flex-col items-center justify-center text-orange-500 font-bold bg-[#FDFCFB]"><Sparkles className="w-8 h-8 animate-pulse mb-4" /> Memuat Dashboard...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      
      <main className="container mx-auto max-w-4xl pt-8 md:pt-12 pb-20 px-4 sm:px-6">
        
        {/* LOGO KAKAK SAKU */}
        <div className="mb-8 flex items-center">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-orange-500 fill-orange-500/20" />
            <span className="font-black text-[#1A1A1A] text-base tracking-wider uppercase">Kakak Saku</span>
          </div>
        </div>

        {/* 1. HEADER PROFIL */}
        <div className="flex items-center justify-between mb-8 bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-50 rounded-full flex items-center justify-center text-orange-500">
              <User className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground tracking-wider uppercase mb-0.5">Donatur Aktif</p>
              <h1 className="text-lg md:text-xl font-black text-[#1A1A1A]">
                Halo, {profile?.nama_lengkap?.split(' ')[0] || 'Orang Baik'}! 👋
              </h1>
            </div>
          </div>
          <Button variant="ghost" onClick={handleExitToHome} className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl px-3 md:px-4 shrink-0">
            <LogOut className="w-5 h-5 md:mr-2" /> <span className="hidden md:inline font-bold">Keluar</span>
          </Button>
        </div>

        {/* 2. KARTU UTAMA (STATUS KAKAK SAKU) */}
        <div className="mb-6">
          {!subscription ? (
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-3xl p-6 md:p-8 text-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-orange-300"></div>
              <Heart className="w-12 h-12 text-orange-200 mx-auto mb-4" />
              <h2 className="text-xl md:text-2xl font-black text-[#1A1A1A] mb-2">Mulai Perjalanan Kebaikanmu</h2>
              <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto mb-6">
                Kamu belum memilih paket rutin Kakak Saku. Ayo mulai kontribusi bulananmu untuk mendukung pendidikan adik-adik di Jakarta.
              </p>
              
              <div className="bg-orange-50 border border-orange-100 text-orange-800 p-3 md:p-4 rounded-2xl flex items-start gap-3 text-left mb-6 max-w-md mx-auto">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0 text-orange-500" />
                <p className="text-xs md:text-sm">
                  Komitmen ini bersifat jangka panjang. Paket yang dipilih <strong>tidak dapat diubah/diturunkan</strong>. Pilih sesuai kemampuanmu ya!
                </p>
              </div>

              <Button className="w-full sm:w-auto px-8 py-6 text-base font-black rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20" onClick={() => navigate('/kakasaku/paket')}>
                Pilih Paket Sekarang <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden text-white">
              <div className="absolute bottom-0 right-0 bg-[#2A2A2A] text-gray-400 font-black text-[10px] md:text-xs px-4 py-2 rounded-tl-2xl rounded-br-3xl uppercase tracking-wider">
                Berlangganan Aktif
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                  <div className="flex items-center gap-2 text-orange-400 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold text-sm">Paket Rutin Anda</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black mb-1 text-white">
                    {subscription.kakasaku_packages?.name || 'Paket Kakak Saku'}
                  </h2>
                  <p className="text-gray-400 text-sm md:text-base">
                    Komitmen bulanan: <span className="text-white font-bold">{formatRupiah(subscription.kakasaku_packages?.price || 0)}</span>
                  </p>
                </div>
                
                <div className="w-full md:w-auto bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center md:text-right">
                  <p className="text-xs text-gray-400 font-medium mb-3">Tagihan Bulan Ini</p>
                  <Button 
                    className="w-full md:w-auto rounded-xl font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                    onClick={() => navigate('/kakasaku/bayar-tagihan', { state: { subId: subscription.id } })}
                  >
                    <CreditCard className="w-4 h-4 mr-2 shrink-0" /> Bayar Sekarang
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. STATISTIK CEPAT */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="rounded-3xl border border-gray-100 shadow-sm bg-white">
            <CardContent className="p-5 flex flex-col items-center text-center">
              <div className="bg-green-50 p-3 rounded-full text-green-600 mb-3"><Wallet className="w-6 h-6" /></div>
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Donasi</p>
              <h3 className="text-lg md:text-xl font-black text-[#1A1A1A]">
                {formatRupiah(totalDonasi)}
              </h3>
            </CardContent>
          </Card>
          <Card className="rounded-3xl border border-gray-100 shadow-sm bg-white">
            <CardContent className="p-5 flex flex-col items-center text-center">
              <div className="bg-blue-50 p-3 rounded-full text-blue-600 mb-3"><History className="w-6 h-6" /></div>
              <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Bulan Bergabung</p>
              <h3 className="text-lg md:text-xl font-black text-[#1A1A1A]">{getJoinDate()}</h3>
            </CardContent>
          </Card>
        </div>

        {/* 4. PROGRAM DONASI (SLIDER) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-orange-100 relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-orange-500" /> Program Kebaikan
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Bantu wujudkan senyum mereka hari ini.</p>
            </div>
            
            <Button variant="ghost" className="text-orange-500 text-sm hover:bg-orange-50 rounded-xl px-3 hidden sm:flex" onClick={() => navigate('/donasi')}>
              Lihat Semua
            </Button>
          </div>

          {programs.length === 0 ? (
            <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-sm text-muted-foreground">Belum ada program donasi yang aktif.</p>
            </div>
          ) : (
            <div className="relative group">
              
              {/* Tombol Panah Kiri (Muncul melayang di kiri) */}
              {programs.length > 1 && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={slideLeft} 
                  className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-xl border-gray-200 text-gray-500 hover:text-orange-500 hover:border-orange-500 hidden sm:flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}

              {/* Container Slider Utama */}
              <div 
                ref={sliderRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-2 px-2 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {programs.map((prog) => {
                  const percentage = Math.min(Math.round((prog.collected_amount / prog.target_amount) * 100) || 0, 100);
                  
                  return (
                    <div 
                      key={prog.id} 
                      className="w-[85%] sm:w-[48%] shrink-0 snap-start border border-gray-100 rounded-2xl overflow-hidden hover:border-orange-200 hover:shadow-md transition-all bg-white flex flex-col"
                    >
                      {/* Gambar Thumbnail */}
                      <div className="w-full h-36 bg-gray-100 relative overflow-hidden shrink-0">
                        {prog.image_url ? (
                          <img src={prog.image_url} alt={prog.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-bold px-2 py-1 rounded-lg text-orange-600 shadow-sm">
                          Bantu Sekarang
                        </div>
                      </div>
                      
                      {/* Detail Konten */}
                      <div className="p-4 flex flex-col flex-grow">
                        <h4 className="font-bold text-[#1A1A1A] mb-1 line-clamp-1" title={prog.title}>{prog.title}</h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-grow min-h-[2rem]">{prog.description}</p>
                        
                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between text-[10px] font-bold mb-1.5">
                            <span className="text-orange-500">Terkumpul {formatRupiah(prog.collected_amount)}</span>
                            <span className="text-gray-400">{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 font-medium">
                            <span>Target: {formatRupiah(prog.target_amount)}</span>
                          </div>
                        </div>

                        {/* Tombol Donasi */}
                        <Button 
                          className="w-full rounded-xl bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-600 font-bold transition-colors mt-auto"
                          onClick={() => navigate(`/donasi/${prog.id}`)}
                        >
                          <Heart className="w-4 h-4 mr-2" /> Donasi Sekarang
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tombol Panah Kanan (Muncul melayang di kanan) */}
              {programs.length > 1 && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={slideRight} 
                  className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-xl border-gray-200 text-gray-500 hover:text-orange-500 hover:border-orange-500 hidden sm:flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              )}
            </div>
          )}
          
          <Button variant="ghost" className="w-full mt-2 text-orange-500 text-sm hover:bg-orange-50 rounded-xl px-3 sm:hidden" onClick={() => navigate('/donasi')}>
            Lihat Semua Program
          </Button>
        </div>

        {/* 5. RIWAYAT TRANSAKSI */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
              <History className="w-5 h-5 text-gray-400" /> Riwayat Pembayaran
            </h3>
          </div>
          
          {recentPayments.length === 0 ? (
            <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <ReceiptText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentPayments.map((trx) => (
                <div key={trx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-orange-50/50 transition-colors gap-3">
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex w-10 h-10 rounded-full bg-white border border-gray-200 items-center justify-center shrink-0">
                      <ReceiptText className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1A1A1A] line-clamp-1">
                        {trx.bill_reff || 'Pembayaran Kakak Saku'}
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(trx.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center border-t border-gray-100 sm:border-0 pt-3 sm:pt-0 gap-1">
                    <p className="text-sm font-black text-[#1A1A1A]">{formatRupiah(trx.amount || trx.bill_total || 0)}</p>
                    <StatusBadge status={trx.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalTransactions > 4 && (
            <Button 
              variant="outline" 
              className="w-full mt-6 rounded-xl border-gray-200 text-[#1A1A1A] hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
              onClick={() => navigate('/kakasaku/riwayat')}
            >
              Lihat Riwayat Lengkap <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

      </main>
    </div>
  );
}