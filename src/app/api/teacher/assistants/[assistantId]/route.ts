import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError, NotFoundError } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ assistantId: string }> };

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { assistantId } = await params;

    const assistant = await prisma.teacher.findUnique({ where: { id: assistantId } });
    if (!assistant || assistant.ownerId !== teacherId) {
      throw new NotFoundError("المساعد غير موجود");
    }

    await prisma.teacher.delete({ where: { id: assistantId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
