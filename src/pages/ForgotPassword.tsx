import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, ShieldCheck, RefreshCcw, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // State untuk Math Captcha
  const [captchaNum1, setCaptchaNum1] = useState(0);
  const [captchaNum2, setCaptchaNum2] = useState(0);
  const [captchaInput, setCaptchaInput] = useState("");

  // Bikin angka random buat captcha pas pertama kali load atau pas di-refresh
  const generateCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 10) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 10) + 1);
    setCaptchaInput("");
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validasi Captcha
    if (parseInt(captchaInput) !== captchaNum1 + captchaNum2) {
      setMessage({ type: "error", text: "Jawaban matematika salah. Silakan coba lagi biar kita tau kamu bukan robot!" });
      generateCaptcha();
      return;
    }

    if (!email) {
      setMessage({ type: "error", text: "Email tidak boleh kosong." });
      return;
    }

    setLoading(true);
    try {
      // Fungsi Supabase untuk kirim email reset password
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Redirect URL ini bakal ngarahin user setelah mereka klik link di email
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setMessage({ 
        type: "success", 
        text: "Mantap! Link reset password udah dikirim. Coba cek inbox atau folder spam di email kamu ya." 
      });
      // Kosongin form setelah sukses
      setEmail("");
      generateCaptcha();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Gagal mengirim link reset password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6 text-[#1A1A1A]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden">
          
          {/* Ornamen Background */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-40 h-40 bg-gold/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            {/* Tombol Back */}
            <a href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gold transition-colors mb-8">
              <ArrowLeft size={16} />
              Kembali ke Login
            </a>

            <h1 className="text-3xl font-black tracking-tight mb-2">Lupa Password?</h1>
            <p className="text-sm font-medium text-gray-500 mb-8 leading-relaxed">
              Tenang aja, masukin email kamu yang terdaftar di bawah, nanti kita kirimin link buat bikin password baru.
            </p>

            {/* Alert Message */}
            {message && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl mb-6 text-sm font-bold border ${
                  message.type === "success" 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-red-50 text-red-600 border-red-200"
                }`}
              >
                {message.text}
              </motion.div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-5">
              {/* Input Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    placeholder="contoh@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-gold/30 focus:shadow-sm transition-all text-sm font-bold"
                  />
                </div>
              </div>

              {/* Input Custom Captcha */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-gold" />
                    Verifikasi Keamanan
                  </label>
                  <button 
                    type="button" 
                    onClick={generateCaptcha}
                    className="text-[10px] font-bold text-gray-400 hover:text-gold flex items-center gap-1"
                  >
                    <RefreshCcw size={10} /> Ganti Angka
                  </button>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 flex items-center justify-center bg-gold/10 border border-gold/20 text-gold font-black text-lg rounded-2xl px-6 py-4 select-none min-w-[100px]">
                    {captchaNum1} + {captchaNum2}
                  </div>
                  <input 
                    type="number" 
                    placeholder="Hasil?"
                    value={captchaInput}
                    onChange={(e) => setCaptchaInput(e.target.value)}
                    required
                    className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:bg-white focus:border-gold/30 focus:shadow-sm transition-all text-sm font-bold text-center"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 mt-4 bg-[#1A1A1A] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-lg shadow-black/5"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Memproses...
                  </>
                ) : (
                  "Kirim Link Reset"
                )}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}