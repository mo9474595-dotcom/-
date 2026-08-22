import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    await requireAdminId();
    const teachers = await prisma.teacher.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { classSections: true, exams: true } },
      },
    });
    return NextResponse.json({ teachers });
  } catch (err) {
    return handleApiError(err);
  }
}
