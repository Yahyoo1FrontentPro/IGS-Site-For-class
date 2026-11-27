export type PointCategory = "Active" | "Star" | "Ace" | "Duty" | "Fair-Play";

export type UserRole = "admin" | "student";

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export interface ScheduleLesson {
  id: string;
  day: DayOfWeek;
  period: number;
  time: string;
  subject: string;
  roomOrTeacher?: string;
}

export interface ClassSchedule {
  id: string;
  title: string;
  image_url: string | null;
  entries: ScheduleLesson[];
  is_active: boolean;
  created_at: string;
}

export interface SessionUser {
  id: string;
  username: string;
  phone: string | null;
  role: UserRole;
  role_title?: string | null;
}

export interface AppUserSummary {
  id: string;
  username: string;
  phone: string | null;
  role: UserRole;
  role_title?: string | null;
  created_at: string;
}

export type AbsenceStatus = "pending" | "acknowledged";

export interface AbsenceReport {
  id: string;
  user_id: string;
  username: string;
  absence_date: string;
  reason: string;
  status: AbsenceStatus;
  admin_note: string | null;
  created_at: string;
}

export type AppLanguage = "en" | "ru";

export type RollCallStatus = "present" | "absent" | "late" | "excused";

export interface RollCallEntry {
  id: string;
  roll_date: string;
  student_id: string;
  student_name: string;
  status: RollCallStatus;
  note: string | null;
  recorded_by: string | null;
  created_at: string;
}

export type LessonIncidentType = "teacher_noshow" | "class_cancelled";

export interface LessonIncident {
  id: string;
  incident_date: string;
  incident_type: LessonIncidentType;
  subject_name: string;
  teacher_name: string | null;
  period_label: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface HomeworkAssignment {
  id: string;
  subject_name: string;
  title: string;
  description: string;
  due_date: string;
  link_url: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  award_title: string;
  is_duty_category: boolean;
  is_hidden: boolean;
  sort_order: number;
  created_at: string;
}

export interface Week {
  id: string;
  week_number: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export interface PointLog {
  id: string;
  student_id: string;
  subject_id: string;
  week_id: string;
  points: number;
  category: PointCategory;
  reason: string | null;
  date: string;
  created_at: string;
}

export interface HubDataset {
  students: Student[];
  subjects: Subject[];
  weeks: Week[];
  pointLogs: PointLog[];
  schedules: ClassSchedule[];
  isConfigured: boolean;
  errorMessage?: string;
}

export interface StudentScoreRow {
  student: Student;
  totalPoints: number;
  positivePoints: number;
  penaltyPoints: number;
  activeCount: number;
  starCount: number;
  aceCount: number;
  dutyCount: number;
  fairPlayCount: number;
  subjectPoints: Record<string, number>;
  rank: number;
}

export interface SubjectChampion {
  subject: Subject;
  student: Student | null;
  points: number;
  tiedCount: number;
}

export interface MostImprovedResult {
  hasPreviousWeek: boolean;
  previousWeekName: string | null;
  student: Student | null;
  currentPoints: number;
  previousPoints: number;
  delta: number;
}

export interface ActivityFeedItem {
  id: string;
  studentName: string;
  subjectName: string;
  category: string;
  points: number;
  reason: string | null;
  date: string;
  createdAt: string;
}

export type ElectionStatus = "open" | "closed";

export interface LeaderElection {
  id: string;
  title: string;
  current_leader: string;
  status: ElectionStatus;
  winner: string | null;
  created_at: string;
  closed_at: string | null;
}

export interface LeaderVote {
  id: string;
  election_id: string;
  voter_username_lower: string;
  candidate: string;
  created_at: string;
}

export interface ElectionResult {
  candidate: string;
  label: string;
  votes: number;
}

export interface ElectionState {
  openElection: LeaderElection | null;
  openTotalVotes: number;
  /** Live results of the open vote — only filled for admins. */
  openResults: ElectionResult[] | null;
  hasVoted: boolean;
  myVote: string | null;
  latestClosed: LeaderElection | null;
  latestClosedResults: ElectionResult[];
  history: LeaderElection[];
  candidates: string[];
}
