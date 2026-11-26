-- ============================================================================
-- International GoldStars School • MYP 3 Solo Activity Hub & Class Schedule
-- Complete Supabase PostgreSQL Schema, Role Grants, RLS Policies & Seed Data
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DROP TABLE IF EXISTS public.team_bonuses CASCADE;
DROP TABLE IF EXISTS public.point_logs CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.weeks CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.leader_votes CASCADE;
DROP TABLE IF EXISTS public.leader_elections CASCADE;
DROP TABLE IF EXISTS public.app_users CASCADE;

-- 1. APP USERS TABLE
CREATE TABLE public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  username_lower TEXT GENERATED ALWAYS AS (LOWER(username)) STORED UNIQUE,
  phone TEXT,
  phone_normalized TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  role_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_users_username_lower ON public.app_users(username_lower);
CREATE INDEX idx_app_users_phone_normalized ON public.app_users(phone_normalized);

-- 2. SOLO STUDENTS TABLE
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE UNIQUE INDEX idx_weeks_single_active ON public.weeks(is_active) WHERE (is_active = TRUE);

-- 5. POINT LOGS TABLE (Solo Student Scoring)
CREATE TABLE public.point_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
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
CREATE INDEX idx_point_logs_created_at ON public.point_logs(created_at DESC);

-- 6. CLASS SCHEDULES TABLE (Photo Upload + Structured Daily Timetable)
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  entries JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_schedules_single_active ON public.schedules(is_active) WHERE (is_active = TRUE);

-- 7. CLASS LEADER ELECTIONS & VOTES TABLES (Admin-Controlled Whiteboard Voting)
CREATE TABLE public.leader_elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'Weekly Class Leader Vote',
  current_leader TEXT NOT NULL DEFAULT 'Yahyo',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  winner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE public.leader_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES public.leader_elections(id) ON DELETE CASCADE,
  voter_username_lower TEXT NOT NULL,
  candidate TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leader_votes_one_vote_per_user UNIQUE (election_id, voter_username_lower)
);

CREATE INDEX idx_leader_votes_election_id ON public.leader_votes(election_id);

-- 8. STUDENT ABSENCE REPORTS TABLE
CREATE TABLE public.absence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  absence_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_absence_reports_date ON public.absence_reports(absence_date DESC, created_at DESC);
CREATE INDEX idx_absence_reports_user_id ON public.absence_reports(user_id);

-- ============================================================================
-- TABLE & SCHEMA GRANTS FOR SUPABASE API ROLES
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.students, public.subjects, public.weeks, public.point_logs, public.schedules TO anon, authenticated;
REVOKE ALL ON public.app_users FROM anon, authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service_role full access on app_users"
  ON public.app_users FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on students"
  ON public.students FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access on subjects"
  ON public.subjects FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access on weeks"
  ON public.weeks FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access on point_logs"
  ON public.point_logs FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access on schedules"
  ON public.schedules FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow service_role full access on students"
  ON public.students FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full access on subjects"
  ON public.subjects FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full access on weeks"
  ON public.weeks FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full access on point_logs"
  ON public.point_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service_role full access on schedules"
  ON public.schedules FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- SEED DATA: ADMIN, 19 SOLO STUDENTS (+ ACCOUNTS), 7 SUBJECTS & WEEK 1
-- ============================================================================

INSERT INTO public.app_users (username, phone, phone_normalized, password_hash, role) VALUES
  ('Yahyoo_Erikovich', NULL, NULL, 'scrypt$90d198582807636394c51b005d8d2cec$29daa76500aac959de23d6b12f719a2d8d8302f0cafd0fe647e220d1ed4e27ba0c4f4cbde1c6491cafc619245f5b9a9b74bb4f6b149cb1b14e5911986455a02b', 'admin'),
  ('Yasmina', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Charos', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Ezoza', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Diyora', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Fazliya', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Sofiya', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Azam', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Abdulmajid', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Jahongir', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Javhar', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Oybek', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Ansor', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Abdulazim', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Muhammadali', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Abdulqahhor', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Saidakbar', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Emirhan', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Akbarhoja', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student'),
  ('Yahyo', NULL, NULL, 'scrypt$1fa161cc3bec83eb3148b994aec6a1ca$a873f243815c712f8893fdc29798cb929e6a53294f9e82a19de222ed52e9b75ee4f966f7e19548546994f68c281ca5ccc73513ff1fcfc2fdbe7245ef81eaa4f0', 'student');

INSERT INTO public.students (name) VALUES
  ('Yasmina'), ('Charos'), ('Ezoza'), ('Diyora'), ('Fazliya'), ('Sofiya'),
  ('Azam'), ('Abdulmajid'), ('Jahongir'), ('Javhar'), ('Oybek'), ('Ansor'), ('Abdulazim'),
  ('Muhammadali'), ('Abdulqahhor'), ('Saidakbar'), ('Emirhan'), ('Akbarhoja'), ('Yahyo');

INSERT INTO public.subjects (name, award_title, is_duty_category, is_hidden, sort_order) VALUES
  ('Mathematics', 'Math Master', FALSE, FALSE, 1),
  ('Science', 'Science Explorer', FALSE, FALSE, 2),
  ('English Language & Literature', 'English Star', FALSE, FALSE, 3),
  ('Design & IT', 'Design Innovator', FALSE, FALSE, 4),
  ('Individuals & Societies', 'Global Scholar', FALSE, FALSE, 5),
  ('Languages (Russian / Uzbek)', 'Language Laureate', FALSE, FALSE, 6),
  ('Class Duty & Teamwork', 'Responsibility Champion', TRUE, FALSE, 7);

INSERT INTO public.weeks (week_number, name, start_date, end_date, is_active) VALUES
  (
    1,
    'Week 1',
    DATE_TRUNC('week', CURRENT_DATE)::DATE,
    (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days')::DATE,
    TRUE
  );
