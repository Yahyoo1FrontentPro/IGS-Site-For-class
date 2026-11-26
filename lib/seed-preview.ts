import { HubDataset, Student, Subject, Team, Week } from "@/types";

export function getSeedPreviewDataset(errorMessage?: string): HubDataset {
  const nowIso = new Date().toISOString();
  const todayStr = nowIso.slice(0, 10);

  const teams: Team[] = [
    {
      id: "team-1-inquirers",
      name: "Team Inquirers",
      short_name: "Team 1",
      color: "#7C3AED",
      sort_order: 1,
      created_at: nowIso,
    },
    {
      id: "team-2-thinkers",
      name: "Team Thinkers",
      short_name: "Team 2",
      color: "#2563EB",
      sort_order: 2,
      created_at: nowIso,
    },
    {
      id: "team-3-principled",
      name: "Team Principled",
      short_name: "Team 3",
      color: "#059669",
      sort_order: 3,
      created_at: nowIso,
    },
  ];

  const team1Members = ["Yasmina", "Charos", "Ezoza", "Diyora", "Fazliya", "Sofiya"];
  const team2Members = [
    "Azam",
    "Abdulmajid",
    "Jahongir",
    "Javhar",
    "Oybek",
    "Ansor",
    "Abdulazim",
  ];
  const team3Members = [
    "Muhammadali",
    "Abdulqahhor",
    "Saidakbar",
    "Emirhan",
    "Akbarhoja",
    "Yahyo",
  ];

  const students: Student[] = [
    ...team1Members.map((name, i) => ({
      id: `s-t1-${i + 1}`,
      name,
      team_id: "team-1-inquirers",
      is_active: true,
      created_at: nowIso,
    })),
    ...team2Members.map((name, i) => ({
      id: `s-t2-${i + 1}`,
      name,
      team_id: "team-2-thinkers",
      is_active: true,
      created_at: nowIso,
    })),
    ...team3Members.map((name, i) => ({
      id: `s-t3-${i + 1}`,
      name,
      team_id: "team-3-principled",
      is_active: true,
      created_at: nowIso,
    })),
  ];

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
    teams,
    students,
    subjects,
    weeks,
    pointLogs: [],
    teamBonuses: [],
    isConfigured: false,
    errorMessage,
  };
}
