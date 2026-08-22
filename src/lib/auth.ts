import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { randomBytes, createHash } from "crypto";
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

/** Generates a raw password-reset token and the hash of it to store in the DB. */
export function generatePasswordResetToken() {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);
  return { rawToken, tokenHash };
}

export function hashResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export class UnauthorizedError extends Error {}

/** Returns the authenticated teacher's id, or throws UnauthorizedError. */
export async function requireTeacherId(): Promise<string> {
  const teacherId = await getTeacherIdFromSession();
  if (!teacherId) throw new UnauthorizedError("غير مصرح لك بالدخول");
  return teacherId;
}
