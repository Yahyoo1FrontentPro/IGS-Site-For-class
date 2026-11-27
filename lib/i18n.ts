import { AppLanguage } from "@/types";

export const TRANSLATIONS = {
  en: {
    siteTitle: "International GoldStars School • MYP 3 Activity Hub",
    siteSubtitle:
      "IB Middle Years Programme • Individual Solo Standings, Class Schedule & Weekly Honors",
    leadersBadge: "Leaders: Yahyo & Fazliya",
    allTimeCumulative: "All-Time Cumulative",
    activeSuffix: "(Active)",
    navVote: "Vote",
    navVoteOpen: "Vote (OPEN)",
    navSchedule: "Schedule",
    navRulesDuty: "Rules & Duty",
    navHomework: "Homework",
    navReportAbsence: "Report Absence",
    navReport: "Report",
    navTvMode: "TV Mode",
    navAdmin: "Admin",
    navRegister: "Register",
    navLogIn: "Log In",
    navBackToHub: "Back to Hub",
    navPublicHub: "Public Hub",
    navPassword: "Password",
    navLogout: "Logout",

    // Public Dashboard
    dashAllTimeStandings: "All-Time Solo Standings",
    dashWeeklyView: "Weekly View",
    dashSoloCompetitors: "Solo Competitors",
    dashActivityLogs: "Activity Logs",
    dashRaceTitle: "Live MYP 3 Solo Standings Race",
    dashRaceSubtitle:
      "Every student competes individually based on classroom participation, achievements, and class duty.",
    dashWeeklyPrizesTitle: "🍫 Weekly Prizes for the Top 3 Students",
    dashPlace1: "1st Place",
    dashPlace2: "2nd Place",
    dashPlace3: "3rd Place",
    dashPrize1: "1 Alpen Gold Chocolate",
    dashPrize2: "1 Big Snickers Chocolate",
    dashPrize3: "1 Snickers or Bounty Chocolate",
    dashLeaderTag: "Leader",
    dashSoloRank: "Solo Rank",
    dashPoints: "points",
    dashPts: "pts",
    dashPrizeLabel: "🎁 Prize:",
    dashAllTimeHonors: "All-Time Solo Honors & Subject Champions",
    dashWeeklyHonors: "Weekly Solo Honors & Subject Champions",
    dashMvpBadge: "Overall Solo MVP",
    dashMvpSub: "total points across all subjects",
    dashMvpEmptyTitle: "Awaiting first points",
    dashMvpEmptyDesc:
      "The highest-scoring student of the week is automatically crowned here.",
    dashMostActiveBadge: "Most Active Student",
    dashMostActiveSub: "positive contributions logged",
    dashMostActiveEmptyTitle: "Ready for participation",
    dashMostActiveEmptyDesc:
      "Recognizes the student with the highest number of positive class contributions.",
    dashMostImprovedBadge: "Most Improved",
    dashBaselineTitle: "Baseline Week in Progress",
    dashBaselineDesc:
      "Starting in Week 2, this honor automatically highlights the student with the biggest score jump!",
    dashComparingVs: "Comparing vs",
    dashComparingDesc:
      "As students surpass their previous week total, the biggest positive jump will appear here.",
    dashSubjectChampsTitle: "IB MYP 3 Subject Champions",
    dashTied: "tied",
    dashNoPointsYet: "No points logged yet",
    dashLeaderboardTitle: "Full Class Solo Leaderboard",
    dashLeaderboardSub: "Filter by subject or search any classmate.",
    dashStudentsCount: "students",
    dashSearchStudent: "Search student...",
    dashAllSubjects: "All Subjects",
    dashColRank: "Rank",
    dashColStudent: "Student",
    dashColBreakdown: "Breakdown",
    dashColPoints: "Points",
    dashNoStudentsMatch: "No students match the current filter.",
    dashActivityTitle: "Recent Activity Feed",
    dashActivitySub: "100% transparent log of solo points awarded.",
    dashActivityEmptyTitle: "No activity logged yet",
    dashActivityEmptyDesc:
      "Points awarded by Class Leaders Yahyo & Fazliya will appear here in real time.",
    dashReasonLabel: "Reason:",

    // Leader Election Card
    voteTitle: "Class Leader Vote",
    voteClosedBanner:
      "closed. The Class Leader will announce on the whiteboard when voting opens.",
    voteOpenStatus: "Voting OPEN",
    voteVotesSoFar: "votes so far",
    voteClosedStatus: "Voting closed",
    voteCurrentLeader: "Current leader:",
    voteInstructions:
      "Vote to keep them or choose a new leader. Each account can vote only once per round. Results are shown when the vote closes.",
    voteLoginBtn: "Log in to vote",
    voteThankYou: "Thank you! You voted for:",
    voteKeepCurrent: "Keep current leader",
    voteSubmitBtn: "Submit My Vote",
    voteLastResult: "Last vote result",
    voteVotesWord: "votes",
    voteNextHint:
      "The next vote opens only when the Class Leader announces it on the whiteboard.",

    // Schedule Viewer
    schedTitle: "MYP 3 Class Schedule",
    schedSubtitle: "Official lesson timetable & uploaded schedule photos",
    schedAddEdit: "Add / Edit Schedule",
    schedEmptyTitle: "No Class Schedule Added Yet",
    schedEmptyDesc:
      "Class Leader Admin can upload a schedule photo or add daily lessons in the Admin Console.",
    schedUploadNow: "Upload Schedule Now",
    schedFullSize: "Full Size",
    schedBackHub: "Back to Activity Hub",

    // Weekdays
    dayMonday: "Monday",
    dayTuesday: "Tuesday",
    dayWednesday: "Wednesday",
    dayThursday: "Thursday",
    dayFriday: "Friday",
    daySaturday: "Saturday",

    // Admin Tabs
    adminTitle: "MYP 3 Solo Leader Console",
    adminSignedInAs: "Signed in as",
    adminActiveLabel: "Active:",
    adminNoActiveWeek: "No active week",
    adminTabDaily: "Daily Input",
    adminTabHomework: "Homework",
    adminTabRollCall: "Roll-Call & Logs",
    adminTabSchedules: "Schedules",
    adminTabVoting: "Voting",
    adminTabAbsences: "Absences",
    adminTabManage: "Management",
    adminLessonDate: "Lesson Date",
    adminCurrentSubject: "Current Lesson / Subject",
    adminQuickFind: "Quick Find Student",
    adminTypeStudent: "Type student name...",

    // Rules & Duty
    rulesHeaderTitle: "MYP 3 Class Rules & Duty Roster",
    rulesTabAll: "All",
    rulesTabRules: "Class Rules",
    rulesTabDuty: "Duty Roster",
    rulesBadge: "Class Rules",
    dutyBadge: "Students on Duty",
    todayTag: "Today",
    dutyTodayIs: "Today is",
    dutyClassLeaders: "Class Leaders:",
    dutyTermPeriod: "Term / Period:",
    dutyMonFri: "Monday – Friday",
    dutyColDay: "Day of the Week",
    dutyColStudents: "Students on Duty",
    dutyColResp: "Core Responsibilities",

    // Absence Page
    absenceHeaderTitle: "Report School Absence",
    absenceHeaderSubtitle:
      "Notify MYP 3 Class Leaders when you cannot attend school",
    absenceLoginTitle: "Log in to Report an Absence",
    absenceLoginDesc:
      "If you cannot attend school today or tomorrow, please sign in with your student account so the class admin knows who is absent and why.",
    absenceLoginBtn: "Log In Now",
    absenceReturnHub: "Return to Hub",
    absenceViewAdmin: "View All in Admin",
    absenceFormTitle: "I Can't Attend School",
    absenceReportingAs: "Reporting as",
    absenceSentDirect: "Sent directly to the Class Admin",
    absenceDateLabel: "Date You Will Miss School",
    absenceToday: "Today",
    absenceTomorrow: "Tomorrow",
    absenceQuickReason: "Quick Select Reason (Optional)",
    absenceReasonLabel: "Reason for Absence (Required)",
    absenceReasonPlaceholder:
      "Write why you cannot come to school (e.g. I have a fever and will stay home to rest)...",
    absenceSubmitBtn: "Notify Admin I Won't Attend",
    absenceHistoryTitle: "My Submitted Absence Reports",
    absenceHistorySubtitle: "Track when the class admin has seen your notice",
    absenceTotal: "total",
    absenceSeen: "Seen by Admin",
    absenceSent: "Sent to Admin",
    absenceEmpty: "You have not submitted any absence reports yet.",
    absencePresets: [
      "Sick / Feeling unwell",
      "Doctor / Medical appointment",
      "Family reason",
      "School competition / Official event",
      "Travel / Out of town",
    ],

    // Admin Absences
    adminAbsTitle: "Student Absence Notifications",
    adminAbsSubtitle:
      "Students who reported they cannot attend school via the site",
    adminAbsToday: "Absent Today:",
    adminAbsUnseen: "Unseen:",
    adminAbsAll: "All",
    adminAbsPending: "Pending",
    adminAbsSeen: "Seen",
    adminAbsNew: "New / Unseen",
    adminAbsEmpty: "No absence reports in this view",
    adminAbsEmptySub:
      'When students log in and click "Report Absence", their date and reason will appear here instantly.',
    adminAbsMarkSeen: "Mark as Seen",
    adminAbsMarkUnseen: "Mark Unseen",

    // Admin Roles
    rolesTitle: "Role Assignment, Co-Admins & Accounts",
    rolesSubtitle:
      "Appoint additional admins, define custom titles (e.g. Co-Leader, Duty Manager), or add brand-new users.",
    rolesSavePhone: "Save My Phone",
    rolesAssignExisting: "Assign Role to Existing Account",
    rolesSelectUser: "Select Existing User",
    rolesAccessLevel: "Access Level",
    rolesSpecificTitle: "Specific Role Title",
    rolesSaveBtn: "Save Role & Title",
    rolesAddNew: "Add New User & Assign Role",
    rolesUsername: "Username *",
    rolesPassword: "Password (blank = 12345678)",
    rolesRoleTitle: "Role Title",
    rolesPhoneOpt: "Phone (Optional)",
    rolesCreateBtn: "Create User & Assign Role",
    rolesAllAccounts: "All Accounts",
    rolesEditRole: "Edit Role",
    rolesResetPw: "Reset PW",

    // Homework Page
    hwHeaderTitle: "MYP 3 Homework Board",
    hwHeaderSubtitle: "Assignments by subject posted by your class leaders",
    hwAllSubjects: "All Subjects",
    hwSearchPlaceholder: "Search homework...",
    hwCompleted: "Completed",
    hwMarkDone: "Mark Done",
    hwDueToday: "Due Today",
    hwDueTomorrow: "Due Tomorrow",
    hwOverdue: "Overdue",
    hwDueInDays: "Due in",
    hwDays: "days",
    hwNoHomework: "No homework assignments posted yet.",
    hwOpenLink: "Open Resource Link",
    hwPostNew: "Post New Homework",
    hwManageTitle: "Homework Assignments Manager",
    hwManageSubtitle:
      "Post assignments per subject so students can view deadlines and details on /homework",
    hwSubjectLabel: "Subject",
    hwTitleLabel: "Assignment Title",
    hwDueDateLabel: "Due Date",
    hwLinkLabel: "Reference Link (Optional)",
    hwDescLabel: "Instructions / Details",
    hwPublishBtn: "Post Homework",
    hwPostedList: "Posted Assignments",

    // Roll-Call & Teacher/Class Logs
    rcTitle: "Daily Roll-Call (Attendance)",
    rcSubtitle:
      "Mark each student Present, Late, Absent, or Excused and save to attendance history",
    rcMarkAllPresent: "Mark All Present",
    rcSaveBtn: "Save Roll-Call",
    rcSavedDates: "Roll-Call History",
    rcPresent: "Present",
    rcLate: "Late",
    rcAbsent: "Absent",
    rcExcused: "Excused",
    rcReportedAbsent: "Reported Absent",
    incTitle: "Teacher No-Show & Cancelled Classes Log",
    incSubtitle:
      "Record when a teacher does not show up or a lesson does not take place — full history is preserved",
    incTypeTeacher: "Teacher No-Show",
    incTypeCancelled: "Class Did Not Take Place",
    incDateLabel: "Date",
    incSubjectLabel: "Subject",
    incTeacherLabel: "Teacher Name",
    incPeriodLabel: "Period / Time (Optional)",
    incNotesLabel: "Notes / Reason (Optional)",
    incRecordBtn: "Record Event",
    incHistoryTitle: "Recorded Incidents History",
    incFilterAll: "All",
    incEmpty: "No teacher no-shows or cancelled classes recorded yet.",
  },
  ru: {
    siteTitle: "International GoldStars School • Портал MYP 3",
    siteSubtitle:
      "Программа IB MYP • Индивидуальный рейтинг, расписание, ДЗ и еженедельные награды",
    leadersBadge: "Старосты: Яхё и Фазлия",
    allTimeCumulative: "За всё время",
    activeSuffix: "(Активна)",
    navVote: "Голосование",
    navVoteOpen: "Голосование (ОТКРЫТО)",
    navSchedule: "Расписание",
    navRulesDuty: "Правила и дежурные",
    navHomework: "Домашние задания",
    navReportAbsence: "Не смогу прийти",
    navReport: "Отчёт",
    navTvMode: "ТВ-режим",
    navAdmin: "Админ",
    navRegister: "Регистрация",
    navLogIn: "Войти",
    navBackToHub: "На главную",
    navPublicHub: "На главную",
    navPassword: "Пароль",
    navLogout: "Выйти",

    // Public Dashboard
    dashAllTimeStandings: "Общий рейтинг за всё время",
    dashWeeklyView: "Недельный рейтинг",
    dashSoloCompetitors: "Участников",
    dashActivityLogs: "Записей баллов",
    dashRaceTitle: "Живой личный рейтинг MYP 3",
    dashRaceSubtitle:
      "Каждый ученик соревнуется индивидуально: активность на уроках, достижения и дежурство по классу.",
    dashWeeklyPrizesTitle: "🍫 Еженедельные призы для Топ-3 учеников",
    dashPlace1: "1-е место",
    dashPlace2: "2-е место",
    dashPlace3: "3-е место",
    dashPrize1: "1 шоколадка Alpen Gold",
    dashPrize2: "1 большой Snickers",
    dashPrize3: "1 Snickers или Bounty",
    dashLeaderTag: "Лидер",
    dashSoloRank: "Личный зачёт",
    dashPoints: "баллов",
    dashPts: "б.",
    dashPrizeLabel: "🎁 Приз:",
    dashAllTimeHonors: "Награды за всё время и чемпионы по предметам",
    dashWeeklyHonors: "Награды недели и чемпионы по предметам",
    dashMvpBadge: "Лучший ученик (MVP)",
    dashMvpSub: "всего баллов по всем предметам",
    dashMvpEmptyTitle: "Ожидаем первые баллы",
    dashMvpEmptyDesc:
      "Ученик с наибольшим количеством баллов за неделю автоматически появляется здесь.",
    dashMostActiveBadge: "Самый активный ученик",
    dashMostActiveSub: "положительных отметок",
    dashMostActiveEmptyTitle: "Готовы к активности",
    dashMostActiveEmptyDesc:
      "Награда для ученика с наибольшим количеством положительных вкладов на уроках.",
    dashMostImprovedBadge: "Прорыв недели",
    dashBaselineTitle: "Идёт первая неделя",
    dashBaselineDesc:
      "Начиная со 2-й недели, здесь автоматически показывается ученик с наибольшим ростом баллов!",
    dashComparingVs: "Сравнение с",
    dashComparingDesc:
      "Когда ученики превзойдут свой результат прошлой недели, лидер роста появится здесь.",
    dashSubjectChampsTitle: "Чемпионы по предметам IB MYP 3",
    dashTied: "ничья",
    dashNoPointsYet: "Баллы ещё не начислены",
    dashLeaderboardTitle: "Полная таблица личного рейтинга",
    dashLeaderboardSub: "Фильтруйте по предмету или найдите одноклассника.",
    dashStudentsCount: "учеников",
    dashSearchStudent: "Поиск ученика...",
    dashAllSubjects: "Все предметы",
    dashColRank: "Место",
    dashColStudent: "Ученик",
    dashColBreakdown: "Категории",
    dashColPoints: "Баллы",
    dashNoStudentsMatch: "Ученики по данному фильтру не найдены.",
    dashActivityTitle: "Лента последних событий",
    dashActivitySub: "100% прозрачный журнал начисленных баллов.",
    dashActivityEmptyTitle: "Записей пока нет",
    dashActivityEmptyDesc:
      "Баллы, начисленные старостами Яхё и Фазлией, будут появляться здесь в реальном времени.",
    dashReasonLabel: "Причина:",

    // Leader Election Card
    voteTitle: "Голосование за старосту класса",
    voteClosedBanner:
      "закрыто. Староста объявит на доске, когда откроется голосование.",
    voteOpenStatus: "Голосование ОТКРЫТО",
    voteVotesSoFar: "голосов",
    voteClosedStatus: "Голосование закрыто",
    voteCurrentLeader: "Текущий староста:",
    voteInstructions:
      "Проголосуйте, чтобы оставить текущего старосту или выбрать нового. Каждый аккаунт может проголосовать только один раз. Результаты появятся после закрытия.",
    voteLoginBtn: "Войти, чтобы проголосовать",
    voteThankYou: "Спасибо! Вы проголосовали за:",
    voteKeepCurrent: "Оставить текущего старосту",
    voteSubmitBtn: "Отправить голос",
    voteLastResult: "Результат прошлого голосования",
    voteVotesWord: "голосов",
    voteNextHint:
      "Следующее голосование откроется только тогда, когда староста объявит об этом на доске.",

    // Schedule Viewer
    schedTitle: "Расписание уроков MYP 3",
    schedSubtitle: "Официальное расписание уроков и загруженные фото",
    schedAddEdit: "Добавить / Изменить",
    schedEmptyTitle: "Расписание ещё не добавлено",
    schedEmptyDesc:
      "Староста может загрузить фото расписания или добавить уроки в панели администратора.",
    schedUploadNow: "Загрузить расписание",
    schedFullSize: "На весь экран",
    schedBackHub: "На главную",

    // Weekdays
    dayMonday: "Понедельник",
    dayTuesday: "Вторник",
    dayWednesday: "Среда",
    dayThursday: "Четверг",
    dayFriday: "Пятница",
    daySaturday: "Суббота",

    // Admin Tabs
    adminTitle: "Панель управления MYP 3",
    adminSignedInAs: "Вы вошли как",
    adminActiveLabel: "Активна:",
    adminNoActiveWeek: "Нет активной недели",
    adminTabDaily: "Баллы",
    adminTabHomework: "ДЗ",
    adminTabRollCall: "Перекличка и журнал",
    adminTabSchedules: "Расписание",
    adminTabVoting: "Голосование",
    adminTabAbsences: "Пропуски",
    adminTabManage: "Управление",
    adminLessonDate: "Дата урока",
    adminCurrentSubject: "Текущий урок / Предмет",
    adminQuickFind: "Быстрый поиск ученика",
    adminTypeStudent: "Введите имя ученика...",

    // Rules & Duty
    rulesHeaderTitle: "Правила класса MYP 3 и график дежурств",
    rulesTabAll: "Всё",
    rulesTabRules: "Правила класса",
    rulesTabDuty: "Дежурные",
    rulesBadge: "Правила класса",
    dutyBadge: "График дежурств",
    todayTag: "Сегодня",
    dutyTodayIs: "Сегодня",
    dutyClassLeaders: "Старосты класса:",
    dutyTermPeriod: "Период:",
    dutyMonFri: "Понедельник – Пятница",
    dutyColDay: "День недели",
    dutyColStudents: "Дежурные ученики",
    dutyColResp: "Основные обязанности",

    // Absence Page
    absenceHeaderTitle: "Сообщить об отсутствии",
    absenceHeaderSubtitle:
      "Предупредите старост MYP 3, если не сможете прийти в школу",
    absenceLoginTitle: "Войдите, чтобы сообщить об отсутствии",
    absenceLoginDesc:
      "Если вы не сможете прийти в школу сегодня или завтра, войдите в свой аккаунт ученика, чтобы админ знал, кого не будет и по какой причине.",
    absenceLoginBtn: "Войти сейчас",
    absenceReturnHub: "На главную",
    absenceViewAdmin: "Смотреть все в админке",
    absenceFormTitle: "Я не смогу прийти в школу",
    absenceReportingAs: "Отправка от имени",
    absenceSentDirect: "Отправляется напрямую админу класса",
    absenceDateLabel: "Дата отсутствия",
    absenceToday: "Сегодня",
    absenceTomorrow: "Завтра",
    absenceQuickReason: "Быстрый выбор причины (необязательно)",
    absenceReasonLabel: "Причина отсутствия (обязательно)",
    absenceReasonPlaceholder:
      "Напишите, почему вы не сможете прийти (например: поднялась температура, остаюсь дома)...",
    absenceSubmitBtn: "Отправить админу",
    absenceHistoryTitle: "Мои уведомления об отсутствии",
    absenceHistorySubtitle: "Отслеживайте, когда админ увидит ваше сообщение",
    absenceTotal: "всего",
    absenceSeen: "Просмотрено админом",
    absenceSent: "Отправлено админу",
    absenceEmpty: "Вы ещё не отправляли уведомлений об отсутствии.",
    absencePresets: [
      "Болею / Плохо себя чувствую",
      "Приём у врача",
      "Семейные обстоятельства",
      "Школьное соревнование / Мероприятие",
      "Поездка / Отъезд из города",
    ],

    // Admin Absences
    adminAbsTitle: "Уведомления об отсутствии учеников",
    adminAbsSubtitle:
      "Ученики, сообщившие через сайт, что не смогут прийти в школу",
    adminAbsToday: "Отсутствуют сегодня:",
    adminAbsUnseen: "Новых:",
    adminAbsAll: "Все",
    adminAbsPending: "Новые",
    adminAbsSeen: "Просмотрено",
    adminAbsNew: "Новое",
    adminAbsEmpty: "Нет уведомлений в этом разделе",
    adminAbsEmptySub:
      'Когда ученики войдут и нажмут «Не смогу прийти», их дата и причина появятся здесь.',
    adminAbsMarkSeen: "Отметить просмотренным",
    adminAbsMarkUnseen: "Вернуть в новые",

    // Admin Roles
    rolesTitle: "Назначение ролей, со-админы и аккаунты",
    rolesSubtitle:
      "Назначайте дополнительных админов, задавайте им должности (например, Со-староста, Ответственный за дежурства) или создавайте новые аккаунты.",
    rolesSavePhone: "Сохранить мой номер",
    rolesAssignExisting: "Назначить роль существующему аккаунту",
    rolesSelectUser: "Выберите пользователя",
    rolesAccessLevel: "Уровень доступа",
    rolesSpecificTitle: "Должность / Звание",
    rolesSaveBtn: "Сохранить роль и должность",
    rolesAddNew: "Добавить нового пользователя",
    rolesUsername: "Имя пользователя *",
    rolesPassword: "Пароль (если пусто = 12345678)",
    rolesRoleTitle: "Должность",
    rolesPhoneOpt: "Телефон (необязательно)",
    rolesCreateBtn: "Создать и назначить роль",
    rolesAllAccounts: "Все аккаунты",
    rolesEditRole: "Изменить роль",
    rolesResetPw: "Сброс пароля",

    // Homework Page
    hwHeaderTitle: "Домашние задания MYP 3",
    hwHeaderSubtitle: "Задания по предметам от старост класса",
    hwAllSubjects: "Все предметы",
    hwSearchPlaceholder: "Поиск по заданиям...",
    hwCompleted: "Выполнено",
    hwMarkDone: "Отметить сделанным",
    hwDueToday: "Сдать сегодня",
    hwDueTomorrow: "Сдать завтра",
    hwOverdue: "Просрочено",
    hwDueInDays: "Осталось",
    hwDays: "дн.",
    hwNoHomework: "Домашние задания пока не добавлены.",
    hwOpenLink: "Открыть ссылку",
    hwPostNew: "Добавить домашнее задание",
    hwManageTitle: "Управление домашними заданиями",
    hwManageSubtitle:
      "Публикуйте ДЗ по предметам, чтобы ученики видели задания и сроки на странице /homework",
    hwSubjectLabel: "Предмет",
    hwTitleLabel: "Название задания",
    hwDueDateLabel: "Срок сдачи",
    hwLinkLabel: "Ссылка / материал (необязательно)",
    hwDescLabel: "Описание задания",
    hwPublishBtn: "Опубликовать ДЗ",
    hwPostedList: "Опубликованные задания",

    // Roll-Call & Teacher/Class Logs
    rcTitle: "Ежедневная перекличка (Посещаемость)",
    rcSubtitle:
      "Отмечайте статус каждого ученика (Присутствует, Опоздал, Отсутствует, Уважительная причина)",
    rcMarkAllPresent: "Отметить всех присутствующими",
    rcSaveBtn: "Сохранить перекличку",
    rcSavedDates: "История перекличек",
    rcPresent: "Присутствует",
    rcLate: "Опоздал",
    rcAbsent: "Отсутствует",
    rcExcused: "Уважит.",
    rcReportedAbsent: "Предупредил",
    incTitle: "Журнал неявок учителей и отменённых уроков",
    incSubtitle:
      "Фиксируйте случаи, когда учитель не пришёл или урок не состоялся — вся история сохраняется",
    incTypeTeacher: "Учитель не пришёл",
    incTypeCancelled: "Урок не состоялся",
    incDateLabel: "Дата",
    incSubjectLabel: "Предмет",
    incTeacherLabel: "Имя учителя",
    incPeriodLabel: "Урок / Время (необязательно)",
    incNotesLabel: "Комментарий / Причина (необязательно)",
    incRecordBtn: "Записать в журнал",
    incHistoryTitle: "История записей",
    incFilterAll: "Все",
    incEmpty: "Записей о неявках учителей или отменённых уроках пока нет.",
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.en;

export function getTranslations(lang: AppLanguage) {
  return TRANSLATIONS[lang] ?? TRANSLATIONS.en;
}

export function translateDayName(
  day: string,
  lang: AppLanguage
): string {
  const t = getTranslations(lang);
  switch (day) {
    case "Monday":
      return t.dayMonday;
    case "Tuesday":
      return t.dayTuesday;
    case "Wednesday":
      return t.dayWednesday;
    case "Thursday":
      return t.dayThursday;
    case "Friday":
      return t.dayFriday;
    case "Saturday":
      return t.daySaturday;
    default:
      return day;
  }
}
