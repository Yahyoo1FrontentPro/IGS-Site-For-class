import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import {
  AppUserSummary,
  ClassSchedule,
  HubDataset,
  LeaderElection,
  LeaderVote,
  PointLog,
  Student,
  Subject,
  UserRole,
  Week,
} from "@/types";
import {
  BUILTIN_ADMIN_PASSWORD_HASH,
  BUILTIN_ADMIN_USERNAME,
  DEFAULT_STUDENT_PASSWORD_HASH,
} from "@/lib/auth";
import { getSeedPreviewDataset } from "@/lib/seed-preview";

export interface StoredAppUser {
  id: string;
  username: string;
  username_lower: string;
  phone: string | null;
  phone_normalized: string | null;
  password_hash: string;
  role: UserRole;
  created_at: string;
}

export interface LocalStoreData {
  appUsers: StoredAppUser[];
  students: Student[];
  subjects: Subject[];
  weeks: Week[];
  pointLogs: PointLog[];
  schedules: ClassSchedule[];
  elections: LeaderElection[];
  votes: LeaderVote[];
}

const STORE_FILE_PATH = path.join(
  os.tmpdir(),
  "igs-myp3-solo-hub-data-v2.json"
);

function createInitialStore(): LocalStoreData {
  const seed = getSeedPreviewDataset();
  const nowIso = new Date().toISOString();

  return {
    appUsers: [
      {
        id: "admin-yahyo-primary",
        username: BUILTIN_ADMIN_USERNAME,
        username_lower: BUILTIN_ADMIN_USERNAME.toLowerCase(),
        phone: null,
        phone_normalized: null,
        password_hash: BUILTIN_ADMIN_PASSWORD_HASH,
        role: "admin",
        created_at: nowIso,
      },
      ...seed.students.map((st, idx) => ({
        id: `user-student-${idx + 1}`,
        username: st.name,
        username_lower: st.name.toLowerCase(),
        phone: null,
        phone_normalized: null,
        password_hash: DEFAULT_STUDENT_PASSWORD_HASH,
        role: "student" as const,
        created_at: nowIso,
      })),
    ],
    students: seed.students,
    subjects: seed.subjects,
    weeks: seed.weeks,
    pointLogs: [],
    schedules: [],
    elections: [],
    votes: [],
  };
}

export function readLocalStore(): LocalStoreData {
  try {
    if (!fs.existsSync(STORE_FILE_PATH)) {
      const initial = createInitialStore();
      fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const raw = fs.readFileSync(STORE_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as LocalStoreData;
    if (!parsed || !Array.isArray(parsed.students) || !Array.isArray(parsed.appUsers)) {
      const initial = createInitialStore();
      fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    if (!Array.isArray(parsed.schedules)) {
      parsed.schedules = [];
    }
    if (!Array.isArray(parsed.elections)) {
      parsed.elections = [];
    }
    if (!Array.isArray(parsed.votes)) {
      parsed.votes = [];
    }
    return parsed;
  } catch {
    return createInitialStore();
  }
}

export function writeLocalStore(data: LocalStoreData): void {
  try {
    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // Ignore write errors in read-only environments
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getLocalHubDataset(): HubDataset {
  const store = readLocalStore();
  return {
    students: [...store.students].sort((a, b) => a.name.localeCompare(b.name)),
    subjects: [...store.subjects].sort((a, b) => a.sort_order - b.sort_order),
    weeks: [...store.weeks].sort((a, b) => a.week_number - b.week_number),
    pointLogs: [...store.pointLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    schedules: [...store.schedules].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    isConfigured: true,
  };
}

export function toUserSummary(u: StoredAppUser): AppUserSummary {
  return {
    id: u.id,
    username: u.username,
    phone: u.phone,
    role: u.role,
    created_at: u.created_at,
  };
}
