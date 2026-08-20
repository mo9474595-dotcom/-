import { prisma } from "@/lib/prisma";

/**
 * Records a sensitive manual action for accountability. Never throws —
 * a logging failure should not block the action it's describing.
 */
export async function logAudit(params: {
  teacherId: string;
  action: string;
  summary: string;
  classSectionId?: string;
  examId?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        teacherId: params.teacherId,
        action: params.action,
        summary: params.summary,
        classSectionId: params.classSectionId,
        examId: params.examId,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log", err);
  }
}
