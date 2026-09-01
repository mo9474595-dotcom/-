import { NextResponse } from "next/server";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { buildTeacherBackupPayload } from "@/lib/backup";

// A full JSON dump of everything the teacher owns, on demand — in addition
// to the scheduled automatic snapshots (see /api/cron/backups), this gives
// an immediate, always-current copy whenever the teacher wants one.
export async function GET() {
  try {
    const teacherId = await requireTeacherId();
    const payload = await buildTeacherBackupPayload(teacherId);

    const filename = `نسخة-احتياطية-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
