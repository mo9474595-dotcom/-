import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedProject } from "@/lib/exams";
import { projectSchema } from "@/lib/validation";

type RouteParams = { params: Promise<{ projectId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { projectId } = await params;
    await getOwnedProject(teacherId, projectId);

    const body = await req.json().catch(() => null);
    const parsed = projectSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { title, description, maxScore, dueDate } = parsed.data;
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description: description || null } : {}),
        ...(maxScore !== undefined ? { maxScore } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      },
    });

    return NextResponse.json({ project });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { projectId } = await params;
    await getOwnedProject(teacherId, projectId);

    await prisma.project.delete({ where: { id: projectId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
