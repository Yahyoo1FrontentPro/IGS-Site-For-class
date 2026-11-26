-- ============================================================================
-- International GoldStars School • MYP 3 Activity Hub
-- Complete Supabase PostgreSQL Schema, Constraints, RLS Policies & Seed Data
-- Paste this entire file into the Supabase SQL Editor and click "Run" once.
-- ============================================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables safely if re-running from scratch
DROP TABLE IF EXISTS public.team_bonuses CASCADE;
DROP TABLE IF EXISTS public.point_logs CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.weeks CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.app_users CASCADE;

-- 0. APP USERS TABLE (Accounts: Phone + Username + Scrypt Password Hash + Role)
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  username_lower TEXT GENERATED ALWAYS AS (LOWER(username)) STORED UNIQUE,
  phone TEXT,
  phone_normalized TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_users_username_lower ON public.app_users(username_lower);
CREATE INDEX idx_app_users_phone_normalized ON public.app_users(phone_normalized);

-- 1. TEAMS TABLE
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STUDENTS TABLE
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_team_id ON public.students(team_id);
CREATE INDEX idx_students_active ON public.students(is_active);

-- 3. SUBJECTS TABLE
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  award_title TEXT NOT NULL DEFAULT 'Subject Champion',
  is_duty_category BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. WEEKS TABLE
CREATE TABLE public.weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT weeks_date_order_check CHECK (end_date >= start_date)
);

-- Ensure at most one week is marked active at any time
CREATE UNIQUE INDEX idx_weeks_single_active ON public.weeks(is_active) WHERE (is_active = TRUE);

-- 5. POINT LOGS TABLE
CREATE TABLE public.point_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  week_id UUID NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  points INTEGER NOT NULL CHECK (points <> 0 AND points BETWEEN -10 AND 20),
  category TEXT NOT NULL CHECK (category IN ('Active', 'Star', 'Ace', 'Duty', 'Fair-Play')),
  reason TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_point_logs_week_id ON public.point_logs(week_id);
CREATE INDEX idx_point_logs_student_id ON public.point_logs(student_id);
CREATE INDEX idx_point_logs_team_date ON public.point_logs(team_id, date);
CREATE INDEX idx_point_logs_created_at ON public.point_logs(created_at DESC);

-- 6. TEAM BONUSES TABLE (Team Combo Streaks)
CREATE TABLE public.team_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  week_id UUID NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  points INTEGER NOT NULL DEFAULT 5 CHECK (points > 0),
  reason TEXT NOT NULL DEFAULT 'Team Combo Streak: 100% team participation achieved!',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT team_bonuses_team_id_date_key UNIQUE (team_id, date)
);

CREATE INDEX idx_team_bonuses_week_id ON public.team_bonuses(week_id);
CREATE INDEX idx_team_bonuses_date ON public.team_bonuses(date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Public read-only access for Dashboard, TV Mode, and Reports.
-- app_users is strictly private to service_role (never exposed to browser anon).
-- ============================================================================

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_bonuses ENABLE ROW LEVEL SECURITY;

-- Strict server-only access on app_users
CREATE POLICY "Allow service_role full access on app_users"
  ON public.app_users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public SELECT policies for Hub tables
CREATE POLICY "Allow public read access on teams"
  ON public.teams FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access on students"
  ON public.students FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access on subjects"
  ON public.subjects FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access on weeks"
  ON public.weeks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access on point_logs"
  ON public.point_logs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access on team_bonuses"
  ON public.team_bonuses FOR SELECT
  TO anon, authenticated
  USING (true);

-- Explicit full access policies for service_role
CREATE POLICY "Allow service_role full access on teams"
  ON public.teams FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full access on students"
  ON public.students FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full access on subjects"
  ON public.subjects FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full access on weeks"
  ON public.weeks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full access on point_logs"
  ON public.point_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role full access on team_bonuses"
  ON public.team_bonuses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SEED DATA: PRIMARY ADMIN ACCOUNT, 3 TEAMS, 19 STUDENTS, 7 SUBJECTS & WEEK 1
-- ============================================================================

DO $$
DECLARE
  v_team1_id UUID;
  v_team2_id UUID;
  v_team3_id UUID;
BEGIN
  -- Insert Primary Admin Account (Yahyoo_Erikovich — pre-hashed with scrypt)
  INSERT INTO public.app_users (username, phone, phone_normalized, password_hash, role)
  VALUES (
    'Yahyoo_Erikovich',
    NULL,
    NULL,
    'scrypt$90d198582807636394c51b005d8d2cec$29daa76500aac959de23d6b12f719a2d8d8302f0cafd0fe647e220d1ed4e27ba0c4f4cbde1c6491cafc619245f5b9a9b74bb4f6b149cb1b14e5911986455a02b',
    'admin'
  );

  -- Insert Teams
  INSERT INTO public.teams (name, short_name, color, sort_order)
  VALUES ('Team Inquirers', 'Team 1', '#7C3AED', 1)
  RETURNING id INTO v_team1_id;

  INSERT INTO public.teams (name, short_name, color, sort_order)
  VALUES ('Team Thinkers', 'Team 2', '#2563EB', 2)
  RETURNING id INTO v_team2_id;

  INSERT INTO public.teams (name, short_name, color, sort_order)
  VALUES ('Team Principled', 'Team 3', '#059669', 3)
  RETURNING id INTO v_team3_id;

  -- Insert Team 1 — Team Inquirers (6 members)
  INSERT INTO public.students (name, team_id) VALUES
    ('Yasmina', v_team1_id),
    ('Charos', v_team1_id),
    ('Ezoza', v_team1_id),
    ('Diyora', v_team1_id),
    ('Fazliya', v_team1_id),
    ('Sofiya', v_team1_id);

  -- Insert Team 2 — Team Thinkers (7 members)
  INSERT INTO public.students (name, team_id) VALUES
    ('Azam', v_team2_id),
    ('Abdulmajid', v_team2_id),
    ('Jahongir', v_team2_id),
    ('Javhar', v_team2_id),
    ('Oybek', v_team2_id),
    ('Ansor', v_team2_id),
    ('Abdulazim', v_team2_id);

  -- Insert Team 3 — Team Principled (6 members)
  INSERT INTO public.students (name, team_id) VALUES
    ('Muhammadali', v_team3_id),
    ('Abdulqahhor', v_team3_id),
    ('Saidakbar', v_team3_id),
    ('Emirhan', v_team3_id),
    ('Akbarhoja', v_team3_id),
    ('Yahyo', v_team3_id);

  -- Insert IB MYP 3 Subjects
  INSERT INTO public.subjects (name, award_title, is_duty_category, is_hidden, sort_order) VALUES
    ('Mathematics', 'Math Master', FALSE, FALSE, 1),
    ('Science', 'Science Explorer', FALSE, FALSE, 2),
    ('English Language & Literature', 'English Star', FALSE, FALSE, 3),
    ('Design & IT', 'Design Innovator', FALSE, FALSE, 4),
    ('Individuals & Societies', 'Global Scholar', FALSE, FALSE, 5),
    ('Languages (Russian / Uzbek)', 'Language Laureate', FALSE, FALSE, 6),
    ('Class Duty & Teamwork', 'Responsibility Champion', TRUE, FALSE, 7);

  -- Insert Initial Active Week 1
  INSERT INTO public.weeks (week_number, name, start_date, end_date, is_active) VALUES
    (
      1,
      'Week 1',
      DATE_TRUNC('week', CURRENT_DATE)::DATE,
      (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE,
      TRUE
    );
END $$;
