export interface ClassRuleItem {
  label?: string;
  text: string;
}

export interface ClassRuleSection {
  number: number;
  title: string;
  items: ClassRuleItem[];
}

export interface DutyRosterRow {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  students: string[];
  responsibilities: string;
}

export interface DutyRosterWeek {
  weekNumber: 1 | 2;
  title: string;
  rows: DutyRosterRow[];
}

export const CLASS_RULES_META = {
  title: "MYP 3 Essential Classroom Agreement",
  subtitle: "International GoldStars School • Class Leaders: Yahyo & Fazliya",
};

export const CLASS_RULE_SECTIONS: ClassRuleSection[] = [
  {
    number: 1,
    title: "Mutual Respect & Empathy",
    items: [
      {
        text: "We actively listen when teachers or classmates are speaking.",
      },
      {
        text: "We support each other's learning process and treat mistakes as valuable learning moments.",
      },
      {
        text: "We use encouraging, positive language at all times.",
      },
    ],
  },
  {
    number: 2,
    title: "Punctuality & Readiness",
    items: [
      {
        text: "We arrive to class promptly and settle into our seats before the lesson starts.",
      },
      {
        text: "We have our learning materials (notebooks, pens, charged laptops) placed on desks ready to work.",
      },
    ],
  },
  {
    number: 3,
    title: "IB Learner Profile in Action",
    items: [
      {
        label: "Principled",
        text: "We uphold strict academic honesty in all assignments and teamwork.",
      },
      {
        label: "Caring",
        text: "We protect our classroom environment, school furniture, and educational equipment.",
      },
      {
        label: "Communicators",
        text: "We resolve any disagreement through calm, constructive, and respectful dialogue.",
      },
      {
        label: "Inquirers",
        text: "We ask thoughtful questions that enhance everyone's understanding.",
      },
    ],
  },
  {
    number: 4,
    title: "Digital Device Etiquette",
    items: [
      {
        text: "Laptops and tablets are used strictly for academic tasks directed by the subject teacher.",
      },
      {
        text: "Personal phone notifications remain silenced during instructional periods.",
      },
    ],
  },
];

export const DUTY_ROSTER_META = {
  title: "MYP 3 Class Duty Roster",
  subtitle: "International GoldStars School • Academic Year 2026–2027",
  classLeaders: "Yahyo & Fazliya",
  termPeriod: "Weeks 1 & 2",
};

export const DUTY_ROSTER_WEEKS: DutyRosterWeek[] = [
  {
    weekNumber: 1,
    title: "WEEK 1 SCHEDULE",
    rows: [
      {
        day: "Monday",
        students: ["Saidakbar", "Akbarxo'ja"],
        responsibilities:
          "Whiteboard & markers, classroom materials distribution",
      },
      {
        day: "Tuesday",
        students: ["Oybek", "Yahyoo"],
        responsibilities:
          "Whiteboard cleaning, room ventilation, desk alignment",
      },
      {
        day: "Wednesday",
        students: ["Javhar", "Abdulmajid"],
        responsibilities:
          "Whiteboard preparation, projector & AV check, desk order",
      },
      {
        day: "Thursday",
        students: ["Abdulqahor", "Zubayr"],
        responsibilities:
          "Whiteboard & markers, paper recycling, tidy shelving",
      },
      {
        day: "Friday",
        students: ["Jaxongir", "Azam"],
        responsibilities:
          "Full whiteboard wash, markers replenishment, window check",
      },
    ],
  },
  {
    weekNumber: 2,
    title: "WEEK 2 SCHEDULE",
    rows: [
      {
        day: "Monday",
        students: ["Ezoza", "Yasmin"],
        responsibilities:
          "Whiteboard & markers, classroom materials distribution",
      },
      {
        day: "Tuesday",
        students: ["Charos", "Fazliya"],
        responsibilities:
          "Whiteboard cleaning, room ventilation, desk alignment",
      },
      {
        day: "Wednesday",
        students: ["Diyora", "Sofia"],
        responsibilities:
          "Whiteboard preparation, projector & AV check, desk order",
      },
      {
        day: "Thursday",
        students: ["Abdulazim", "Muhammadali"],
        responsibilities:
          "Whiteboard & markers, paper recycling, tidy shelving",
      },
      {
        day: "Friday",
        students: ["Emirhan", "Ansor"],
        responsibilities:
          "Full whiteboard wash, markers replenishment, window check",
      },
    ],
  },
];

export function getTodayWeekdayName():
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | null {
  const day = new Date().getDay();
  const map: Record<
    number,
    "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday"
  > = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
  };
  return map[day] ?? null;
}
