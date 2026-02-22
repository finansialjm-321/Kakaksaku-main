import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {/* LOGO BARU JAKARTA MENGABDI */}
              <img 
                src="/logo.png" 
                alt="Logo Jakarta Mengabdi" 
                className="w-8 h-8 object-contain" 
              />
              <span className="font-bold text-lg">Jakarta Mengabdi</span>
            </div>
            <p className="text-sm text-secondary-foreground/70">Platform donasi terpercaya untuk warga Jakarta yang peduli sesama.</p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Navigasi</h4>
            <div className="space-y-2 text-sm text-secondary-foreground/70">
              <Link to="/" className="block hover:text-primary transition-colors">Beranda</Link>
              <Link to="/donate" className="block hover:text-primary transition-colors">Donasi</Link>
              <Link to="/kakasaku" className="block hover:text-primary transition-colors">Kakasaku</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Informasi</h4>
            <div className="space-y-2 text-sm text-secondary-foreground/70">
              <p>Tentang Kami</p>
              <p>Kebijakan Privasi</p>
              <p>Syarat & Ketentuan</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Kontak</h4>
            <div className="space-y-2 text-sm text-secondary-foreground/70">
              <p>finansialjm@gmail.com</p>
              <p>+62 898-8803-835</p>
              <p>Jakarta, Indonesia</p>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-8 pt-6 text-center text-sm text-secondary-foreground/50">
          © 2026 Jakarta Mengabdi. Semua hak dilindungi.
        </div>
      </div>
    </footer>
  );
}