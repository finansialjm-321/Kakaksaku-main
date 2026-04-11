import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, UserCheck, Shield, 
  Search, Calendar, Mail, 
  Phone, Loader2, Briefcase, 
  UserCircle, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminSidebar, { MobileHeader } from "@/components/AdminSidebar"; 

export default function AkunKakasaku() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filterNama, setFilterNama] = useState("");
  const [loading, setLoading] = useState(true);
  
  // STATE SIDEBAR: Menjamin sinkronisasi margin konten utama
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mengambil data dari tabel profiles sesuai permintaan
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      console.error("Gagal mengambil data akun pendaftar:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  // Statistik ringkasan akun
  const stats = {
    total: profiles.length,
    admin: profiles.filter(p => p.role === 'admin').length,
    donatur: profiles.filter(p => p.role === 'donatur').length,
  };

  const filtered = profiles.filter(p => 
    p.nama_lengkap?.toLowerCase().includes(filterNama.toLowerCase()) ||
    p.email?.toLowerCase().includes(filterNama.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR DENGAN KONTROL STATE DINAMIS */}
      <AdminSidebar 
        isMobileOpen={isMobileMenuOpen} 
        setIsMobileOpen={setIsMobileMenuOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      <div className="flex-grow flex flex-col min-w-0 transition-all duration-500">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        {/* MAIN CONTENT: Margin-left menyesuaikan lebar sidebar */}
        <main className={`flex-grow transition-all duration-500 pt-20 md:pt-8 p-6 md:p-12 space-y-10 ${
          isCollapsed ? "md:ml-20" : "md:ml-64"
        }`}>
          
          {/* STATS CARDS - Diperbesar agar lega */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 transition-all hover:shadow-md">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-500 shadow-inner"><UserCircle size={32}/></div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Pendaftar</p>
                <p className="text-4xl font-black text-gray-900">{stats.total}</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 transition-all hover:shadow-md">
              <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 shadow-inner"><UserCheck size={32}/></div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Akun Donatur</p>
                <p className="text-4xl font-black text-orange-600">{stats.donatur}</p>
              </div>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 transition-all hover:shadow-md">
              <div className="w-16 h-16 bg-zinc-100 rounded-3xl flex items-center justify-center text-zinc-600 shadow-inner"><Shield size={32}/></div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Akun Admin</p>
                <p className="text-4xl font-black text-zinc-700">{stats.admin}</p>
              </div>
            </div>
          </div>

          {/* SEARCH BOX */}
          <div className="bg-white/50 p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 w-6 h-6" />
              <input 
                placeholder="Cari nama atau email pendaftar akun Kakak Saku..." 
                className="w-full pl-14 pr-8 py-5 rounded-[1.5rem] bg-gray-50 font-bold text-lg outline-none border-2 border-transparent focus:border-orange-500/20 transition-all shadow-inner"
                onChange={(e) => setFilterNama(e.target.value)} 
              />
            </div>
          </div>

          {/* TABLE DATA PENGGUNA */}
          <div className="bg-white rounded-[3rem] shadow-2xl border border-gray-50 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? ( 
                <div className="py-32 flex justify-center"><Loader2 className="animate-spin text-orange-500 w-12 h-12" /></div> 
              ) : (
                <table className="w-full text-left min-w-[1200px]">
                  <thead>
                    <tr className="bg-gray-50/50 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      <th className="px-12 py-8">Nama Lengkap</th>
                      <th className="px-12 py-8">Kontak</th>
                      <th className="px-12 py-8">Kesibukan</th>
                      <th className="px-12 py-8 text-center">Role</th>
                      <th className="px-12 py-8">Tgl Bergabung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition-all group">
                        <td className="px-12 py-8">
                          <p className="text-xl font-black text-[#1A1A1A] group-hover:text-orange-600 transition-colors mb-1">
                            {user.nama_lengkap || 'Pendaftar Baru'}
                          </p>
                          <span className="text-[10px] font-mono text-gray-300 uppercase tracking-tighter">ID: {user.id.split('-')[0]}...</span>
                        </td>
                        <td className="px-12 py-8 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
                            <Mail size={14} className="text-gray-400" /> {user.email || '-'}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 font-bold">
                            <Phone size={14} className="text-gray-400" /> {user.no_wa || '-'}
                          </div>
                        </td>
                        <td className="px-12 py-8">
                          <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                            <Briefcase size={14} className="text-gray-400" />
                            {user.kesibukan || '-'}
                          </div>
                        </td>
                        <td className="px-12 py-8 text-center">
                          <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                            user.role === 'admin' 
                            ? 'bg-zinc-800 text-white shadow-lg shadow-zinc-200' 
                            : 'bg-orange-100 text-orange-600'
                          }`}>
                            {user.role || 'donatur'}
                          </span>
                        </td>
                        <td className="px-12 py-8">
                          <div className="flex items-center gap-2 text-gray-700 font-black text-sm">
                            <Calendar size={16} className="text-orange-500" />
                            {formatDate(user.created_at)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}