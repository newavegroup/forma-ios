import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "forma-dev-secret-change-in-prod"
);

// Paths that don't require auth
const PUBLIC_PREFIXES = ["/login", "/api/auth"];

// Static assets matcher — never protected
const STATIC_PATTERN = /^\/_next\/|^\/favicon|\.ico$|\.png$|\.jpg$|\.svg$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATIC_PATTERN.test(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // Expired or tampered token — clear cookie and redirect
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
