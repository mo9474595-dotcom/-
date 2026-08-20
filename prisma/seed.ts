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

  console.log("Seed complete.");
  console.log("Teacher login:", email, "/", password);
  console.log("Exam codes:", codes.map((c) => c.code).join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
