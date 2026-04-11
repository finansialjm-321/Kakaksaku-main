import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Newspaper, Calendar } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function DetailKabarTerbaru() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("kabar_terbaru")
          .select("id, title, content, image_url, created_at")
          .eq("program_id", id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setUpdates(data || []);
      } catch (err: any) {
        console.error("Gagal memuat kabar terbaru:", err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUpdates();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Memuat Kabar Terbaru...</p>
    </div>
  );

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
              <Newspaper size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">Kabar Terbaru</h1>
          </div>
        </div>

        {/* List Kabar Terbaru */}
        <div className="space-y-8">
          {updates.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-[2.5rem] bg-white">
              <p className="text-gray-400 font-bold italic text-lg px-4">
                Belum ada kabar terbaru untuk program ini.
              </p>
            </div>
          ) : (
            updates.map((item, index) => (
              <div 
                key={item.id || index} 
                className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                {/* Render gambar jika ada URL-nya */}
                {item.image_url && (
                  <div className="w-full h-48 sm:h-64 overflow-hidden bg-gray-100">
                    <img 
                      src={item.image_url} 
                      alt={item.title} 
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                )}
                
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                      <Calendar size={12} />
                      {item.created_at ? format(new Date(item.created_at), "dd MMMM yyyy", { locale: localeId }) : '-'}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-black text-gray-900 mb-4 leading-tight">
                    {item.title}
                  </h2>
                  
                  <div className="min-w-0">
                    <p className="text-gray-600 font-medium leading-relaxed break-words whitespace-pre-wrap text-[15px]">
                      {item.content}
                    </p>
                  </div>
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