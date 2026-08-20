import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId, clearTeacherSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

// Invalidates every JWT issued for this account (including the one making
// this request) by bumping sessionVersion — useful if a device was lost or
// a session might have leaked, without waiting out the normal 12h expiry.
export async function POST() {
  try {
    const teacherId = await requireTeacherId();
    await prisma.teacher.update({
      where: { id: teacherId },
      data: { sessionVersion: { increment: 1 } },
    });
    await clearTeacherSession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
