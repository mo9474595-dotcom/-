import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getOwnedAttendanceSession } from "@/lib/exams";
import { generateShortCode } from "@/lib/exam-codes";
import { z } from "zod";

type RouteParams = { params: Promise<{ sessionId: string }> };

const bodySchema = z.object({
  action: z.enum(["open", "close"]),
  minutes: z.coerce.number().int().min(1).max(180).default(15),
});

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const teacherId = await requireTeacherId();
    const { sessionId } = await params;
    await getOwnedAttendanceSession(teacherId, sessionId);

    const body = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const now = new Date();

    if (parsed.data.action === "close") {
      const session = await prisma.attendanceSession.update({
        where: { id: sessionId },
        data: { selfCheckinClosesAt: now },
      });
      return NextResponse.json({ session });
    }

    let code = generateShortCode();
    // Codes aren't scoped per-session in the schema, so guard the rare
    // collision against any other currently-open code.
    while (await prisma.attendanceSession.findUnique({ where: { selfCheckinCode: code } })) {
      code = generateShortCode();
    }

    const session = await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        selfCheckinCode: code,
        selfCheckinOpensAt: now,
        selfCheckinClosesAt: new Date(now.getTime() + parsed.data.minutes * 60_000),
      },
    });

    return NextResponse.json({ session });
  } catch (err) {
    return handleApiError(err);
  }
}
