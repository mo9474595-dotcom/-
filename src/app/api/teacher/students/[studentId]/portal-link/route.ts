import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedStudent } from "@/lib/exams";
import { nanoid } from "nanoid";

type RouteParams = { params: Promise<{ studentId: string }> };

// Regenerates a student's portal token, invalidating any previously shared link.
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { studentId } = await params;
    await getOwnedStudent(teacherId, studentId);

    const student = await prisma.studentProfile.update({
      where: { id: studentId },
      data: { portalToken: nanoid(24), portalAccessCount: 0, portalLastAccessAt: null },
      select: { portalToken: true },
    });

    return NextResponse.json({ portalToken: student.portalToken });
  } catch (err) {
    return handleApiError(err);
  }
}
