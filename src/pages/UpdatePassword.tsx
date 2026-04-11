import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UpdatePassword() {
  const navigate = useNavigate();
  
  // State Management
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Cek apakah user beneran masuk lewat link dari email
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event == "PASSWORD_RECOVERY") {
        // User berhasil masuk via link reset password, biarkan lanjut
      }
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi dasar
    if (password.length < 6) {
      setMessage({ type: "error", text: "Password minimal harus 6 karakter ya." });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Password dan konfirmasinya nggak cocok nih." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // Fungsi Supabase buat update password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setIsSuccess(true);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: "Terjadi kesalahan sistem. Coba lagi." });
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
        {!isSuccess ? (
          <>
            {/* Header Form */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Buat Password Baru
              </h1>
              <p className="text-gray-500 text-sm">
                Bikin password baru yang kuat biar akun kamu tetep aman. Jangan dikasih tau siapa-siapa ya!
              </p>
            </div>

            {/* Notifikasi Error */}
            {message && message.type === "error" && (
              <div className="p-3 rounded-lg mb-6 text-sm bg-red-50 text-red-700">
                {message.text}
              </div>
            )}

            {/* Form Utama */}
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              {/* Input Password Baru */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Password Baru
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Input Konfirmasi Password */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Ulangi Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-xl bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                      confirmPassword && password !== confirmPassword 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-100 focus:ring-black'
                    }`}
                    placeholder="Ketik ulang password baru"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!password || !confirmPassword || loading}
                className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Password Baru"}
              </button>
            </form>
          </>
        ) : (
          /* Tampilan Kalau Sukses Update Password */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 p-4 rounded-full">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Update Berhasil!</h2>
            <p className="text-gray-500 text-sm mb-8 px-4">
              Password kamu udah berhasil diganti. Sekarang kamu bisa login lagi pakai password yang baru.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-black text-white font-semibold py-3.5 rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              Lanjut ke Login <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}