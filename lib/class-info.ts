import { AppLanguage } from "@/types";

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
  responsibilitiesRu: string;
}

export interface DutyRosterWeek {
  weekNumber: 1 | 2;
  title: string;
  titleRu: string;
  rows: DutyRosterRow[];
}

export const CLASS_RULES_META = {
  en: {
    title: "MYP 3 Essential Classroom Agreement",
    subtitle: "International GoldStars School • Class Leaders: Yahyo & Fazliya",
  },
  ru: {
    title: "Основные правила класса MYP 3",
    subtitle: "International GoldStars School • Старосты: Яхё и Фазлия",
  },
};

export const CLASS_RULE_SECTIONS: Record<AppLanguage, ClassRuleSection[]> = {
  en: [
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
  ],
  ru: [
    {
      number: 1,
      title: "Взаимное уважение и эмпатия",
      items: [
        {
          text: "Мы внимательно слушаем, когда говорят учителя или одноклассники.",
        },
        {
          text: "Мы поддерживаем друг друга в учёбе и относимся к ошибкам как к ценному опыту.",
        },
        {
          text: "Мы всегда используем доброжелательную и позитивную речь.",
        },
      ],
    },
    {
      number: 2,
      title: "Пунктуальность и готовность к уроку",
      items: [
        {
          text: "Мы приходим на урок вовремя и занимаем свои места до начала занятия.",
        },
        {
          text: "Наши учебные принадлежности (тетради, ручки, заряженные ноутбуки) заранее лежат на партах и готовы к работе.",
        },
      ],
    },
    {
      number: 3,
      title: "Профиль ученика IB в действии",
      items: [
        {
          label: "Принципиальные",
          text: "Мы строго соблюдаем академическую честность во всех заданиях и командной работе.",
        },
        {
          label: "Заботливые",
          text: "Мы бережём наш класс, школьную мебель и учебное оборудование.",
        },
        {
          label: "Коммуникабельные",
          text: "Мы решаем любые разногласия через спокойный, конструктивный и уважительный диалог.",
        },
        {
          label: "Любознательные",
          text: "Мы задаём продуманные вопросы, которые помогают всем лучше понять материал.",
        },
      ],
    },
    {
      number: 4,
      title: "Этикет использования цифровых устройств",
      items: [
        {
          text: "Ноутбуки и планшеты используются строго для учебных задач по указанию учителя.",
        },
        {
          text: "Уведомления на личных телефонах остаются без звука во время уроков.",
        },
      ],
    },
  ],
};

export const DUTY_ROSTER_META = {
  en: {
    title: "MYP 3 Class Duty Roster",
    subtitle: "International GoldStars School • Academic Year 2026–2027",
    classLeaders: "Yahyo & Fazliya",
    termPeriod: "Weeks 1 & 2",
  },
  ru: {
    title: "График дежурств класса MYP 3",
    subtitle: "International GoldStars School • Учебный год 2026–2027",
    classLeaders: "Яхё и Фазлия",
    termPeriod: "Недели 1 и 2",
  },
};

export const DUTY_ROSTER_WEEKS: DutyRosterWeek[] = [
  {
    weekNumber: 1,
    title: "WEEK 1 SCHEDULE",
    titleRu: "РАСПИСАНИЕ — НЕДЕЛЯ 1",
    rows: [
      {
        day: "Monday",
        students: ["Saidakbar", "Akbarxo'ja"],
        responsibilities:
          "Whiteboard & markers, classroom materials distribution",
        responsibilitiesRu:
          "Доска и маркеры, раздача учебных материалов",
      },
      {
        day: "Tuesday",
        students: ["Oybek", "Yahyoo"],
        responsibilities:
          "Whiteboard cleaning, room ventilation, desk alignment",
        responsibilitiesRu:
          "Мытьё доски, проветривание кабинета, выравнивание парт",
      },
      {
        day: "Wednesday",
        students: ["Javhar", "Abdulmajid"],
        responsibilities:
          "Whiteboard preparation, projector & AV check, desk order",
        responsibilitiesRu:
          "Подготовка доски, проверка проектора и аудио, порядок на партах",
      },
      {
        day: "Thursday",
        students: ["Abdulqahor", "Zubayr"],
        responsibilities:
          "Whiteboard & markers, paper recycling, tidy shelving",
        responsibilitiesRu:
          "Доска и маркеры, сбор макулатуры, порядок на полках",
      },
      {
        day: "Friday",
        students: ["Jaxongir", "Azam"],
        responsibilities:
          "Full whiteboard wash, markers replenishment, window check",
        responsibilitiesRu:
          "Полная очистка доски, пополнение маркеров, проверка окон",
      },
    ],
  },
  {
    weekNumber: 2,
    title: "WEEK 2 SCHEDULE",
    titleRu: "РАСПИСАНИЕ — НЕДЕЛЯ 2",
    rows: [
      {
        day: "Monday",
        students: ["Ezoza", "Yasmin"],
        responsibilities:
          "Whiteboard & markers, classroom materials distribution",
        responsibilitiesRu:
          "Доска и маркеры, раздача учебных материалов",
      },
      {
        day: "Tuesday",
        students: ["Charos", "Fazliya"],
        responsibilities:
          "Whiteboard cleaning, room ventilation, desk alignment",
        responsibilitiesRu:
          "Мытьё доски, проветривание кабинета, выравнивание парт",
      },
      {
        day: "Wednesday",
        students: ["Diyora", "Sofia"],
        responsibilities:
          "Whiteboard preparation, projector & AV check, desk order",
        responsibilitiesRu:
          "Подготовка доски, проверка проектора и аудио, порядок на партах",
      },
      {
        day: "Thursday",
        students: ["Abdulazim", "Muhammadali"],
        responsibilities:
          "Whiteboard & markers, paper recycling, tidy shelving",
        responsibilitiesRu:
          "Доска и маркеры, сбор макулатуры, порядок на полках",
      },
      {
        day: "Friday",
        students: ["Emirhan", "Ansor"],
        responsibilities:
          "Full whiteboard wash, markers replenishment, window check",
        responsibilitiesRu:
          "Полная очистка доски, пополнение маркеров, проверка окон",
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
