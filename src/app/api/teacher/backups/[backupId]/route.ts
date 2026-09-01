import { NextRequest, NextResponse } from "next/server";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedBackup } from "@/lib/exams";

type RouteParams = { params: Promise<{ backupId: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { backupId } = await params;
    const backup = await getOwnedBackup(teacherId, backupId);

    const filename = `نسخة-احتياطية-${backup.createdAt.toISOString().slice(0, 10)}.json`;
    return new NextResponse(backup.data, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
