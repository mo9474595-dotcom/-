import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateExamCode } from "../src/lib/exam-codes";

const prisma = new PrismaClient();

async function main() {
  const email = "teacher@example.com";
  const password = "password123";

  const teacher = await prisma.teacher.upsert({
    where: { email },
    update: {},
    create: {
      name: "أستاذ تجريبي",
      email,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });

  const exam = await prisma.exam.create({
    data: {
      teacherId: teacher.id,
      title: "امتحان تجريبي - أساسيات البرمجة",
      description: "امتحان قصير للتجربة يحتوي على أسئلة اختيار من متعدد وصح/خطأ وإجابة قصيرة.",
      durationMinutes: 15,
      shuffleQuestions: true,
      shuffleChoices: true,
      maxTabViolations: 3,
      isPublished: true,
      questions: {
        create: [
          {
            type: "MULTIPLE_CHOICE",
            text: "ما هي اللغة المستخدمة لتنسيق صفحات الويب؟",
            points: 1,
            order: 0,
            choices: {
              create: [
                { text: "HTML", isCorrect: false, order: 0 },
                { text: "CSS", isCorrect: true, order: 1 },
                { text: "SQL", isCorrect: false, order: 2 },
                { text: "Python", isCorrect: false, order: 3 },
              ],
            },
          },
          {
            type: "TRUE_FALSE",
            text: "JavaScript هي نفسها Java.",
            points: 1,
            order: 1,
            correctAnswer: "false",
            choices: {
              create: [
                { text: "صح", isCorrect: false, order: 0 },
                { text: "خطأ", isCorrect: true, order: 1 },
              ],
            },
          },
          {
            type: "SHORT_ANSWER",
            text: "ما هو اختصار Hypertext Markup Language؟",
            points: 2,
            order: 2,
            correctAnswer: "HTML",
          },
        ],
      },
    },
  });

  const codes = Array.from({ length: 5 }, () => ({
    code: generateExamCode(),
    examId: exam.id,
  }));
  await prisma.examCode.createMany({ data: codes });

  const classSection = await prisma.classSection.create({
    data: {
      teacherId: teacher.id,
      name: "الصف الأول أ",
      examWeight: 50,
      manualGradeWeight: 20,
      projectWeight: 20,
      attendanceWeight: 10,
      students: {
        create: [
          { fullName: "أحمد محمد", studentRef: "101" },
          { fullName: "سارة علي", studentRef: "102" },
          { fullName: "خالد حسن", studentRef: "103" },
        ],
      },
    },
    include: { students: true },
  });

  const project = await prisma.project.create({
    data: {
      classSectionId: classSection.id,
      title: "مشروع نهاية الفصل",
      maxScore: 100,
    },
  });
  await prisma.projectGrade.create({
    data: {
      projectId: project.id,
      studentProfileId: classSection.students[0].id,
      score: 88,
      gradedAt: new Date(),
    },
  });

  await prisma.manualGrade.create({
    data: {
      studentProfileId: classSection.students[0].id,
      title: "اختبار قصير 1",
      score: 8,
      maxScore: 10,
    },
  });

  const session = await prisma.attendanceSession.create({
    data: { classSectionId: classSection.id, title: "محاضرة 1" },
  });
  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: session.id, studentProfileId: classSection.students[0].id, status: "PRESENT" },
      { sessionId: session.id, studentProfileId: classSection.students[1].id, status: "LATE" },
      { sessionId: session.id, studentProfileId: classSection.students[2].id, status: "ABSENT" },
    ],
  });

  console.log("Seed complete.");
  console.log("Teacher login:", email, "/", password);
  console.log("Exam codes:", codes.map((c) => c.code).join(", "));
  console.log("Class section:", classSection.name, "with", classSection.students.length, "students");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
