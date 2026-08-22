import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

export async function POST() {
  try {
    const teacherId = await requireTeacherId();
    await prisma.notification.updateMany({
      where: { teacherId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
