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
}

export interface AppUserSummary {
  id: string;
  username: string;
  phone: string | null;
  role: UserRole;
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
