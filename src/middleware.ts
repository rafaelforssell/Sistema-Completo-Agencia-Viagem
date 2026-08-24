import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "sav_token";
const PUBLIC_PATHS = ["/login"];

function isTokenValid(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const payload = decodeJwt(token) as { exp?: number };
    if (!payload.exp) return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const authenticated = isTokenValid(token);
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!authenticated && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (authenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
