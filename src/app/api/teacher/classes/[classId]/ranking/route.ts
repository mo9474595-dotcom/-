import { NextRequest, NextResponse } from "next/server";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedClassSection } from "@/lib/exams";
import { computeClassRanking } from "@/lib/ranking";

type RouteParams = { params: Promise<{ classId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { classId } = await params;
    await getOwnedClassSection(teacherId, classId);

    const ranking = await computeClassRanking(classId);
    return NextResponse.json({ ranking });
  } catch (err) {
    return handleApiError(err);
  }
}
