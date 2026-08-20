import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError, NotFoundError } from "@/lib/api-utils";
import { computeClassRanking } from "@/lib/ranking";

function csvCell(value: string | number): string {
  const s = String(value);
  // Quote any cell that could otherwise break the CSV grid or be
  // misread as a formula by Excel/Sheets.
  if (/[",\n\r]/.test(s) || /^[=+\-@]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function pct(v: number | null): string {
  return v == null ? "" : v.toFixed(1);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const teacherId = await requireTeacherId();
    const { classId } = await params;

    const classSection = await prisma.classSection.findUnique({
      where: { id: classId },
      select: { id: true, name: true, teacherId: true, deletedAt: true },
    });
    if (!classSection || classSection.teacherId !== teacherId || classSection.deletedAt) {
      throw new NotFoundError("الشعبة غير موجودة");
    }

    const ranking = await computeClassRanking(classId);

    const header = [
      "الترتيب",
      "اسم الطالب",
      "الرقم التعريفي",
      "الامتحانات %",
      "درجات أخرى %",
      "المشاريع %",
      "الحضور %",
      "المعدل العام %",
    ];
    const rows = ranking.map((r, i) => [
      i + 1,
      r.fullName,
      r.studentRef ?? "",
      pct(r.examPct),
      pct(r.manualPct),
      pct(r.projectPct),
      pct(r.attendancePct),
      pct(r.overallPct),
    ]);

    const csv =
      "﻿" +
      [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

    const filename = `${classSection.name}-الدرجات.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
