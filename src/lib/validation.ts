import { z } from "zod";

export const teacherRegisterSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(100),
  email: z.string().trim().email("بريد إلكتروني غير صالح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export const teacherLoginSchema = z.object({
  email: z.string().trim().email("بريد إلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const examSchema = z.object({
  title: z.string().trim().min(3, "عنوان الامتحان قصير جداً").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  shuffleQuestions: z.coerce.boolean().default(true),
  shuffleChoices: z.coerce.boolean().default(true),
  maxTabViolations: z.coerce.number().int().min(0).max(20).default(3),
});

export const choiceSchema = z.object({
  text: z.string().trim().min(1, "نص الخيار مطلوب").max(500),
  isCorrect: z.coerce.boolean().default(false),
});

export const questionSchema = z.object({
  type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]),
  text: z.string().trim().min(1, "نص السؤال مطلوب").max(4000),
  points: z.coerce.number().int().min(1).max(100).default(1),
  correctAnswer: z.string().trim().max(1000).optional().or(z.literal("")),
  choices: z.array(choiceSchema).optional(),
});

export const joinExamSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "رمز الامتحان غير صالح")
    .max(40)
    .transform((v) => v.toUpperCase()),
  studentName: z.string().trim().min(2, "الاسم قصير جداً").max(150),
  studentRef: z.string().trim().max(100).optional().or(z.literal("")),
});

export const answerSchema = z.object({
  questionId: z.string().min(1),
  selectedChoiceId: z.string().min(1).optional(),
  textAnswer: z.string().max(5000).optional(),
});

export const cheatEventSchema = z.object({
  type: z.enum([
    "TAB_HIDDEN",
    "WINDOW_BLUR",
    "FULLSCREEN_EXIT",
    "COPY_ATTEMPT",
    "PASTE_ATTEMPT",
    "CONTEXT_MENU",
    "DEVTOOLS_SUSPECTED",
    "MULTIPLE_SESSION_BLOCKED",
    "SHORTCUT_BLOCKED",
  ]),
  detail: z.string().max(300).optional(),
});
