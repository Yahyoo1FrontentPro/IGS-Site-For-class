-- ============================================================================
-- Non-Destructive Migration v3 for IGS MYP 3 Activity Hub
-- Run this in Supabase SQL Editor to enable permanent storage for:
--   1. Daily Roll-Call Attendance (public.roll_calls)
--   2. Teacher No-Show & Cancelled Lessons Log (public.lesson_incidents)
--   3. Homework Assignments per Subject (public.homework_assignments)
-- ============================================================================

-- 1. DAILY ROLL-CALL TABLE
CREATE TABLE IF NOT EXISTS public.roll_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roll_date DATE NOT NULL,
  student_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  note TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT roll_calls_unique_date_student UNIQUE (roll_date, student_id)
);

CREATE INDEX IF NOT EXISTS idx_roll_calls_date
  ON public.roll_calls(roll_date DESC, student_name ASC);

-- 2. TEACHER NO-SHOW & CANCELLED CLASSES LOG TABLE
CREATE TABLE IF NOT EXISTS public.lesson_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_date DATE NOT NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('teacher_noshow', 'class_cancelled')),
  subject_name TEXT NOT NULL,
  teacher_name TEXT,
  period_label TEXT,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_incidents_date
  ON public.lesson_incidents(incident_date DESC, created_at DESC);

-- 3. HOMEWORK ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.homework_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  link_url TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homework_due_date
  ON public.homework_assignments(due_date ASC, created_at DESC);

-- 4. GRANTS & ROW LEVEL SECURITY
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.homework_assignments TO anon, authenticated;
GRANT ALL PRIVILEGES ON public.roll_calls, public.lesson_incidents, public.homework_assignments TO service_role;
REVOKE ALL ON public.roll_calls, public.lesson_incidents FROM anon, authenticated;

ALTER TABLE public.roll_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roll_calls'
      AND policyname = 'Allow service_role full access on roll_calls'
  ) THEN
    CREATE POLICY "Allow service_role full access on roll_calls"
      ON public.roll_calls FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lesson_incidents'
      AND policyname = 'Allow service_role full access on lesson_incidents'
  ) THEN
    CREATE POLICY "Allow service_role full access on lesson_incidents"
      ON public.lesson_incidents FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'homework_assignments'
      AND policyname = 'Allow public read access on homework_assignments'
  ) THEN
    CREATE POLICY "Allow public read access on homework_assignments"
      ON public.homework_assignments FOR SELECT TO anon, authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'homework_assignments'
      AND policyname = 'Allow service_role full access on homework_assignments'
  ) THEN
    CREATE POLICY "Allow service_role full access on homework_assignments"
      ON public.homework_assignments FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
