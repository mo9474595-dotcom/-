import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { z } from "zod";

export async function GET() {
  try {
    const teacherId = await requireTeacherId();
    const snippets = await prisma.feedbackSnippet.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ snippets });
  } catch (err) {
    return handleApiError(err);
  }
}

const createSchema = z.object({
  text: z.string().trim().min(1, "نص الملاحظة مطلوب").max(300),
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

    const snippet = await prisma.feedbackSnippet.create({
      data: { teacherId, text: parsed.data.text },
    });
    return NextResponse.json({ snippet }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
