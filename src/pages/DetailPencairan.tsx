import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Receipt, Calendar, ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function DetailPencairan() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDisbursements = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("pencairan_dana")
          .select("nominal, keterangan, tanggal_pencairan, bukti_url, created_at")
          .eq("program_id", id)
          .order("tanggal_pencairan", { ascending: false });

        if (error) throw error;
        setDisbursements(data || []);
      } catch (err: any) {
        console.error("Gagal memuat data pencairan:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDisbursements();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Memuat Histori Pencairan...</p>
    </div>
  );

  const totalDisbursed = disbursements.reduce((acc, curr) => acc + Number(curr.nominal || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 py-12 px-4 container mx-auto max-w-3xl">
        {/* Tombol Back & Header Page */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(-1)} 
            className="rounded-full bg-white shadow-sm border-gray-200"
          >
            <ArrowLeft size={20} className="text-gray-700" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center shadow-sm">
              <Receipt size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Histori Pencairan</h1>
          </div>
        </div>

        {/* Card Total Ringkasan (Kaya di Modal) */}
        <div className="mb-8 p-8 bg-gradient-to-br from-white to-orange-50 rounded-[2.5rem] border border-orange-100 shadow-sm flex flex-col sm:flex-row items-center justify-around text-center divide-y sm:divide-y-0 sm:divide-x divide-orange-200 gap-6 sm:gap-0">
          <div className="flex-1 w-full sm:w-auto pt-2 sm:pt-0 sm:px-4 flex flex-col items-center justify-center">
            <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Dana sudah dicairkan</p>
            <p className="text-3xl md:text-4xl font-black text-gray-900">
              Rp {totalDisbursed.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="flex-1 w-full sm:w-auto pt-6 sm:pt-0 sm:px-4 flex flex-col items-center justify-center">
            <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-2">Total Pencairan</p>
            <p className="text-3xl md:text-4xl font-black text-gray-900">
              {disbursements.length} <span className="text-xl md:text-2xl text-gray-600 font-bold">Kali</span>
            </p>
          </div>
        </div>

        {/* List Pencairan */}
        <div className="space-y-4">
          {disbursements.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-white">
              <p className="text-gray-400 font-bold italic text-lg">Belum ada catatan pencairan dana.</p>
            </div>
          ) : (
            disbursements.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm gap-4 transition-all hover:shadow-md">
                {/* Tambahan class min-w-0 untuk mencegah teks memaksa width flex memanjang */}
                <div className="flex-1 min-w-0">
                  {/* Tambahan class break-words dan whitespace-pre-wrap agar teks di wrap ke bawah */}
                  <p className="font-black text-lg text-gray-800 leading-tight mb-2 break-words whitespace-pre-wrap">
                    {item.keterangan}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <p className="text-sm font-bold text-gray-400 flex items-center gap-1.5 whitespace-nowrap">
                      <Calendar size={14} /> {item.tanggal_pencairan ? format(new Date(item.tanggal_pencairan), "dd MMMM yyyy", { locale: localeId }) : '-'}
                    </p>
                    {item.bukti_url && (
                      <a 
                        href={item.bukti_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm font-bold text-orange-500 hover:text-orange-700 flex items-center gap-1.5 transition-colors bg-orange-50 px-2.5 py-1 rounded-lg whitespace-nowrap"
                      >
                        <ExternalLink size={14} /> Lihat Bukti
                      </a>
                    )}
                  </div>
                </div>
                <div className="bg-orange-50 px-6 py-4 rounded-2xl shrink-0 text-center self-start sm:self-center">
                  <p className="font-black text-orange-600 text-lg whitespace-nowrap">
                    Rp {Number(item.nominal).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}