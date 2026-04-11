import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, ArrowLeft, MessageCircle, Calendar, 
  Users, Share2, CheckCircle2, Camera, ArrowRight,
  Wallet, Newspaper
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

export default function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState<any>(null);
  const [donors, setDonors] = useState<any[]>([]);
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [latestUpdate, setLatestUpdate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchProgramData = async () => {
      setLoading(true);
      try {
        // 1. Ambil Detail Program & Total Terkumpul
        const { data: prog, error: progErr } = await supabase
          .from("donation_programs")
          .select("*, program_totals(total_collected)")
          .eq("id", id)
          .single();

        if (progErr) throw progErr;

        // 2. Ambil List Donatur yang SUKSES
        const { data: donorList, error: donorErr } = await supabase
          .from("donations")
          .select("donor_name, message, amount, created_at, payment_status")
          .eq("program_id", id)
          .in("payment_status", ["success", "settled", "paid"])
          .order("created_at", { ascending: false });

        if (donorErr) throw donorErr;

        // 3. Ambil List Pencairan Dana (Tetap diambil untuk total kalkulasi di Card)
        const { data: disbursementList, error: disbursementErr } = await supabase
          .from("pencairan_dana")
          .select("nominal")
          .eq("program_id", id);

        if (!disbursementErr && disbursementList) {
          setDisbursements(disbursementList);
        } else {
          console.error("Gagal memuat data pencairan:", disbursementErr?.message);
        }

        // 4. Ambil Kabar Terbaru
        const { data: updateData, error: updateErr } = await supabase
          .from("kabar_terbaru")
          .select("title, created_at")
          .eq("program_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!updateErr && updateData) {
          setLatestUpdate(updateData);
        }

        setProgram(prog);
        setDonors(donorList || []);
      } catch (err: any) {
        console.error("Gagal memuat data:", err.message);
        toast.error("Gagal memuat data program");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProgramData();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    toast.success("Link berhasil disalin!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Menyiapkan Detail...</p>
    </div>
  );

  if (!program) return <div className="min-h-screen flex items-center justify-center">Program tidak ditemukan.</div>;

  const collected = program.program_totals?.[0]?.total_collected || 0;
  const target = program.target_amount || 1;
  const pct = Math.min(100, (collected / target) * 100);

  // Kalkulasi total pencairan
  const totalDisbursed = disbursements.reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);
  const hasGallery = [program.gallery_1, program.gallery_2, program.gallery_3, program.gallery_4, program.gallery_5].some(url => url && url.trim() !== "");
  const messagesOnly = donors.filter(d => d.message && d.message.trim() !== "");

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">
      <Header />
      
      <main className="pb-24">
        {/* Banner Utama */}
        <div className="relative h-[45vh] md:h-[65vh] w-full overflow-hidden bg-gray-900">
          <img src={program.image_url || "/placeholder.svg"} className="w-full h-full object-cover opacity-80" alt={program.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          <Button 
            onClick={() => navigate("/donasi")} 
            className="absolute top-6 left-6 bg-white/20 backdrop-blur-xl text-white rounded-2xl p-4 border border-white/30 hover:bg-white/40"
          >
            <ArrowLeft size={20} />
          </Button>
        </div>

        <div className="container mx-auto px-4 -mt-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            <div className="lg:col-span-2 space-y-10">
              {/* Card Deskripsi */}
              <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <span className="bg-orange-100 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Program Aktif</span>
                  <span className="text-gray-400 text-xs font-bold flex items-center gap-1">
                    <Calendar size={12} /> {format(new Date(program.created_at), "MMMM yyyy", { locale: localeId })}
                  </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black leading-tight mb-8 tracking-tight">{program.title}</h1>
                <div className="prose prose-orange max-w-none text-gray-500 font-medium text-lg leading-relaxed whitespace-pre-line">
                  {program.description}
                </div>
              </div>

              {/* SECTION DOKUMENTASI */}
              {hasGallery && (
                <div className="bg-orange-50/50 p-8 rounded-[3rem] border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm">
                      <Camera size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">Dokumentasi Lapangan</h3>
                      <p className="text-sm text-gray-500 font-medium">Lihat bukti penyaluran dan kondisi terkini di lapangan.</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate(`/program/${id}/gallery`)}
                    className="bg-[#1A1A1A] hover:bg-zinc-800 text-white rounded-2xl px-8 py-6 h-auto font-black flex items-center gap-3 transition-all active:scale-95 shadow-xl w-full md:w-auto"
                  >
                    Lihat Semua Foto <ArrowRight size={20} />
                  </Button>
                </div>
              )}

              {/* SECTION PENCAIRAN DANA */}
              <div className="bg-orange-50/50 p-8 rounded-[3rem] border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                    <Wallet size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Informasi Pencairan Dana</h3>
                    <p className="text-sm text-gray-500 font-medium">Dana yang telah disalurkan: <span className="font-bold text-gray-800">Rp {totalDisbursed.toLocaleString('id-ID')}</span></p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate(`/program/${id}/pencairan`)}
                  className="bg-[#1A1A1A] hover:bg-zinc-800 text-white rounded-2xl px-8 py-6 h-auto font-black flex items-center gap-3 transition-all active:scale-95 shadow-xl w-full md:w-auto"
                >
                  Lihat Detail <ArrowRight size={20} />
                </Button>
              </div>

              {/* Kabar Kebaikan (Messages) */}
              <div className="space-y-8">
                <div className="flex items-center justify-between px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                      <MessageCircle size={24} />
                    </div>
                    <h2 className="text-2xl font-black">Kabar Kebaikan</h2>
                  </div>
                  <span className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl font-bold text-sm">
                    {messagesOnly.length} Doa Terkumpul
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {messagesOnly.length === 0 ? (
                    <div className="bg-gray-50 p-12 rounded-[3rem] text-center border-2 border-dashed border-gray-200">
                       <p className="text-gray-400 font-bold italic">Belum ada doa yang tertulis. Jadilah yang pertama memberikan semangat!</p>
                    </div>
                  ) : (
                    messagesOnly.map((d, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, y: 20 }} 
                        whileInView={{ opacity: 1, y: 0 }} 
                        viewport={{ once: true }}
                        className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-black text-sm uppercase">
                              {d.donor_name?.charAt(0) || "H"}
                            </div>
                            <p className="font-black text-gray-900">{d.donor_name || "Hamba Allah"}</p>
                          </div>
                          <span className="text-[10px] font-black text-gray-300 uppercase">
                            {format(new Date(d.created_at), "dd MMM", { locale: localeId })}
                          </span>
                        </div>
                        <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-50 relative italic font-medium text-gray-600">
                          <span className="absolute -top-3 left-6 text-4xl text-orange-200 font-serif leading-none">“</span>
                          {d.message}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Stats (Sticky) */}
            <div className="lg:col-span-1">
              <div className="bg-white p-8 md:p-10 rounded-[3.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-orange-100 sticky top-24 space-y-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Dana Terkumpul</p>
                      <p className="text-4xl font-black text-orange-500">Rp {collected.toLocaleString('id-ID')}</p>
                    </div>
                    <p className="text-xl font-black text-gray-900">{pct.toFixed(1)}%</p>
                  </div>
                  <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden relative shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${pct}%` }} 
                      transition={{ duration: 1.5, ease: "circOut" }} 
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full shadow-lg" 
                    />
                  </div>
                  <p className="text-[11px] font-black text-gray-400 uppercase text-center tracking-widest">
                    Target: Rp {program.target_amount.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-6 border-y border-gray-50">
                  <div className="flex flex-col items-center gap-1 border-r border-gray-100">
                    <Users size={20} className="text-gray-400" />
                    <p className="text-[10px] font-black text-gray-400 uppercase">Donatur</p>
                    <p className="font-black text-lg">{donors.length}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 size={20} className="text-green-500" />
                    <p className="text-[10px] font-black text-gray-400 uppercase">Status</p>
                    <p className="font-black text-lg text-green-600 uppercase">Active</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={() => navigate(`/donate?program=${program.id}`)} 
                    className="w-full h-20 text-xl font-black rounded-[2rem] bg-orange-500 hover:bg-orange-600 shadow-2xl shadow-orange-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Heart className="fill-white" /> Donasi Sekarang
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleCopyLink} 
                    className={`w-full h-16 rounded-[1.5rem] font-black gap-3 border-2 transition-all ${
                      isCopied ? 'bg-green-50 border-green-500 text-green-600' : 'hover:bg-gray-50 border-gray-100'
                    }`}
                  >
                    {isCopied ? <CheckCircle2 size={18} /> : <Share2 size={18} />} 
                    {isCopied ? 'Link Disalin' : 'Bagikan Program'}
                  </Button>
                </div>

                <div className="bg-orange-50/50 p-6 rounded-3xl flex items-start gap-4">
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm shrink-0 font-bold">100%</div>
                   <p className="text-[11px] text-orange-800 font-bold leading-relaxed">
                     Donasi Anda disalurkan secara transparan melalui Jakarta Mengabdi.
                   </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}