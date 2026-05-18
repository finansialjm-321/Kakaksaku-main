-- ==========================================================
-- CREATE SITE_SETTINGS TABLE
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value_text TEXT,
  value_bool BOOLEAN,
  value_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Admins only
CREATE POLICY "Admins can view settings" ON public.site_settings FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert settings" ON public.site_settings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update settings" ON public.site_settings FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete settings" ON public.site_settings FOR DELETE USING (public.is_admin());

-- Allow public read for batch mode
CREATE POLICY "Public can read batch mode" ON public.site_settings FOR SELECT USING (key = 'kakaksaku_batch_mode');

-- ==========================================================
-- ADD BATCH COLUMNS TO EXISTING TABLES
-- ==========================================================

-- Add batch column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS kakaksaku_batch TEXT DEFAULT 'batch1';

-- Add batch and amount columns to kakasaku_subscriptions
ALTER TABLE public.kakasaku_subscriptions 
ADD COLUMN IF NOT EXISTS batch TEXT DEFAULT 'batch1';

ALTER TABLE public.kakasaku_subscriptions 
ADD COLUMN IF NOT EXISTS amount BIGINT DEFAULT 0;

-- ==========================================================
-- SEED DEFAULT SITE SETTINGS
-- ==========================================================

INSERT INTO public.site_settings (key, value_text) 
VALUES ('kakaksaku_batch_mode', 'both')
ON CONFLICT (key) DO NOTHING;
