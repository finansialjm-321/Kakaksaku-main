import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, 
  Users, 
  Heart, 
  FileText, 
  Settings, 
  LogOut,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin/dashboard" },
  { icon: Users, label: "Data Donatur", href: "/admin/donatur" },
  { icon: Heart, label: "Program Kakaksaku", href: "/admin/program" },
  { icon: FileText, label: "Laporan Donasi", href: "/admin/laporan" },
  { icon: Settings, label: "Program Donasi", href: "/admin/program-donasi" },
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Gagal keluar");
    } else {
      toast.success("Berhasil keluar dari panel Admin");
      navigate("/login");
    }
  };

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-[#111111] text-white transition-all duration-500 z-50 flex flex-col border-r border-white/5 shadow-2xl ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header Sidebar */}
      <div className="p-6 flex items-center justify-between border-b border-white/5 bg-black/20">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-400 flex items-center justify-center shadow-lg shadow-white/10">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <span className="font-black text-sm tracking-widest uppercase text-white">Admin JM</span>
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl bg-white/5 hover:bg-zinc-400 hover:text-black transition-all duration-300 text-zinc-400 shadow-inner"
        >
          <ChevronRight className={`w-4 h-4 transition-transform duration-500 ${isCollapsed ? "" : "rotate-180"}`} />
        </button>
      </div>

      {/* Navigasi: Efek Silver saat Aktif & Tulisan Putih */}
      <nav className="flex-grow p-4 space-y-2.5 mt-6">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative ${
                isActive 
                  ? "bg-zinc-500 text-white font-extrabold shadow-lg shadow-white/5 translate-x-1" 
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-300 ${
                isActive ? "scale-110 text-white" : "group-hover:scale-110 group-hover:text-zinc-300"
              }`} />
              
              {!isCollapsed && (
                <span className={`text-sm tracking-wide transition-all duration-300 ${
                  isActive ? "translate-x-1" : "group-hover:translate-x-1"
                }`}>
                  {item.label}
                </span>
              )}

              {/* Indikator Silver di Samping Menu Aktif */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / Keluar */}
      <div className="p-4 bg-black/40 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all duration-300 group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          {!isCollapsed && <span className="text-sm font-black tracking-widest uppercase">Keluar</span>}
        </button>
      </div>
    </aside>
  );
}