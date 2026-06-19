// Простая сессия через cookie (без JWT — для простоты)
// На проде заменить на jose/iron-session

import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE_NAME = "avtobaks_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 дней

export async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE_NAME)?.value;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  return user;
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
