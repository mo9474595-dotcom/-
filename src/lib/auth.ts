import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

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

export async function createTeacherSession(teacherId: string) {
  const token = await new SignJWT({ teacherId })
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
    return typeof payload.teacherId === "string" ? payload.teacherId : null;
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
