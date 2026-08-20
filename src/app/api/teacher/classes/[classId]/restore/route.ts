import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError, NotFoundError } from "@/lib/api-utils";
import { logAudit } from "@/lib/audit";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const teacherId = await requireTeacherId();
    const { classId } = await params;

    const classSection = await prisma.classSection.findUnique({ where: { id: classId } });
    if (!classSection || classSection.teacherId !== teacherId) {
      throw new NotFoundError("الشعبة غير موجودة");
    }

    await prisma.classSection.update({ where: { id: classId }, data: { deletedAt: null } });
    await logAudit({
      teacherId,
      action: "CLASS_RESTORED",
      summary: `تمت استعادة الشعبة "${classSection.name}" من سلة المحذوفات`,
      classSectionId: classId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
