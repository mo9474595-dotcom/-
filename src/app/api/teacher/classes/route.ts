import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { classSectionSchema } from "@/lib/validation";
import { z } from "zod";

export async function GET() {
  try {
    const teacherId = await requireTeacherId();
    const classes = await prisma.classSection.findMany({
      where: { teacherId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { students: true, projects: true, attendanceSessions: true } },
      },
    });
    return NextResponse.json({ classes });
  } catch (err) {
    return handleApiError(err);
  }
}

const createSchema = classSectionSchema.extend({
  force: z.coerce.boolean().default(false),
});

export async function POST(req: NextRequest) {
  try {
    const teacherId = await requireTeacherId();
    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { force, ...data } = parsed.data;

    if (!force) {
      const existing = await prisma.classSection.findFirst({
        where: {
          teacherId,
          deletedAt: null,
          name: { equals: data.name, mode: "insensitive" },
        },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json(
          {
            error: `لديك شعبة أخرى بنفس الاسم "${data.name}" بالفعل`,
            code: "DUPLICATE_NAME",
          },
          { status: 409 }
        );
      }
    }

    const classSection = await prisma.classSection.create({
      data: { ...data, teacherId },
    });

    return NextResponse.json({ classSection }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
