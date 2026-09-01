import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const TEACHER_COOKIE = "teacher_token";
const TOKEN_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a long random string in your .env file."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createTeacherSession(teacherId: string, sessionVersion: number) {
  const token = await new SignJWT({ teacherId, sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(TEACHER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export async function clearTeacherSession() {
  const cookieStore = await cookies();
  cookieStore.delete(TEACHER_COOKIE);
}

export async function getTeacherIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TEACHER_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const teacherId = payload.teacherId;
    const sessionVersion = payload.sessionVersion;
    if (typeof teacherId !== "string" || typeof sessionVersion !== "number") return null;

    // A token signed before "logout everywhere" was bumped no longer
    // matches the account's current session version, so it's rejected
    // even though it hasn't hit its own expiry yet.
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      select: { sessionVersion: true },
    });
    if (!teacher || teacher.sessionVersion !== sessionVersion) return null;

    return teacherId;
  } catch {
    return null;
  }
}

export class UnauthorizedError extends Error {}

/** Returns the authenticated teacher's id, or throws UnauthorizedError. */
export async function requireTeacherId(): Promise<string> {
  const teacherId = await getTeacherIdFromSession();
  if (!teacherId) throw new UnauthorizedError("غير مصرح لك بالدخول");
  return teacherId;
}

/**
 * A teacher is an admin if their email is listed in ADMIN_EMAILS (a
 * comma-separated env var set only in deploy config, never through the
 * app itself) — there's no separate admin account type or sign-up path,
 * just an elevated view over the existing teacher accounts.
 */
export function isAdminEmail(email: string): boolean {
  const list = process.env.ADMIN_EMAILS;
  if (!list) return false;
  const normalized = email.trim().toLowerCase();
  return list
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}

/**
 * For a teaching-assistant account (Teacher.ownerId set), returns the
 * owning teacher's id — the account whose classes/exams/students the
 * assistant is meant to work within. For any regular teacher account
 * (ownerId null), returns their own id unchanged, so this is a no-op for
 * every existing caller. Only call this from the small set of routes that
 * are deliberately opened up to assistants (grading, feedback snippets,
 * the assistant's own read-only dashboard) — everywhere else keep using
 * requireTeacherId() directly so an assistant's access stays scoped to
 * exactly that allowlist.
 */
export async function resolveScopeTeacherId(teacherId: string): Promise<string> {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { ownerId: true },
  });
  return teacher?.ownerId ?? teacherId;
}

/** True if this account is a teaching assistant (works within another teacher's data). */
export async function isAssistantAccount(teacherId: string): Promise<boolean> {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { ownerId: true },
  });
  return teacher?.ownerId != null;
}

export class ForbiddenAdminError extends Error {}

/** Returns the authenticated admin's teacher id, or throws. */
export async function requireAdminId(): Promise<string> {
  const teacherId = await requireTeacherId();
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { email: true },
  });
  if (!teacher || !isAdminEmail(teacher.email)) {
    throw new ForbiddenAdminError("هذه الصفحة مخصصة للإدارة فقط");
  }
  return teacherId;
}
