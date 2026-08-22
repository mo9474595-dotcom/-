import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError, NotFoundError } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ notificationId: string }> };

export async function PATCH(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { notificationId } = await params;

    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification || notification.teacherId !== teacherId) {
      throw new NotFoundError("الإشعار غير موجود");
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
    return NextResponse.json({ notification: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
