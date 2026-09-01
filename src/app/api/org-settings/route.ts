import { NextResponse } from "next/server";
import { getOrgSettings } from "@/lib/org-settings";
import { handleApiError } from "@/lib/api-utils";

// Public and unauthenticated on purpose: this deployment's branding is
// shown on the student-facing join/exam pages, which have no login.
export async function GET() {
  try {
    const settings = await getOrgSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    return handleApiError(err);
  }
}
