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
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import SustainabilityDonation from "@/components/SustainabilityDonation";

interface Program {
  id: string;
  title: string;
}

const amounts = [25000, 50000, 100000, 250000, 500000, 1000000];

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function generateBillNo() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `DON-${dateStr}-${random}`;
}

export default function Donate() {
  const [searchParams] = useSearchParams();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState(searchParams.get("program") || "");
  const [amount, setAmount] = useState(100000);
  const [customAmount, setCustomAmount] = useState("");
  const [sustainabilityAmount, setSustainabilityAmount] = useState<number | null>(null);
  const [sustainabilityCustomAmount, setSustainabilityCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("donation_programs").select("id, title").then(({ data }) => {
      if (data) setPrograms(data);
    });
  }, []);

  const sanitizeNumericInput = (val: string) => {
    return val.replace(/\D/g, "").replace(/^0+/, "");
  };

  const finalAmount = customAmount ? parseInt(customAmount) : amount;
  const sustainabilityFinalAmount = sustainabilityCustomAmount ? parseInt(sustainabilityCustomAmount) : (sustainabilityAmount || 0);
  const totalAmount = (isNaN(finalAmount) ? 0 : finalAmount) + (isNaN(sustainabilityFinalAmount) ? 0 : sustainabilityFinalAmount);

  const isSustainabilityInvalid = sustainabilityFinalAmount > 0 && sustainabilityFinalAmount < 2000;
  const isTotalInvalid = totalAmount < 10000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isTotalInvalid) {
      toast({ title: "Donasi Kurang", description: "Total donasi minimal Rp 10.000", variant: "destructive" });
      return;
    }
    if (isSustainabilityInvalid) {
      toast({ title: "Opsi Tambahan Kurang", description: "Donasi keberlanjutan minimal Rp 2.000", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    const billNo = generateBillNo();
    const programObj = programs.find(p => p.id === selectedProgram);
    const programTitle = programObj ? programObj.title : "Donasi Umum";

    try {
      // 1. Simpan ke database dengan parameter Mandatory Faspay (bill_total) & status pending
      const { error: dbError } = await supabase
        .from("donations")
        .insert({
          bill_no: billNo,
          bill_total: totalAmount, 
          donor_name: name.trim(),
          donor_email: email.trim() || null,
          donor_phone: phone.trim() || null,
          program_id: selectedProgram || null,
          amount: totalAmount, 
          sustainability_amount: sustainabilityFinalAmount,
          message: message.trim() || null,
          payment_status: 'pending',
          tipe_donasi: 'umum'
        });

      if (dbError) throw dbError;

      // 2. Panggil Edge Function untuk minta link bayar ke Faspay
      const { data: faspayData, error: faspayError } = await supabase.functions.invoke('swift-api', {
        body: { 
          action: 'request_payment',
          payment_type: 'umum',
          bill_no: billNo,
          bill_total: totalAmount, 
          amount: totalAmount,
          cust_name: name.trim(),
          email: email.trim() || "donor@jakarta-mengabdi.com", 
          phone: phone.trim() || "08123456789", 
          program_name: programTitle
        }
      });

      if (faspayError || !faspayData?.redirect_url) {
        throw new Error(faspayError?.message || faspayData?.response_desc || "Gagal mendapatkan link pembayaran");
      }

      // 3. UPDATE TRX_ID DARI FASPAY KE DATABASE
      // Ini yang bikin status bisa berubah otomatis jadi success nanti
      if (faspayData.trx_id) {
        const { error: updateError } = await supabase
          .from("donations")
          .update({ 
            trx_id: faspayData.trx_id 
          })
          .eq("bill_no", billNo);

        if (updateError) {
          console.error("Gagal update trx_id:", updateError);
        }
      }

      // 4. Redirect ke halaman Xpress Faspay
      window.location.href = faspayData.redirect_url;

    } catch (err: any) {
      toast({ title: "Gagal", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-[#1A1A1A]">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-card border-t-4 border-t-gold rounded-[2rem] overflow-hidden">
            <CardContent className="p-6 md:p-10 space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-foreground">Kirim Kebaikan</h1>
                <p className="text-muted-foreground">Setiap rupiah yang Anda berikan sangat berarti bagi mereka.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label className="font-bold text-base">Pilih Program & Nominal</Label>
                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger className="rounded-xl border-gray-200 py-6">
                      <SelectValue placeholder="Pilih program bantuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amounts.map(a => (
                      <Button
                        key={a}
                        type="button"
                        variant={amount === a && !customAmount ? "gold" : "outline"}
                        className={`rounded-xl font-bold py-6 transition-all ${amount === a && !customAmount ? 'scale-105 shadow-md shadow-gold/20' : ''}`}
                        onClick={() => { setAmount(a); setCustomAmount(""); }}
                      >
                        {formatRupiah(a)}
                      </Button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="Masukkan nominal lainnya..."
                      className="rounded-xl py-6 pl-12 font-bold"
                      value={customAmount}
                      onChange={e => setCustomAmount(sanitizeNumericInput(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="font-bold text-base">Informasi Donatur</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="donor-name" className="text-xs uppercase tracking-widest text-gray-500">Nama Lengkap *</Label>
                      <Input id="donor-name" placeholder="Nama Lengkap" className="rounded-xl py-6" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donor-phone" className="text-xs uppercase tracking-widest text-gray-500">No. WhatsApp *</Label>
                      <Input id="donor-phone" placeholder="0812..." className="rounded-xl py-6" value={phone} onChange={e => setPhone(sanitizeNumericInput(e.target.value))} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donor-email" className="text-xs uppercase tracking-widest text-gray-500">Email (Opsional)</Label>
                    <Input id="donor-email" type="email" placeholder="nama@email.com" className="rounded-xl py-6" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="font-bold text-base">Pesan Doa (Opsional)</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tuliskan doa atau harapan Anda..." 
                    className="rounded-xl min-h-[100px] resize-none" 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                  />
                </div>

                <div className="bg-muted/30 p-5 rounded-2xl border border-dashed border-gray-300">
                  <SustainabilityDonation
                    selectedAmount={sustainabilityAmount}
                    customAmount={sustainabilityCustomAmount}
                    onAmountSelect={(val) => {
                      if (sustainabilityAmount === val) setSustainabilityAmount(null);
                      else { setSustainabilityAmount(val); setSustainabilityCustomAmount(""); }
                    }}
                    onCustomAmountChange={(val) => {
                      const cleanVal = sanitizeNumericInput(val);
                      setSustainabilityCustomAmount(cleanVal);
                      if (parseInt(cleanVal) > 0) setSustainabilityAmount(null);
                    }}
                  />
                  {isSustainabilityInvalid && (
                    <div className="flex items-center gap-2 mt-3 text-red-500 text-xs font-bold animate-pulse">
                      <AlertCircle className="w-4 h-4" />
                      Minimal donasi keberlanjutan adalah Rp 2.000
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <div className="flex flex-col md:flex-row items-center justify-between bg-gold/5 p-6 rounded-2xl border-2 border-gold/20 gap-4">
                    <div>
                      <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Total Pembayaran</span>
                      <span className="text-4xl font-black text-gold leading-none">{formatRupiah(totalAmount)}</span>
                    </div>
                    {isTotalInvalid && (
                      <p className="text-red-500 text-xs italic font-bold max-w-[200px] text-center md:text-right">Total keseluruhan minimal Rp 10.000.</p>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="gold" 
                  className="w-full py-8 text-xl font-black rounded-2xl shadow-xl shadow-gold/30 transition-all hover:scale-[1.01] active:scale-[0.99]" 
                  size="lg" 
                  disabled={isProcessing || isTotalInvalid || isSustainabilityInvalid}
                >
                  {isProcessing ? (
                    <><Loader2 className="w-6 h-6 animate-spin mr-2" /> Memproses...</>
                  ) : (
                    <><CreditCard className="w-6 h-6 mr-2" /> Donasi Sekarang</>
                  )}
                </Button>
                
                <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest font-bold">Secure Payment via Faspay</p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}