"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/components/ui/UIProvider";
import Icon from "@/components/brand/Icon";

const MAX_LOGO_DIMENSION = 480;
const MAX_LOGO_DATA_URL_LENGTH = 400_000;

// Same client-side compress-before-upload approach as QuestionForm's
// question images: this stack stores images inline as data: URLs (no blob
// storage), so keeping the logo small matters for request size and DB rows.
function compressLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذرت قراءة الملف"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("الملف ليس صورة صالحة"));
      img.onload = () => {
        const scale = Math.min(1, MAX_LOGO_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("تعذرت معالجة الصورة"));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        let quality = 0.9;
        let dataUrl = canvas.toDataURL("image/png");
        // PNG keeps a logo's transparency/sharp edges; fall back to JPEG
        // only if that comes out too large.
        if (dataUrl.length > MAX_LOGO_DATA_URL_LENGTH) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
          while (dataUrl.length > MAX_LOGO_DATA_URL_LENGTH && quality > 0.2) {
            quality -= 0.15;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }
        }
        if (dataUrl.length > MAX_LOGO_DATA_URL_LENGTH) {
          reject(new Error("الصورة كبيرة جداً حتى بعد الضغط، جرّب صورة أخرى"));
          return;
        }
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function OrgBrandingEditor({
  initialName,
  initialTagline,
  initialLogoDataUrl,
}: {
  initialName: string;
  initialTagline: string;
  initialLogoDataUrl: string | null;
}) {
  const router = useRouter();
  const { toast } = useUI();
  const [name, setName] = useState(initialName);
  const [tagline, setTagline] = useState(initialTagline);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(initialLogoDataUrl);
  const [logoBusy, setLogoBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogoSelect(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("الملف المختار ليس صورة");
      return;
    }
    setError(null);
    setLogoBusy(true);
    try {
      const dataUrl = await compressLogo(file);
      setLogoDataUrl(dataUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تحميل الصورة");
    } finally {
      setLogoBusy(false);
    }
  }

  async function save() {
    setError(null);
    setSaving(true);
    const res = await fetch("/api/teacher/admin/org-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, tagline, logoDataUrl }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      setError(data?.error ?? "تعذر حفظ الإعدادات");
      return;
    }
    toast("تم حفظ الهوية البصرية", "success");
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <Icon name="palette" size={17} className="text-brand-blue" />
        الهوية البصرية للمنصة
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        الاسم والشعار والشعار المرئي الذي يظهر في كل صفحات المنصة. اتركها فارغة للعودة إلى الهوية
        الافتراضية.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">اسم المنظمة</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="منظمة رياض النجاح"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">الشعار النصي (Tagline)</span>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="للتنمية المستدامة"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoDataUrl} alt="الشعار" className="h-full w-full object-contain" />
          ) : (
            <Icon name="image" size={20} className="text-slate-300" />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
            <Icon name="upload" size={13} />
            {logoBusy ? "جارٍ المعالجة..." : "رفع شعار"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={logoBusy}
              onChange={(e) => handleLogoSelect(e.target.files?.[0])}
            />
          </label>
          {logoDataUrl && (
            <button
              onClick={() => setLogoDataUrl(null)}
              className="text-right text-xs text-slate-500 underline hover:text-red-600"
            >
              إزالة الشعار (استخدام الافتراضي)
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button
        onClick={save}
        disabled={saving || logoBusy}
        className="mt-4 flex items-center gap-1.5 rounded-full bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
      >
        <Icon name="save" size={14} />
        {saving ? "جارٍ الحفظ..." : "حفظ"}
      </button>
    </div>
  );
}
