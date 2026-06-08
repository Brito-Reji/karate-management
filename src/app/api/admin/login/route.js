// proxy.js

import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/admin/login",
  "/api/admin/login",
];

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    // If already logged in, redirect from login page
    if (pathname === "/admin/login") {
      const session = request.cookies.get("admin_session")?.value;
      if (session) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    return NextResponse.next();
  }

  // Check admin session cookie
  const session = request.cookies.get("admin_session")?.value;

  // Not logged in
  if (!session) {
    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }

  // Logged in
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};