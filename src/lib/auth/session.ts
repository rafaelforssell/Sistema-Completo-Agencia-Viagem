import "server-only";
import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { env } from "@/lib/env";

const COOKIE_MAX_AGE = 60 * 60 * 12; // 12 horas

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(env.authCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(env.authCookieName);
}

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(env.authCookieName)?.value;
}

interface TokenPayload {
  sub?: string;
  exp?: number;
  nome?: string;
  email?: string;
}

export async function getSession(): Promise<TokenPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;
  try {
    const payload = decodeJwt(token) as TokenPayload;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
