import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedManualGrade } from "@/lib/exams";

type RouteParams = { params: Promise<{ gradeId: string }> };

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { gradeId } = await params;
    await getOwnedManualGrade(teacherId, gradeId);

    await prisma.manualGrade.delete({ where: { id: gradeId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
