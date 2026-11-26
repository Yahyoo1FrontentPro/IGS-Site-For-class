import {
  ActivityFeedItem,
  FairnessMode,
  MostImprovedResult,
  PointLog,
  Student,
  StudentScoreRow,
  Subject,
  SubjectChampion,
  Team,
  TeamBonus,
  TeamStanding,
  Week,
} from "@/types";

export function filterByWeek<T extends { week_id: string }>(
  items: T[],
  selectedWeekId: string
): T[] {
  if (selectedWeekId === "all") return items;
  return items.filter((item) => item.week_id === selectedWeekId);
}

export function calculateTeamStandings(
  teams: Team[],
  students: Student[],
  pointLogs: PointLog[],
  teamBonuses: TeamBonus[],
  fairnessMode: FairnessMode
): TeamStanding[] {
  const activeStudents = students.filter((s) => s.is_active);

  const rawStandings: Omit<TeamStanding, "rank">[] = teams.map((team) => {
    const teamMembers = activeStudents.filter((s) => s.team_id === team.id);
    const memberCount = teamMembers.length;

    const studentPoints = pointLogs
      .filter((log) => log.team_id === team.id)
      .reduce((sum, log) => sum + log.points, 0);

    const teamBonusRows = teamBonuses.filter((b) => b.team_id === team.id);
    const bonusPoints = teamBonusRows.reduce((sum, b) => sum + b.points, 0);
    const comboCount = teamBonusRows.length;

    const totalPoints = studentPoints + bonusPoints;
    const divisor = Math.max(1, memberCount);
    const averagePoints = Number((totalPoints / divisor).toFixed(2));

    return {
      team,
      memberCount,
      studentPoints,
      bonusPoints,
      comboCount,
      totalPoints,
      averagePoints,
    };
  });

  const sorted = [...rawStandings].sort((a, b) => {
    if (fairnessMode === "average") {
      if (b.averagePoints !== a.averagePoints) return b.averagePoints - a.averagePoints;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    } else {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.averagePoints !== a.averagePoints) return b.averagePoints - a.averagePoints;
    }
    if (b.comboCount !== a.comboCount) return b.comboCount - a.comboCount;
    return a.team.sort_order - b.team.sort_order;
  });

  return sorted.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

export function calculateStudentLeaderboard(
  students: Student[],
  teams: Team[],
  pointLogs: PointLog[],
  filterSubjectId?: string
): StudentScoreRow[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const fallbackTeam: Team = teams[0] ?? {
    id: "unknown",
    name: "Unassigned",
    short_name: "Team",
    color: "#64748B",
    sort_order: 99,
    created_at: "",
  };

  const relevantLogs =
    filterSubjectId && filterSubjectId !== "all"
      ? pointLogs.filter((l) => l.subject_id === filterSubjectId)
      : pointLogs;

  const activeStudents = students.filter((s) => s.is_active);

  const rows: Omit<StudentScoreRow, "rank">[] = activeStudents.map((student) => {
    const sLogs = relevantLogs.filter((l) => l.student_id === student.id);
    let totalPoints = 0;
    let positivePoints = 0;
    let penaltyPoints = 0;
    let activeCount = 0;
    let starCount = 0;
    let aceCount = 0;
    let dutyCount = 0;
    let fairPlayCount = 0;
    const subjectPoints: Record<string, number> = {};

    for (const log of sLogs) {
      totalPoints += log.points;
      if (log.points > 0) positivePoints += log.points;
      if (log.points < 0) penaltyPoints += log.points;

      if (log.category === "Active") activeCount += 1;
      else if (log.category === "Star") starCount += 1;
      else if (log.category === "Ace") aceCount += 1;
      else if (log.category === "Duty") dutyCount += 1;
      else if (log.category === "Fair-Play") fairPlayCount += 1;

      subjectPoints[log.subject_id] = (subjectPoints[log.subject_id] ?? 0) + log.points;
    }

    return {
      student,
      team: teamMap.get(student.team_id) ?? fallbackTeam,
      totalPoints,
      positivePoints,
      penaltyPoints,
      activeCount,
      starCount,
      aceCount,
      dutyCount,
      fairPlayCount,
      subjectPoints,
    };
  });

  const sorted = [...rows].sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.positivePoints !== a.positivePoints) return b.positivePoints - a.positivePoints;
    if (b.aceCount !== a.aceCount) return b.aceCount - a.aceCount;
    if (b.starCount !== a.starCount) return b.starCount - a.starCount;
    return a.student.name.localeCompare(b.student.name);
  });

  let currentRank = 1;
  return sorted.map((row, index) => {
    if (index > 0 && row.totalPoints < sorted[index - 1].totalPoints) {
      currentRank = index + 1;
    }
    return {
      ...row,
      rank: currentRank,
    };
  });
}

export function calculateOverallMVP(leaderboard: StudentScoreRow[]): StudentScoreRow | null {
  if (leaderboard.length === 0) return null;
  const top = leaderboard[0];
  if (top.totalPoints <= 0) return null;
  return top;
}

export function calculateSubjectChampions(
  subjects: Subject[],
  students: Student[],
  teams: Team[],
  pointLogs: PointLog[]
): SubjectChampion[] {
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const activeStudents = students.filter((s) => s.is_active);
  const visibleSubjects = subjects.filter((sub) => !sub.is_hidden);

  return visibleSubjects.map((subject) => {
    const subLogs = pointLogs.filter((l) => l.subject_id === subject.id);
    if (subLogs.length === 0) {
      return {
        subject,
        student: null,
        team: null,
        points: 0,
        tiedCount: 0,
      };
    }

    const totals = activeStudents.map((student) => {
      const sLogs = subLogs.filter((l) => l.student_id === student.id);
      const pts = sLogs.reduce((sum, l) => sum + l.points, 0);
      const aces = sLogs.filter((l) => l.category === "Ace").length;
      const stars = sLogs.filter((l) => l.category === "Star").length;
      return { student, pts, aces, stars };
    });

    totals.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.aces !== a.aces) return b.aces - a.aces;
      if (b.stars !== a.stars) return b.stars - a.stars;
      return a.student.name.localeCompare(b.student.name);
    });

    const winner = totals[0];
    if (!winner || winner.pts <= 0) {
      return {
        subject,
        student: null,
        team: null,
        points: 0,
        tiedCount: 0,
      };
    }

    const tiedCount = totals.filter((t) => t.pts === winner.pts).length;

    return {
      subject,
      student: winner.student,
      team: teamMap.get(winner.student.team_id) ?? null,
      points: winner.pts,
      tiedCount,
    };
  });
}

export function calculateMostImproved(
  selectedWeekId: string,
  weeks: Week[],
  students: Student[],
  teams: Team[],
  allPointLogs: PointLog[]
): MostImprovedResult {
  if (selectedWeekId === "all") {
    const sortedWeeks = [...weeks].sort((a, b) => b.week_number - a.week_number);
    if (sortedWeeks.length < 2) {
      return {
        hasPreviousWeek: false,
        previousWeekName: null,
        student: null,
        team: null,
        currentPoints: 0,
        previousPoints: 0,
        delta: 0,
      };
    }
    // In All-Time mode, compare the latest active/most recent week against its predecessor
    const activeOrLatest = weeks.find((w) => w.is_active) ?? sortedWeeks[0];
    return calculateMostImproved(activeOrLatest.id, weeks, students, teams, allPointLogs);
  }

  const currentWeek = weeks.find((w) => w.id === selectedWeekId);
  if (!currentWeek) {
    return {
      hasPreviousWeek: false,
      previousWeekName: null,
      student: null,
      team: null,
      currentPoints: 0,
      previousPoints: 0,
      delta: 0,
    };
  }

  const previousWeeks = weeks
    .filter((w) => w.week_number < currentWeek.week_number)
    .sort((a, b) => b.week_number - a.week_number);

  const prevWeek = previousWeeks[0];
  if (!prevWeek) {
    return {
      hasPreviousWeek: false,
      previousWeekName: null,
      student: null,
      team: null,
      currentPoints: 0,
      previousPoints: 0,
      delta: 0,
    };
  }

  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const currentLogs = allPointLogs.filter((l) => l.week_id === currentWeek.id);
  const prevLogs = allPointLogs.filter((l) => l.week_id === prevWeek.id);
  const activeStudents = students.filter((s) => s.is_active);

  const comparisons = activeStudents.map((student) => {
    const currentPoints = currentLogs
      .filter((l) => l.student_id === student.id)
      .reduce((s, l) => s + l.points, 0);
    const previousPoints = prevLogs
      .filter((l) => l.student_id === student.id)
      .reduce((s, l) => s + l.points, 0);
    const delta = currentPoints - previousPoints;
    return { student, currentPoints, previousPoints, delta };
  });

  comparisons.sort((a, b) => {
    if (b.delta !== a.delta) return b.delta - a.delta;
    if (b.currentPoints !== a.currentPoints) return b.currentPoints - a.currentPoints;
    return a.student.name.localeCompare(b.student.name);
  });

  const best = comparisons[0];
  if (!best || best.delta <= 0) {
    return {
      hasPreviousWeek: true,
      previousWeekName: prevWeek.name,
      student: null,
      team: null,
      currentPoints: 0,
      previousPoints: 0,
      delta: 0,
    };
  }

  return {
    hasPreviousWeek: true,
    previousWeekName: prevWeek.name,
    student: best.student,
    team: teamMap.get(best.student.team_id) ?? null,
    currentPoints: best.currentPoints,
    previousPoints: best.previousPoints,
    delta: best.delta,
  };
}

export function buildActivityFeed(
  pointLogs: PointLog[],
  teamBonuses: TeamBonus[],
  students: Student[],
  teams: Team[],
  subjects: Subject[],
  limit = 25
): ActivityFeedItem[] {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const subjectMap = new Map(subjects.map((sub) => [sub.id, sub]));

  const fallbackTeam: Team = teams[0] ?? {
    id: "unknown",
    name: "Team",
    short_name: "Team",
    color: "#64748B",
    sort_order: 1,
    created_at: "",
  };

  const logItems: ActivityFeedItem[] = pointLogs.map((log) => {
    const student = studentMap.get(log.student_id);
    const team = teamMap.get(log.team_id) ?? (student ? teamMap.get(student.team_id) : undefined) ?? fallbackTeam;
    const subject = subjectMap.get(log.subject_id);

    return {
      id: `log-${log.id}`,
      type: "point",
      studentName: student?.name ?? "Student",
      team,
      subjectName: subject?.name ?? "General",
      category: log.category,
      points: log.points,
      reason: log.reason,
      date: log.date,
      createdAt: log.created_at,
    };
  });

  const bonusItems: ActivityFeedItem[] = teamBonuses.map((bonus) => {
    const team = teamMap.get(bonus.team_id) ?? fallbackTeam;
    return {
      id: `bonus-${bonus.id}`,
      type: "bonus",
      team,
      category: "Combo Streak",
      points: bonus.points,
      reason: bonus.reason,
      date: bonus.date,
      createdAt: bonus.created_at,
    };
  });

  return [...logItems, ...bonusItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return dateStr;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatTimestampRelative(isoStr: string): string {
  if (!isoStr) return "";
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getTodayDateISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
