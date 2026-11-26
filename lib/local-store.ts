import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import {
  AppUserSummary,
  HubDataset,
  PointLog,
  Student,
  Subject,
  Team,
  TeamBonus,
  UserRole,
  Week,
} from "@/types";
import { BUILTIN_ADMIN_PASSWORD_HASH, BUILTIN_ADMIN_USERNAME } from "@/lib/auth";
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
  teams: Team[];
  students: Student[];
  subjects: Subject[];
  weeks: Week[];
  pointLogs: PointLog[];
  teamBonuses: TeamBonus[];
}

const STORE_FILE_PATH = path.join(os.tmpdir(), "igs-myp3-activity-hub-data-v1.json");

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
    ],
    teams: seed.teams,
    students: seed.students,
    subjects: seed.subjects,
    weeks: seed.weeks,
    pointLogs: [],
    teamBonuses: [],
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
    if (!parsed || !Array.isArray(parsed.teams) || !Array.isArray(parsed.appUsers)) {
      const initial = createInitialStore();
      fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(initial, null, 2), "utf8");
      return initial;
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
    // Ignore write errors in read-only edge environments
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function getLocalHubDataset(): HubDataset {
  const store = readLocalStore();
  return {
    teams: [...store.teams].sort((a, b) => a.sort_order - b.sort_order),
    students: [...store.students].sort((a, b) => a.name.localeCompare(b.name)),
    subjects: [...store.subjects].sort((a, b) => a.sort_order - b.sort_order),
    weeks: [...store.weeks].sort((a, b) => a.week_number - b.week_number),
    pointLogs: [...store.pointLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
    teamBonuses: [...store.teamBonuses].sort((a, b) => b.date.localeCompare(a.date)),
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
