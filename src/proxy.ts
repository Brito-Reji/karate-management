import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { PORTALS, type PortalId } from "@/lib/portals";
import {
  getPortalFromHost,
  normalizePortalPathname,
  pathBelongsToPortal,
  portalAbsoluteUrl,
  portalForPath,
  portalHomePath,
  portalPath,
  subdomainRewritePath,
} from "@/lib/portalRouting";

const ADMIN_PUBLIC_PATHS = ["/admin/login", "/api/admin/login"];

function redirectTo(url: string, request: NextRequest) {
  return NextResponse.redirect(new URL(url, request.url));
}

async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);
  return payload.role as string | undefined;
}

async function handleAdminAuth(
  request: NextRequest,
  pathname: string,
  host: string
) {
  const token = request.cookies.get("token")?.value;

  if (ADMIN_PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    if (pathname === "/admin/login" && token) {
      try {
        await verifyToken(token);
        return redirectTo(portalPath("admin", "/dojos", host), request);
      } catch {
        // invalid token -> continue to login
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    return redirectTo(portalPath("admin", "/login", host), request);
  }

  try {
    const role = await verifyToken(token);

    if (pathname.startsWith("/admin/tests") && role !== "admin") {
      return redirectTo(portalPath("admin", "/dojos", host), request);
    }
    if (pathname.startsWith("/admin/exam-day") && role !== "admin") {
      return redirectTo(portalPath("admin", "/dojos", host), request);
    }
    if (pathname.startsWith("/admin/staff") && role !== "admin") {
      return redirectTo(portalPath("admin", "/dojos", host), request);
    }
    if (pathname.startsWith("/admin/applications") && role !== "admin") {
      return redirectTo(portalPath("admin", "/dojos", host), request);
    }

    return NextResponse.next();
  } catch {
    return redirectTo(portalPath("admin", "/login", host), request);
  }
}

function redirectToCorrectPortal(
  request: NextRequest,
  pathname: string,
  currentPortal: PortalId
) {
  const pathPortal = portalForPath(pathname);
  if (!pathPortal || pathPortal === currentPortal) return null;

  const proto = request.headers.get("x-forwarded-proto");
  return NextResponse.redirect(
    portalAbsoluteUrl(pathPortal, pathname, request.url, proto)
  );
}

function stripPortalPrefixRedirect(
  request: NextRequest,
  portal: PortalId,
  pathname: string
) {
  const base = PORTALS[portal].basePath;
  if (pathname === base || pathname.startsWith(`${base}/`)) {
    const clean = pathname.slice(base.length) || "/";
    return redirectTo(clean, request);
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const portal = getPortalFromHost(host);

  if (pathname.startsWith("/api/")) {
    if (
      pathname.startsWith("/api/admin/") &&
      !pathname.startsWith("/api/admin/login")
    ) {
      const token = request.cookies.get("token")?.value;
      if (!token) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
      try {
        await verifyToken(token);
      } catch {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
    }
    return NextResponse.next();
  }

  if (portal) {
    const prefixRedirect = stripPortalPrefixRedirect(request, portal, pathname);
    if (prefixRedirect) return prefixRedirect;

    if (pathname === "/") {
      return redirectTo(portalHomePath(portal, host), request);
    }

    const crossPortalRedirect = redirectToCorrectPortal(
      request,
      pathname,
      portal
    );
    if (crossPortalRedirect) return crossPortalRedirect;

    const internalPath = normalizePortalPathname(pathname, portal);

    if (portal === "admin") {
      const authResponse = await handleAdminAuth(
        request,
        internalPath,
        host
      );
      if (authResponse.status >= 300 && authResponse.status < 400) {
        return authResponse;
      }
      if (
        !internalPath.startsWith("/admin/") &&
        internalPath !== PORTALS.admin.basePath
      ) {
        return redirectTo(portalHomePath("admin", host), request);
      }
    }

    if (portal === "instructor") {
      if (
        !pathBelongsToPortal(internalPath, "instructor") &&
        !internalPath.startsWith("/register/")
      ) {
        return redirectTo(portalHomePath("instructor", host), request);
      }
    }

    if (portal === "student") {
      if (!pathBelongsToPortal(internalPath, "student")) {
        return redirectTo(portalHomePath("student", host), request);
      }
    }

    const rewritePath = subdomainRewritePath(portal, pathname);
    if (rewritePath && rewritePath !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = rewritePath;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  if (pathname === "/") {
    return redirectTo(portalPath("admin", "/login", host), request);
  }

  if (pathname.startsWith("/admin/") || pathname === PORTALS.admin.basePath) {
    return handleAdminAuth(request, pathname, host);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/instructor/:path*",
    "/student/:path*",
    "/register/:path*",
    "/api/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
