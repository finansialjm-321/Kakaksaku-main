import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // State Management
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(60); // Timer 60 detik

  // Efek untuk Timer Mundur OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "otp" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Fungsi 1: Cek Database (Via RPC) & Kirim OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // 1. Cek ke Supabase pakai fungsi RPC 'cek_email_terdaftar'
      const { data: isTerdaftar, error: rpcError } = await supabase.rpc('cek_email_terdaftar', {
        email_input: email
      });

      if (rpcError) throw rpcError;

      // 2. Kalau email nggak ada, stop di sini & munculin pesan error
      if (!isTerdaftar) {
        setMessage({ type: "error", text: "Email tidak terdaftar di sistem kami." });
        setLoading(false);
        return;
      }

      // 3. Kalau email ada, baru tembak Auth buat kirim OTP
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email);

      if (authError) throw authError;

      // 4. Sukses, pindah ke form OTP
      setStep("otp");
      setTimeLeft(60); // Reset timer ke 60 detik kalau resend
      setMessage({ type: "success", text: "Kode OTP telah dikirim ke email kamu." });
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Terjadi kesalahan sistem." });
    } finally {
      setLoading(false);
    }
  };

  // Fungsi 2: Validasi OTP ke Supabase
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "recovery",
      });

      if (error) throw error;

      if (data.session) {
        // Jika OTP benar, arahkan user ke halaman ganti password
        navigate("/update-password");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: "Kode OTP salah atau sudah kedaluwarsa." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
      >
        {/* Tombol Kembali */}
        <button
          onClick={() => step === "otp" ? setStep("email") : navigate("/login")}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step === "otp" ? "Kembali ganti email" : "Kembali ke Login"}
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Lupa Password?
          </h1>
          <p className="text-gray-500 text-sm">
            {step === "email" 
              ? "Tenang aja, masukin email kamu yang terdaftar di bawah. Kita bakal kirim kode OTP."
              : `Masukkan 6-digit kode OTP yang telah kami kirimkan ke ${email}`
            }
          </p>
        </div>

        {/* Notifikasi Message */}
        {message && (
          <div className={`p-3 rounded-lg mb-6 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message.text}
          </div>
        )}

        {/* FORM 1: INPUT EMAIL */}
        {step === "email" && (
          <form onSubmit={handleSendOTP} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                  placeholder="contoh@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!email || loading}
              className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kirim Kode OTP"}
            </button>
          </form>
        )}

        {/* FORM 2: INPUT OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between">
                <span>Kode OTP</span>
                <span className={`${timeLeft === 0 ? 'text-red-500' : 'text-blue-500'}`}>
                  {timeLeft > 0 ? `00:${timeLeft.toString().padStart(2, '0')}` : 'Waktu habis'}
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Hanya angka
                  className="block w-full pl-10 pr-3 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-900 tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                  placeholder="123456"
                />
              </div>
            </div>

            <button
              type="submit"
              // Button nyala kalau OTP udah 6 digit dan tidak loading
              disabled={otp.length !== 6 || loading || timeLeft === 0}
              className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verifikasi & Ganti Password"}
            </button>
            
            {/* Tombol Resend OTP */}
            {timeLeft === 0 && (
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full text-sm font-semibold text-gray-600 hover:text-black transition-colors"
              >
                Kirim Ulang Kode OTP
              </button>
            )}
          </form>
        )}
      </motion.div>
    </div>
  );
}