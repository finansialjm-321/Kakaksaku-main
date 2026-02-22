import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar from "@/components/AdminSidebar";
import { motion } from "framer-motion";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  Wallet, 
  Heart,
  Calendar as CalendarIcon,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function LaporanDonasi() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Mengambil data donasi yang statusnya sukses saja
      const { data, error } = await supabase
        .from("donations")
        .select(`
          donor_name, 
          amount, 
          sustainability_amount, 
          payment_status, 
          created_at,
          donation_programs ( title )
        `)
        .eq("payment_status", "success")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDonations(data || []);
    } catch (error: any) {
      console.error("Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // KALKULASI RINGKASAN
  const totalKeseluruhan = donations.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const totalKeberlanjutan = donations.reduce((acc, item) => acc + Number(item.sustainability_amount || 0), 0);
  const totalDonasiUtama = totalKeseluruhan - totalKeberlanjutan;

  // FUNGSI GENERATE PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    const dateNow = format(new Date(), "dd MMMM yyyy", { locale: id });

    // Header Laporan
    doc.setFontSize(18);
    doc.text("LAPORAN DONASI JAKARTA MENGABDI", 14, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Dicetak pada: ${dateNow}`, 14, 28);

    // Ringkasan Dana
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text("Ringkasan Dana:", 14, 40);
    doc.text(`- Total Donasi Utama: Rp ${totalDonasiUtama.toLocaleString('id-ID')}`, 14, 48);
    doc.text(`- Total Keberlanjutan: Rp ${totalKeberlanjutan.toLocaleString('id-ID')}`, 14, 56);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL AKUMULASI: Rp ${totalKeseluruhan.toLocaleString('id-ID')}`, 14, 66);

    // Tabel Transaksi
    const tableRows = donations.map(item => [
      format(new Date(item.created_at), "dd/MM/yyyy HH:mm"),
      item.donor_name,
      item.donation_programs?.title || "Umum",
      `Rp ${(item.amount - item.sustainability_amount).toLocaleString('id-ID')}`,
      `Rp ${item.sustainability_amount.toLocaleString('id-ID')}`,
      `Rp ${item.amount.toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: 75,
      head: [['Waktu', 'Donatur', 'Program', 'Utama', 'Sumbangan', 'Total']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55] }, // Warna Gold JM
    });

    doc.save(`Laporan-Donasi-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex text-[#1A1A1A]">
      <AdminSidebar />
      
      <main className="flex-grow ml-20 md:ml-64 p-6 md:p-10 transition-all">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Laporan Donasi</h1>
            <p className="text-muted-foreground mt-1 font-medium">Rekapitulasi dana sukses secara transparan.</p>
          </div>
          <button 
            onClick={downloadPDF}
            disabled={loading || donations.length === 0}
            className="flex items-center gap-3 bg-[#1A1A1A] text-white px-8 py-4 rounded-2xl font-black hover:bg-zinc-800 transition-all shadow-xl shadow-black/10 disabled:opacity-50"
          >
            <Download size={20} />
            Download PDF
          </button>
        </header>

        {/* STATS SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard title="Donasi Utama" value={totalDonasiUtama} icon={Wallet} color="blue" />
          <StatCard title="Keberlanjutan" value={totalKeberlanjutan} icon={Heart} color="gold" />
          <StatCard title="Total Dana" value={totalKeseluruhan} icon={TrendingUp} color="black" dark />
        </div>

        {/* TRANSAKSI TERBARU */}
        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <div className="flex items-center gap-3">
              <FileText className="text-gold" size={24} />
              <h2 className="text-xl font-black">Rincian Transaksi Sukses</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <th className="p-8 border-b">Waktu</th>
                  <th className="p-8 border-b">Donatur</th>
                  <th className="p-8 border-b text-right">Utama</th>
                  <th className="p-8 border-b text-right">Sumbangan</th>
                  <th className="p-8 border-b text-right text-black">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-gold" /></td></tr>
                ) : (
                  donations.map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6 text-xs font-bold">{format(new Date(item.created_at), "dd MMM yyyy, HH:mm")}</td>
                      <td className="px-8 py-6 font-black text-sm">{item.donor_name}</td>
                      <td className="px-8 py-6 text-right text-xs">Rp {(item.amount - item.sustainability_amount).toLocaleString('id-ID')}</td>
                      <td className="px-8 py-6 text-right text-xs text-gold font-bold">Rp {item.sustainability_amount.toLocaleString('id-ID')}</td>
                      <td className="px-8 py-6 text-right font-black">Rp {item.amount.toLocaleString('id-ID')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

// Komponen Card Statistik
function StatCard({ title, value, icon: Icon, color, dark }: any) {
  return (
    <motion.div whileHover={{ y: -5 }} className={`${dark ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A]'} p-8 rounded-[2.5rem] border border-gray-100 shadow-sm`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${dark ? 'bg-white/10' : 'bg-gray-50 text-gold'}`}>
        <Icon size={24} />
      </div>
      <p className={`text-[10px] font-black uppercase tracking-widest ${dark ? 'text-white/40' : 'text-muted-foreground'}`}>{title}</p>
      <h3 className="text-2xl font-black mt-1">Rp {value.toLocaleString('id-ID')}</h3>
    </motion.div>
  );
}