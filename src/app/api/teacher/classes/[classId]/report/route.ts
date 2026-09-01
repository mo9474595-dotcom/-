import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError, NotFoundError } from "@/lib/api-utils";
import { computeClassRanking } from "@/lib/ranking";
import { getOrgSettings } from "@/lib/org-settings";
import { buildClassReportPptx } from "@/lib/class-report-pptx";

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

    const [ranking, orgSettings] = await Promise.all([
      computeClassRanking(classId),
      getOrgSettings(),
    ]);

    const buffer = await buildClassReportPptx({
      orgName: orgSettings.name,
      className: classSection.name,
      ranking,
    });

    const filename = `${classSection.name}-تقرير-الأداء.pptx`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
