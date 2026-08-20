import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedClassSection } from "@/lib/exams";
import { projectSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ classId: string }> };

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { classId } = await params;
    await getOwnedClassSection(teacherId, classId);

    const body = await req.json().catch(() => null);
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        classSectionId: classId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        maxScore: parsed.data.maxScore,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
