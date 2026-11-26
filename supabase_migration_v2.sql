-- ============================================================================
-- Non-Destructive Migration v2 for IGS MYP 3 Activity Hub
-- Run this in Supabase SQL Editor to enable permanent storage for:
--   1. Custom Role Titles (app_users.role_title)
--   2. Student Absence Reports (public.absence_reports)
-- ============================================================================

-- 1. Add custom role_title column to app_users (safe if already exists)
ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS role_title TEXT;

UPDATE public.app_users
  SET role_title = 'Class Leader'
  WHERE username_lower = 'yahyoo_erikovich' AND role_title IS NULL;

-- 2. Create absence_reports table for student attendance notifications
CREATE TABLE IF NOT EXISTS public.absence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  absence_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_absence_reports_date
  ON public.absence_reports(absence_date DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_absence_reports_user_id
  ON public.absence_reports(user_id);

-- 3. Grants & Row Level Security
GRANT ALL PRIVILEGES ON public.absence_reports TO service_role;
REVOKE ALL ON public.absence_reports FROM anon, authenticated;

ALTER TABLE public.absence_reports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'absence_reports'
      AND policyname = 'Allow service_role full access on absence_reports'
  ) THEN
    CREATE POLICY "Allow service_role full access on absence_reports"
      ON public.absence_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
