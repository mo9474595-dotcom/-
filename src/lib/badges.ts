export type Badge = {
  key: string;
  label: string;
  description: string;
  icon: "graduationCap" | "calendarCheck" | "clockHistory" | "shield" | "star";
  earned: boolean;
};

type FinishedExam = {
  attempt: { status: string; score: number | null; maxScore: number | null } | null;
};

type AttendanceRecord = { status: string };

// Purely cosmetic — computed on the fly from data the student portal already
// fetches, no schema or extra queries needed. None of this feeds into any
// actual grade or ranking; it only encourages good habits.
export function computeStudentBadges(
  finishedExams: FinishedExam[],
  attendanceRecords: AttendanceRecord[]
): Badge[] {
  const scored = finishedExams
    .map((c) => c.attempt)
    .filter(
      (a): a is { status: string; score: number; maxScore: number } =>
        a != null && a.score != null && a.maxScore != null && a.maxScore > 0
    );
  const pctOf = (a: { score: number; maxScore: number }) => (a.score / a.maxScore) * 100;

  const presentCount = attendanceRecords.filter((r) => r.status === "PRESENT").length;
  const attendanceRate =
    attendanceRecords.length > 0 ? presentCount / attendanceRecords.length : null;

  // "Recent" vs "earlier" halves for a trend: finishedExams is newest-first
  // (see the student portal query), so the first half is the more recent one.
  let mostImprovedEarned = false;
  if (scored.length >= 4) {
    const mid = Math.floor(scored.length / 2);
    const recent = scored.slice(0, mid);
    const earlier = scored.slice(mid);
    const avg = (list: typeof scored) => list.reduce((s, a) => s + pctOf(a), 0) / list.length;
    mostImprovedEarned = avg(recent) - avg(earlier) >= 10;
  }

  const highAchieverEarned = scored.length >= 2 && scored.reduce((s, a) => s + pctOf(a), 0) / scored.length >= 90;

  const punctualEarned =
    finishedExams.length >= 2 && finishedExams.every((c) => c.attempt?.status === "SUBMITTED");

  return [
    {
      key: "first_exam",
      label: "أول خطوة",
      description: "أكمل امتحانك الأول",
      icon: "graduationCap",
      earned: finishedExams.length >= 1,
    },
    {
      key: "regular_attendance",
      label: "الحضور المنتظم",
      description: "نسبة حضور 90% أو أكثر (3 جلسات على الأقل)",
      icon: "calendarCheck",
      earned: attendanceRecords.length >= 3 && (attendanceRate ?? 0) >= 0.9,
    },
    {
      key: "most_improved",
      label: "تحسّن ملحوظ",
      description: "ارتفاع واضح في متوسط الدرجات مؤخراً",
      icon: "clockHistory",
      earned: mostImprovedEarned,
    },
    {
      key: "punctual",
      label: "الالتزام والانضباط",
      description: "تسليم جميع الامتحانات في وقتها دون مخالفات",
      icon: "shield",
      earned: punctualEarned,
    },
    {
      key: "high_achiever",
      label: "الطالب المتفوق",
      description: "متوسط درجات 90% فأعلى في امتحانين على الأقل",
      icon: "star",
      earned: highAchieverEarned,
    },
  ];
}
