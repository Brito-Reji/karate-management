// proxy.js

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = [
  "/admin/login",
  "/api/admin/login",
];

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    const token = request.cookies.get("token")?.value;

    // If already logged in, don't show login page again
    if (pathname === "/admin/login" && token) {
      try {
        const secret = new TextEncoder().encode(
          process.env.JWT_SECRET
        );

        await jwtVerify(token, secret);

        return NextResponse.redirect(
          new URL("/admin/dojos", request.url)
        );
      } catch {
        // invalid token -> continue to login page
      }
    }

    return NextResponse.next();
  }

  // Protect admin routes
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET
    );

    await jwtVerify(token, secret);

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(
      new URL("/admin/login", request.url)
    );
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};