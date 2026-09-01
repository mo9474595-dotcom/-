import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminId, ForbiddenAdminError } from "@/lib/auth";
import { getOrgSettings } from "@/lib/org-settings";
import AdminTeachersClient from "./AdminTeachersClient";
import OrgBrandingEditor from "./OrgBrandingEditor";
import Icon from "@/components/brand/Icon";

export default async function AdminPage() {
  let adminId: string;
  try {
    adminId = await requireAdminId();
  } catch (err) {
    if (err instanceof ForbiddenAdminError) notFound();
    throw err;
  }

  const orgSettings = await getOrgSettings();

  const teachers = await prisma.teacher.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { classSections: true, exams: true } },
    },
  });

  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-navy-dark">
        <Icon name="shield" size={22} className="text-brand-blue" />
        إدارة الأساتذة
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        نظرة عامة على جميع حسابات الأساتذة المسجلين في المنصة.
      </p>
      <div className="mt-6">
        <OrgBrandingEditor
          initialName={orgSettings.name}
          initialTagline={orgSettings.tagline}
          initialLogoDataUrl={orgSettings.logoDataUrl}
        />
      </div>
      <div className="mt-6">
        <AdminTeachersClient initialTeachers={teachers} currentAdminId={adminId} />
      </div>
    </div>
  );
}
