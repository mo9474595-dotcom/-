import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/api-utils";

/**
 * Loads an exam and verifies it belongs to the given teacher.
 * Returns the same "not found" error whether the exam doesn't exist or
 * belongs to someone else, so we never leak which exam IDs exist.
 */
export async function getOwnedExam(teacherId: string, examId: string) {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam || exam.teacherId !== teacherId || exam.deletedAt) {
    throw new NotFoundError("الامتحان غير موجود");
  }
  return exam;
}

export async function getOwnedClassSection(teacherId: string, classSectionId: string) {
  const classSection = await prisma.classSection.findUnique({
    where: { id: classSectionId },
  });
  if (!classSection || classSection.teacherId !== teacherId || classSection.deletedAt) {
    throw new NotFoundError("الشعبة غير موجودة");
  }
  return classSection;
}

export async function getOwnedStudent(teacherId: string, studentProfileId: string) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: studentProfileId },
    include: { classSection: true },
  });
  if (!student || student.classSection.teacherId !== teacherId) {
    throw new NotFoundError("الطالب غير موجود");
  }
  return student;
}

export async function getOwnedProject(teacherId: string, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { classSection: true },
  });
  if (!project || project.classSection.teacherId !== teacherId) {
    throw new NotFoundError("المشروع غير موجود");
  }
  return project;
}

export async function getOwnedAttendanceSession(teacherId: string, sessionId: string) {
  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { classSection: true },
  });
  if (!session || session.classSection.teacherId !== teacherId) {
    throw new NotFoundError("جلسة الحضور غير موجودة");
  }
  return session;
}

export async function getOwnedManualGrade(teacherId: string, gradeId: string) {
  const grade = await prisma.manualGrade.findUnique({
    where: { id: gradeId },
    include: { studentProfile: { include: { classSection: true } } },
  });
  if (!grade || grade.studentProfile.classSection.teacherId !== teacherId) {
    throw new NotFoundError("الدرجة غير موجودة");
  }
  return grade;
}

export async function getOwnedAttempt(teacherId: string, attemptId: string) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: { exam: true },
  });
  if (!attempt || attempt.exam.teacherId !== teacherId) {
    throw new NotFoundError("المحاولة غير موجودة");
  }
  return attempt;
}

export async function getOwnedQuestion(teacherId: string, questionId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { exam: true },
  });
  if (!question || question.exam.teacherId !== teacherId) {
    throw new NotFoundError("السؤال غير موجود");
  }
  return question;
}
