import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const teacherId = await requireTeacherId();
    const backups = await prisma.backup.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    });
    return NextResponse.json({ backups });
  } catch (err) {
    return handleApiError(err);
  }
}
