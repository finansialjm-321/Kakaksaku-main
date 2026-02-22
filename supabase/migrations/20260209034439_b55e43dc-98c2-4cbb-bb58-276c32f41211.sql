-- ==========================================================
-- 0. RESET (HAPUS TABEL & FUNGSI LAMA)
-- ==========================================================
-- PERINGATAN: Ini akan menghapus data dummy yang lama.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();

-- Hapus tabel dengan CASCADE (agar relasi putus otomatis)
DROP TABLE IF EXISTS public.kakasaku_subscriptions CASCADE;
DROP TABLE IF EXISTS public.donations CASCADE;
DROP TABLE IF EXISTS public.kakasaku_packages CASCADE;
DROP TABLE IF EXISTS public.donation_programs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- ==========================================================
-- 1. UTILITIES & CONFIG
-- ==========================================================

-- Fungsi: Cek apakah user adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================================
-- 2. PROFILES (USER & ADMIN)
-- ==========================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')), -- Role User/Admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy:
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Trigger: Otomatis buat profil saat signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'), 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================================
-- 3. DONATION PROGRAMS (Kampanye)
-- ==========================================================

CREATE TABLE public.donation_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  target_amount BIGINT NOT NULL DEFAULT 0,
  collected_amount BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.donation_programs ENABLE ROW LEVEL SECURITY;

-- Policy:
CREATE POLICY "Anyone can view active programs" ON public.donation_programs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert programs" ON public.donation_programs FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update programs" ON public.donation_programs FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete programs" ON public.donation_programs FOR DELETE USING (public.is_admin());


-- ==========================================================
-- 4. KAKASAKU PACKAGES (Paket Rutin)
-- ==========================================================

CREATE TABLE public.kakasaku_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount BIGINT NOT NULL,
  description TEXT,
  benefits TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kakasaku_packages ENABLE ROW LEVEL SECURITY;

-- Policy:
CREATE POLICY "Anyone can view packages" ON public.kakasaku_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage packages" ON public.kakasaku_packages FOR ALL USING (public.is_admin());


-- ==========================================================
-- 5. DONATIONS (Sekali Bayar - Guest & User)
-- ==========================================================

CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_no TEXT NOT NULL UNIQUE,       -- ID Unik Faspay
  program_id UUID REFERENCES public.donation_programs(id),
  user_id UUID REFERENCES auth.users(id), -- Boleh NULL (Guest)
  
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  donor_phone TEXT,
  amount BIGINT NOT NULL,
  message TEXT,
  
  -- Integrasi Faspay
  payment_channel TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending', 
  trx_id TEXT,
  payment_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Policy:
CREATE POLICY "Anyone can create donation" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view all, Users view own" ON public.donations 
FOR SELECT USING (
  public.is_admin() OR 
  (auth.uid() = user_id) OR
  (user_id IS NULL AND bill_no IS NOT NULL) -- Guest bisa lihat by Bill No (opsional)
);


-- ==========================================================
-- 6. SUBSCRIPTIONS (Rutin - Wajib Login)
-- ==========================================================

CREATE TABLE public.kakasaku_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES public.kakasaku_packages(id) NOT NULL,
  
  status TEXT NOT NULL DEFAULT 'active',
  payment_token TEXT,
  last_payment_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.kakasaku_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy:
CREATE POLICY "Users view own sub" ON public.kakasaku_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own sub" ON public.kakasaku_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sub" ON public.kakasaku_subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins view all subs" ON public.kakasaku_subscriptions FOR SELECT USING (public.is_admin());


-- ==========================================================
-- 7. SEED DATA (Data Awal)
-- ==========================================================

INSERT INTO public.donation_programs (title, description, target_amount, collected_amount) VALUES
('Pendidikan Anak Jakarta', 'Bantu biaya sekolah anak kurang mampu.', 50000000, 12500000),
('Makanan Jumat Berkah', 'Berbagi nasi box setiap hari Jumat.', 10000000, 2500000),
('Renovasi Musholla', 'Perbaikan atap musholla yang bocor.', 75000000, 0);

INSERT INTO public.kakasaku_packages (name, amount, description, benefits) VALUES
('Sahabat', 50000, 'Donasi ringan bulanan.', ARRAY['Laporan via Email']),
('Pahlawan', 100000, 'Dampak lebih besar.', ARRAY['Laporan via Email', 'Sertifikat Digital']);