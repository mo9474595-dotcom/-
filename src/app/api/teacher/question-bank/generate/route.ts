import { NextRequest, NextResponse } from "next/server";
import pdfParse from "pdf-parse";
import { requireTeacherId } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { generateDraftQuestions } from "@/lib/question-generator";

const MAX_TEXT_LENGTH = 20_000;
const MAX_PDF_BYTES = 8 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    await requireTeacherId();

    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    let text = "";
    const file = form.get("file");
    if (file instanceof File) {
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: "الملف يجب أن يكون بصيغة PDF" }, { status: 400 });
      }
      if (file.size > MAX_PDF_BYTES) {
        return NextResponse.json({ error: "حجم الملف كبير جداً (الحد الأقصى 8 ميجابايت)" }, { status: 400 });
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await pdfParse(buffer).catch(() => null);
      if (!parsed) {
        return NextResponse.json({ error: "تعذرت قراءة محتوى ملف PDF" }, { status: 400 });
      }
      text = parsed.text;
    } else {
      const raw = form.get("text");
      text = typeof raw === "string" ? raw : "";
    }

    text = text.trim().slice(0, MAX_TEXT_LENGTH);
    if (text.length < 30) {
      return NextResponse.json(
        { error: "النص قصير جداً لتوليد أسئلة منه — أضف محتوى أطول" },
        { status: 400 }
      );
    }

    const drafts = generateDraftQuestions(text);
    if (drafts.length === 0) {
      return NextResponse.json(
        { error: "تعذر توليد أسئلة من هذا المحتوى، جرّب نصاً أوضح أو أطول" },
        { status: 400 }
      );
    }

    return NextResponse.json({ drafts });
  } catch (err) {
    return handleApiError(err);
  }
}
