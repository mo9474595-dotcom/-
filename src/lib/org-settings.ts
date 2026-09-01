import { prisma } from "@/lib/prisma";

export type OrgSettings = { name: string; tagline: string; logoDataUrl: string | null };

// Defaults match the identity this deployment shipped with — an admin can
// override any of them from the admin panel without touching code.
export const DEFAULT_ORG_SETTINGS: OrgSettings = {
  name: "منظمة رياض النجاح",
  tagline: "للتنمية المستدامة",
  logoDataUrl: null,
};

export async function getOrgSettings(): Promise<OrgSettings> {
  const row = await prisma.orgSettings.findUnique({ where: { id: "singleton" } });
  if (!row) return DEFAULT_ORG_SETTINGS;
  return {
    name: row.name || DEFAULT_ORG_SETTINGS.name,
    tagline: row.tagline || DEFAULT_ORG_SETTINGS.tagline,
    logoDataUrl: row.logoDataUrl,
  };
}
