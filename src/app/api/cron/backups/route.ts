import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildTeacherBackupPayload } from "@/lib/backup";

// How many automatic snapshots to keep per teacher — old ones beyond this
// are pruned right after a new one is written, so this table can't grow
// unbounded no matter how long the cron job has been running.
const MAX_BACKUPS_PER_TEACHER = 10;

// Triggered by the Vercel Cron schedule in vercel.json. When CRON_SECRET is
// set, only requests carrying it are accepted — Vercel sends it
// automatically as a Bearer token on scheduled invocations, so this also
// blocks the endpoint from being triggered by anyone who finds the URL.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
  }

  const teachers = await prisma.teacher.findMany({ select: { id: true } });

  let created = 0;
  for (const { id: teacherId } of teachers) {
    const payload = await buildTeacherBackupPayload(teacherId);
    await prisma.backup.create({
      data: { teacherId, data: JSON.stringify(payload) },
    });
    created += 1;

    const stale = await prisma.backup.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
      skip: MAX_BACKUPS_PER_TEACHER,
      select: { id: true },
    });
    if (stale.length > 0) {
      await prisma.backup.deleteMany({ where: { id: { in: stale.map((b) => b.id) } } });
    }
  }

  return NextResponse.json({ ok: true, teachersBackedUp: created });
}
