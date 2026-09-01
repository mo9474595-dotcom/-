import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId, resolveScopeTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedFeedbackSnippet } from "@/lib/exams";

type RouteParams = { params: Promise<{ snippetId: string }> };

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await resolveScopeTeacherId(await requireTeacherId());
    const { snippetId } = await params;
    await getOwnedFeedbackSnippet(teacherId, snippetId);

    await prisma.feedbackSnippet.delete({ where: { id: snippetId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
