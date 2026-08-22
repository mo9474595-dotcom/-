import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ teacherId: string }> };

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const adminId = await requireAdminId();
    const { teacherId } = await params;

    if (teacherId === adminId) {
      return NextResponse.json(
        { error: "لا يمكنك حذف حسابك الخاص من هنا" },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });
    }

    await prisma.teacher.delete({ where: { id: teacherId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
