import { HubDataset, Student, Subject, Week } from "@/types";

export const INITIAL_STUDENT_NAMES = [
  "Yasmina",
  "Charos",
  "Ezoza",
  "Diyora",
  "Fazliya",
  "Sofiya",
  "Azam",
  "Abdulmajid",
  "Jahongir",
  "Javhar",
  "Oybek",
  "Ansor",
  "Abdulazim",
  "Muhammadali",
  "Abdulqahhor",
  "Saidakbar",
  "Emirhan",
  "Akbarhoja",
  "Yahyo",
];

export function getSeedPreviewDataset(errorMessage?: string): HubDataset {
  const nowIso = new Date().toISOString();
  const todayStr = nowIso.slice(0, 10);

  const students: Student[] = INITIAL_STUDENT_NAMES.map((name, idx) => ({
    id: `student-${idx + 1}`,
    name,
    is_active: true,
    created_at: nowIso,
  }));

  const subjects: Subject[] = [
    {
      id: "sub-math",
      name: "Mathematics",
      award_title: "Math Master",
      is_duty_category: false,
      is_hidden: false,
      sort_order: 1,
      created_at: nowIso,
    },
    {
      id: "sub-sci",
      name: "Science",
      award_title: "Science Explorer",
      is_duty_category: false,
      is_hidden: false,
      sort_order: 2,
      created_at: nowIso,
    },
    {
      id: "sub-eng",
      name: "English Language & Literature",
      award_title: "English Star",
      is_duty_category: false,
      is_hidden: false,
      sort_order: 3,
      created_at: nowIso,
    },
    {
      id: "sub-des",
      name: "Design & IT",
      award_title: "Design Innovator",
      is_duty_category: false,
      is_hidden: false,
      sort_order: 4,
      created_at: nowIso,
    },
    {
      id: "sub-ins",
      name: "Individuals & Societies",
      award_title: "Global Scholar",
      is_duty_category: false,
      is_hidden: false,
      sort_order: 5,
      created_at: nowIso,
    },
    {
      id: "sub-lan",
      name: "Languages (Russian / Uzbek)",
      award_title: "Language Laureate",
      is_duty_category: false,
      is_hidden: false,
      sort_order: 6,
      created_at: nowIso,
    },
    {
      id: "sub-duty",
      name: "Class Duty & Teamwork",
      award_title: "Responsibility Champion",
      is_duty_category: true,
      is_hidden: false,
      sort_order: 7,
      created_at: nowIso,
    },
  ];

  const weeks: Week[] = [
    {
      id: "week-1",
      week_number: 1,
      name: "Week 1",
      start_date: todayStr,
      end_date: todayStr,
      is_active: true,
      created_at: nowIso,
    },
  ];

  return {
    students,
    subjects,
    weeks,
    pointLogs: [],
    schedules: [],
    isConfigured: false,
    errorMessage,
  };
}
