import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const teacherId = await requireTeacherId();
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { teacherId },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.notification.count({ where: { teacherId, read: false } }),
    ]);
    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    return handleApiError(err);
  }
}
