import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError, NotFoundError } from "@/lib/api-utils";
import { logAudit } from "@/lib/audit";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const teacherId = await requireTeacherId();
    const { examId } = await params;

    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    if (!exam || exam.teacherId !== teacherId) {
      throw new NotFoundError("الامتحان غير موجود");
    }

    await prisma.exam.update({ where: { id: examId }, data: { deletedAt: null } });
    await logAudit({
      teacherId,
      action: "EXAM_RESTORED",
      summary: `تمت استعادة الامتحان "${exam.title}" من سلة المحذوفات`,
      examId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
