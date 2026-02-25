import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";

// Halaman Utama
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Donate from "./pages/Donate";
import Donasi from "./pages/Donasi";
import Tentang from "./pages/Tentang";
import Status from "./pages/Status";
import NotFound from "./pages/NotFound";

// Halaman Admin (Folder: admin)
import AdminDashboard from "./pages/admin/AdminDashboard";
import DonaturData from "./pages/admin/DonaturData";  
import LaporanDonasi from "./pages/admin/LaporanDonasi";  
import ProgramDonasi from "./pages/admin/ProgramDonasi";
import ProgramKakaksakuAdmin from "./pages/admin/ProgramKakaksaku";

// Halaman Kakasaku (Folder: Kakasaku)
import KakasakuDashboard from "./pages/Kakasaku/KakasakuDashboard";
import KakasakuLanding from "./pages/Kakasaku/KakasakuLanding";
import KakasakuPackages from "./pages/Kakasaku/KakasakuPackages";
import KakasakuPayBill from "./pages/Kakasaku/KakasakuPayBill";
import KakasakuHistory from "./pages/Kakasaku/KakasakuHistory";
import { i } from "node_modules/vite/dist/node/types.d-aGj9QkWt";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/donasi" element={<Donasi />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/tentang" element={<Tentang />} />
              <Route path="/status" element={<Status />} />

              {/* Kakasaku Routes */}
              <Route path="/kakasaku" element={<KakasakuLanding />} />
              <Route path="/kakasaku/dashboard" element={<KakasakuDashboard />} />
              <Route path="/kakasaku/paket" element={<KakasakuPackages />} />
              <Route path="/kakasaku/bayar-tagihan" element={<KakasakuPayBill />} />
              <Route path="/kakasaku/riwayat" element={<KakasakuHistory />} />``

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/donatur" element={<DonaturData />} />
              <Route path="/admin/laporan" element={<LaporanDonasi />} />
              <Route path="/admin/program-donasi" element={<ProgramDonasi />} />
              <Route path="/admin/program" element={<ProgramKakaksakuAdmin />} />


              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;