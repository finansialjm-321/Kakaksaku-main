import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Loader2, AlertCircle, Heart } from "lucide-react";
import SustainabilityDonation from "@/components/SustainabilityDonation";

// --- Helpers & Constants ---
interface Program {
  id: string;
  title: string;
}

const PRESET_AMOUNTS = [25000, 50000, 100000, 250000, 500000, 1000000];

const formatRupiah = (n: number) => {
  return new Intl.NumberFormat("id-ID", { 
    style: "currency", 
    currency: "IDR", 
    minimumFractionDigits: 0 
  }).format(n);
};

const generateBillNo = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `DON-${dateStr}-${random}`;
};

export default function Donate() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- LOGIKA REPAY: Membaca Data dari URL ---
  const repayAmount = parseInt(searchParams.get("amount") || "100000");
  const repayName = searchParams.get("name") || "";
  const repayPhone = searchParams.get("phone") || "";
  const repayEmail = searchParams.get("email") || "";
  const repayMsg = searchParams.get("msg") || "";
  const repayProgram = searchParams.get("program") || "";

  // --- States ---
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedProgram, setSelectedProgram] = useState(repayProgram || searchParams.get("program") || "");
  const [amount, setAmount] = useState(repayAmount);
  const [customAmount, setCustomAmount] = useState(PRESET_AMOUNTS.includes(repayAmount) ? "" : repayAmount.toString());

  const [sustainabilityAmount, setSustainabilityAmount] = useState<number | null>(null);
  const [sustainabilityCustomAmount, setSustainabilityCustomAmount] = useState("");

  const [name, setName] = useState(repayName);
  const [email, setEmail] = useState(repayEmail);
  const [phone, setPhone] = useState(repayPhone);
  const [message, setMessage] = useState(repayMsg);

  // --- Effects ---
  useEffect(() => {
    const fetchPrograms = async () => {
      const { data } = await supabase.from("donation_programs").select("id, title");
      if (data) setPrograms(data);
    };
    fetchPrograms();
  }, []);

  // --- Handlers & Logic ---
  const sanitizeNumericInput = (val: string) => val.replace(/\D/g, "").replace(/^0+/, "");

  const finalDonation = customAmount ? parseInt(customAmount) : amount;
  const finalSustainability = sustainabilityCustomAmount ? parseInt(sustainabilityCustomAmount) : (sustainabilityAmount || 0);
  
  const totalAmount = (isNaN(finalDonation) ? 0 : finalDonation) + (isNaN(finalSustainability) ? 0 : finalSustainability);

  const isSustainabilityInvalid = finalSustainability > 0 && finalSustainability < 2000;
  
  // REVISI: Logika minimal donasi diubah dari 10.000 menjadi bebas (minimal 1 rupiah)
  const isTotalInvalid = totalAmount <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isTotalInvalid) {
      toast({ title: "Nominal Kosong", description: "Silakan masukkan nominal donasi Anda", variant: "destructive" });
      return;
    }
    if (isSustainabilityInvalid) {
      toast({ title: "Opsi Tambahan Kurang", description: "Minimal donasi keberlanjutan Rp 2.000", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    const billNo = generateBillNo();
    const programTitle = programs.find(p => p.id === selectedProgram)?.title || "Donasi Umum";

    try {
      const { error: dbError } = await supabase.from("donations").insert({
        bill_no: billNo,
        bill_total: totalAmount, 
        donor_name: name.trim(),
        donor_email: email.trim() || null,
        donor_phone: phone.trim() || null,
        program_id: selectedProgram || null,
        amount: totalAmount, 
        sustainability_amount: finalSustainability,
        message: message.trim() || null,
        payment_status: 'pending',
        tipe_donasi: 'umum'
      });

      if (dbError) throw dbError;

      const { data: faspayData, error: faspayError } = await supabase.functions.invoke('swift-api', {
        body: { 
          action: 'request_payment',
          bill_no: billNo,
          amount: totalAmount,
          cust_name: name.trim(),
          email: email.trim() || "donor@jakarta-mengabdi.com", 
          phone: phone.trim() || "08123456789", 
          program_name: programTitle
        }
      });

      if (faspayError || !faspayData?.redirect_url) {
        throw new Error(faspayError?.message || faspayData?.response_desc || "Gagal menghubungi server pembayaran");
      }

      if (faspayData.trx_id) {
        await supabase.from("donations").update({ trx_id: faspayData.trx_id }).eq("bill_no", billNo);
      }

      window.location.href = faspayData.redirect_url;

    } catch (err: any) {
      toast({ title: "Terjadi Kesalahan", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-[#1A1A1A]">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl border-t-8 border-t-gold rounded-[2.5rem] overflow-hidden bg-white">
            <CardContent className="p-8 md:p-12 space-y-10">
              
              <div className="text-center space-y-3">
                <div className="bg-gold/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="text-gold w-8 h-8 fill-gold" />
                </div>
                <h1 className="text-3xl font-black text-gray-900">Kirim Kebaikan</h1>
                <p className="text-gray-500 max-w-sm mx-auto">
                  Setiap rupiah yang Anda berikan menjadi harapan bagi mereka yang membutuhkan.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gold rounded-full" />
                    <Label className="font-bold text-lg">Pilih Program & Nominal</Label>
                  </div>

                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger className="rounded-2xl border-gray-200 h-14 text-base focus:ring-gold">
                      <SelectValue placeholder="Pilih program bantuan" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {programs.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {PRESET_AMOUNTS.map(a => (
                      <Button
                        key={a}
                        type="button"
                        variant={amount === a && !customAmount ? "gold" : "outline"}
                        className={`rounded-2xl font-bold h-14 transition-all hover:scale-105 ${
                          amount === a && !customAmount ? 'shadow-lg shadow-gold/20' : ''
                        }`}
                        onClick={() => { setAmount(a); setCustomAmount(""); }}
                      >
                        {formatRupiah(a)}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-gray-400 group-focus-within:text-gold">Rp</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Masukkan nominal donasi..."
                      className="rounded-2xl h-14 pl-12 font-bold text-lg border-gray-200 focus:border-gold"
                      value={customAmount}
                      onChange={e => setCustomAmount(sanitizeNumericInput(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-5 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gold rounded-full" />
                    <Label className="font-bold text-lg">Informasi Donatur</Label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="donor-name" className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Nama Lengkap *</Label>
                      <Input id="donor-name" placeholder="Nama Lengkap" className="rounded-2xl h-14" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donor-phone" className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">No. WhatsApp *</Label>
                      <Input id="donor-phone" placeholder="081234..." className="rounded-2xl h-14" value={phone} onChange={e => setPhone(sanitizeNumericInput(e.target.value))} required />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="donor-email" className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Email (Opsional)</Label>
                    <Input id="donor-email" type="email" placeholder="nama@email.com" className="rounded-2xl h-14" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">Doa atau Pesan</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tuliskan doa atau harapan Anda..." 
                      className="rounded-2xl min-h-[120px] resize-none border-gray-200 p-4 focus:border-gold" 
                      value={message} 
                      onChange={e => setMessage(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-[2rem] border border-dashed border-gray-300 space-y-4">
                  <SustainabilityDonation
                    selectedAmount={sustainabilityAmount}
                    customAmount={sustainabilityCustomAmount}
                    onAmountSelect={(val) => {
                      setSustainabilityAmount(sustainabilityAmount === val ? null : val);
                      if (val) setSustainabilityCustomAmount("");
                    }}
                    onCustomAmountChange={(val) => {
                      const cleanVal = sanitizeNumericInput(val);
                      setSustainabilityCustomAmount(cleanVal);
                      if (parseInt(cleanVal) > 0) setSustainabilityAmount(null);
                    }}
                  />
                  {isSustainabilityInvalid && (
                    <div className="flex items-center gap-2 text-red-500 text-sm font-bold animate-pulse px-2">
                      <AlertCircle className="w-4 h-4" /> Minimal donasi tambahan Rp 2.000
                    </div>
                  )}
                </div>

                <div className="space-y-6 pt-4">
                  <div className="flex flex-col md:flex-row items-center justify-between bg-gold/5 p-8 rounded-[2rem] border-2 border-gold/10 gap-4">
                    <div className="text-center md:text-left">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Total Donasi</span>
                      <span className="text-4xl font-black text-gold leading-none">{formatRupiah(totalAmount)}</span>
                    </div>
                    {isTotalInvalid && (
                      <p className="text-red-600 text-sm italic font-bold max-w-[200px] text-center md:text-right">
                        Silakan masukkan nominal donasi.
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    variant="gold" 
                    className="w-full h-20 text-xl font-black rounded-2xl shadow-xl shadow-gold/30 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                    disabled={isProcessing || isTotalInvalid || isSustainabilityInvalid}
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-6 h-6 animate-spin mr-3" /> Memproses...</>
                    ) : (
                      <><CreditCard className="w-6 h-6 mr-3" /> Donasi Sekarang</>
                    )}
                  </Button>
                  
                  <div className="flex items-center justify-center gap-2 text-gray-400">
                    <Heart className="w-3 h-3 fill-gray-400" />
                    <p className="text-[10px] uppercase tracking-[0.2em] font-black">Secure Payment via Faspay Production</p>
                    <Heart className="w-3 h-3 fill-gray-400" />
                  </div>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}