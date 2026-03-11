import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard,
  UserCheck,
  FileSpreadsheet, 
  PieChart, 
  Users, 
  Heart, 
  FileText, 
  Settings, 
  LogOut,
  ChevronRight,
  ShieldCheck,
  X,
  Menu
} from "lucide-react";
import { toast } from "sonner";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin/dashboard" },
  { icon: PieChart, label: "Data Analitik", href: "/admin/analitik" },
  { icon: Users, label: "Data Donatur", href: "/admin/donatur" },
  { icon: Heart, label: "Program Kakaksaku", href: "/admin/program" },
  { icon: UserCheck, label: "Akun Kakak Saku", href: "/admin/akun-kakak-saku" },
  { icon: FileSpreadsheet, label: "Laporan Kakaksaku", href: "/admin/laporan-kakasaku" },
  { icon: FileText, label: "Laporan Donasi", href: "/admin/laporan" },
  { icon: Settings, label: "Program Donasi", href: "/admin/program-donasi" },
];

// REVISI: Interface sekarang mendukung kontrol dari luar (Halaman Utama)
interface SidebarProps {
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

export default function AdminSidebar({ 
  isMobileOpen = false, 
  setIsMobileOpen = () => {},
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = isCollapsed ?? internalCollapsed;
  const setCollapsed = setIsCollapsed ?? setInternalCollapsed;
  const location = useLocation();
  const navigate = useNavigate();

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
    <>
      {/* 1. MOBILE OVERLAY */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden transition-opacity duration-300" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 2. SIDEBAR CONTAINER */}
      <aside 
        className={`fixed left-0 top-0 h-screen bg-[#111111] text-white transition-all duration-500 z-[70] flex flex-col border-r border-white/5 shadow-2xl ${
          // Logic Lebar Mobile
          isMobileOpen ? "translate-x-0 w-[280px]" : "-translate-x-full md:translate-x-0"
        } ${
          // Logic Lebar Desktop (Laptop)
          !isMobileOpen && collapsed ? "md:w-20" : "md:w-64"
        }`}
      >
        {/* Header: Logo & Toggle */}
        <div className="p-6 flex items-center justify-between border-b border-white/5 bg-black/20 min-h-[80px]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center shadow-lg shrink-0">
              <ShieldCheck className="w-6 h-6 text-black" />
            </div>
            {(!collapsed || isMobileOpen) && (
              <span className="font-black text-sm tracking-widest uppercase text-white truncate">
                Admin JM
              </span>
            )}
          </div>

          {/* Desktop Toggle Button */}
          <button 
            className="hidden md:flex p-2 rounded-xl bg-white/5 hover:bg-zinc-400 hover:text-black transition-all duration-300 text-zinc-400"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronRight className={`w-4 h-4 transition-transform duration-500 ${collapsed ? "" : "rotate-180"}`} />
          </button>

          {/* Mobile Close Button */}
          <button 
            className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-zinc-400 hover:text-black transition-all"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-grow p-4 space-y-2 mt-4 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileOpen(false)} 
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                  isActive 
                    ? "bg-zinc-500 text-white font-extrabold shadow-lg shadow-zinc-500/20 translate-x-1" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                  isActive ? "scale-110 text-white" : "group-hover:scale-110 group-hover:text-zinc-300"
                }`} />
                
                {(!collapsed || isMobileOpen) && (
                  <span className="text-sm tracking-wide truncate">
                    {item.label}
                  </span>
                )}

                {/* Indikator Active */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: Logout */}
        <div className="p-4 bg-black/40 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
            {(!collapsed || isMobileOpen) && (
              <span className="text-sm font-black tracking-widest uppercase">Keluar</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

/**
 * 3. MOBILE HEADER (Menempel di atas HP)
 */
export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-[40] bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between shadow-sm">
      <button 
        onClick={onMenuClick}
        className="p-2.5 rounded-2xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all text-gray-700"
      >
        <Menu className="w-6 h-6" />
      </button>
      
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-500 flex items-center justify-center shadow-md">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-xs tracking-[0.2em] uppercase text-gray-800">Admin JM</span>
      </div>
      
      <div className="w-10"></div>
    </div>
  );
}