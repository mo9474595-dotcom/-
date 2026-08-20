import { cookies } from "next/headers";
import { randomBytes } from "crypto";

function cookieNameForAttempt(attemptId: string) {
  return `exam_${attemptId}`;
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function setExamSessionCookie(
  attemptId: string,
  sessionToken: string,
  expiresAt: Date
) {
  const cookieStore = await cookies();
  cookieStore.set(cookieNameForAttempt(attemptId), sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export async function getExamSessionToken(
  attemptId: string
): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(cookieNameForAttempt(attemptId))?.value ?? null;
}
