import { prisma } from "@/lib/prisma";

export type StudentBreakdown = {
  studentId: string;
  fullName: string;
  studentRef: string | null;
  examPct: number | null;
  examCount: number;
  manualPct: number | null;
  manualCount: number;
  projectPct: number | null;
  projectCount: number;
  attendancePct: number | null;
  attendanceSessions: number;
  overallPct: number | null;
};

/**
 * Computes each student's weighted overall percentage for a class, sorted
 * best-first. A category with no data yet (e.g. no exams graded) is simply
 * left out of that student's average instead of counting as a zero — its
 * weight is redistributed across whatever categories the student does have
 * data in, so an ungraded student isn't unfairly ranked last.
 */
export async function computeClassRanking(
  classSectionId: string
): Promise<StudentBreakdown[]> {
  const classSection = await prisma.classSection.findUniqueOrThrow({
    where: { id: classSectionId },
    include: {
      students: {
        include: {
          examCodes: { include: { attempt: true } },
          manualGrades: true,
          projectGrades: { include: { project: true } },
          attendanceRecords: true,
        },
      },
      attendanceSessions: { select: { id: true } },
    },
  });

  const totalSessions = classSection.attendanceSessions.length;
  const weights = {
    exam: classSection.examWeight,
    manual: classSection.manualGradeWeight,
    project: classSection.projectWeight,
    attendance: classSection.attendanceWeight,
  };

  const results: StudentBreakdown[] = classSection.students.map((student) => {
    const finishedAttempts = student.examCodes
      .map((c) => c.attempt)
      .filter(
        (a): a is NonNullable<typeof a> =>
          Boolean(a) && a!.status !== "IN_PROGRESS" && a!.maxScore != null
      );
    const examScoreSum = finishedAttempts.reduce((s, a) => s + (a.score ?? 0), 0);
    const examMaxSum = finishedAttempts.reduce((s, a) => s + (a.maxScore ?? 0), 0);
    const examPct = examMaxSum > 0 ? (examScoreSum / examMaxSum) * 100 : null;

    const manualScoreSum = student.manualGrades.reduce((s, g) => s + g.score, 0);
    const manualMaxSum = student.manualGrades.reduce((s, g) => s + g.maxScore, 0);
    const manualPct = manualMaxSum > 0 ? (manualScoreSum / manualMaxSum) * 100 : null;

    const gradedProjects = student.projectGrades.filter((g) => g.score != null);
    const projectScoreSum = gradedProjects.reduce((s, g) => s + (g.score ?? 0), 0);
    const projectMaxSum = gradedProjects.reduce((s, g) => s + g.project.maxScore, 0);
    const projectPct = projectMaxSum > 0 ? (projectScoreSum / projectMaxSum) * 100 : null;

    let attendancePct: number | null = null;
    if (totalSessions > 0) {
      const recordBySession = new Map(
        student.attendanceRecords.map((r) => [r.sessionId, r])
      );
      let earned = 0;
      let countable = 0;
      for (const session of classSection.attendanceSessions) {
        const record = recordBySession.get(session.id);
        if (record?.status === "EXCUSED") continue;
        countable += 1;
        if (record?.status === "PRESENT") earned += 1;
        else if (record?.status === "LATE") earned += 0.5;
      }
      attendancePct = countable > 0 ? (earned / countable) * 100 : null;
    }

    const components = [
      { pct: examPct, weight: weights.exam },
      { pct: manualPct, weight: weights.manual },
      { pct: projectPct, weight: weights.project },
      { pct: attendancePct, weight: weights.attendance },
    ].filter((c): c is { pct: number; weight: number } => c.pct != null);

    const weightSum = components.reduce((s, c) => s + c.weight, 0);
    const overallPct =
      weightSum > 0
        ? components.reduce((s, c) => s + (c.pct * c.weight) / weightSum, 0)
        : null;

    return {
      studentId: student.id,
      fullName: student.fullName,
      studentRef: student.studentRef,
      examPct,
      examCount: finishedAttempts.length,
      manualPct,
      manualCount: student.manualGrades.length,
      projectPct,
      projectCount: gradedProjects.length,
      attendancePct,
      attendanceSessions: totalSessions,
      overallPct,
    };
  });

  results.sort((a, b) => (b.overallPct ?? -1) - (a.overallPct ?? -1));
  return results;
}
