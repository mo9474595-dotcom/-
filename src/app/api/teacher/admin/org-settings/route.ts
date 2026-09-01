import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { orgSettingsSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest) {
  try {
    const adminId = await requireAdminId();

    const body = await req.json().catch(() => null);
    const parsed = orgSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { name, tagline, logoDataUrl } = parsed.data;
    const settings = await prisma.orgSettings.upsert({
      where: { id: "singleton" },
      create: {
        name: name || null,
        tagline: tagline || null,
        logoDataUrl: logoDataUrl || null,
      },
      update: {
        name: name || null,
        tagline: tagline || null,
        logoDataUrl: logoDataUrl || null,
      },
    });

    await logAudit({
      teacherId: adminId,
      action: "ORG_SETTINGS_UPDATED",
      summary: "تم تحديث الهوية البصرية للمنصة",
    });

    return NextResponse.json({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}
