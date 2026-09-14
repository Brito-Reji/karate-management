import { PORTALS, type PortalId } from "@/lib/portals";

const SUBDOMAIN_BY_PORTAL: Record<PortalId, string> = {
  admin: "admin",
  instructor: "instructor",
  student: "student",
};

/** Production apex domain, e.g. `martinskarate.com` (no protocol). */
export function getAppDomain(): string {
  return (
    process.env.NEXT_PUBLIC_APP_DOMAIN?.trim() ||
    process.env.APP_DOMAIN?.trim() ||
    ""
  );
}

export function portalSubdomain(portal: PortalId): string {
  return SUBDOMAIN_BY_PORTAL[portal];
}

export function getPortalFromHost(host: string): PortalId | null {
  const hostname = host.split(":")[0].toLowerCase();

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    const sub = hostname.split(".")[0];
    if (sub === "admin") return "admin";
    if (sub === "instructor") return "instructor";
    if (sub === "student") return "student";
    return null;
  }

  const domain = getAppDomain();
  if (!domain) return null;
  if (hostname === domain) return null;

  for (const portal of Object.keys(SUBDOMAIN_BY_PORTAL) as PortalId[]) {
    if (hostname === `${SUBDOMAIN_BY_PORTAL[portal]}.${domain}`) {
      return portal;
    }
  }

  return null;
}

/** Internal Next.js route path (always includes portal basePath). */
export function portalSegmentPath(portal: PortalId, segment: string): string {
  const base = PORTALS[portal].basePath;
  const normalized = segment.startsWith("/") ? segment : `/${segment}`;

  if (normalized === base || normalized.startsWith(`${base}/`)) {
    return normalized;
  }

  if (portal === "instructor" && normalized.startsWith("/register")) {
    return `${base}${normalized}`;
  }

  if (normalized === "/") {
    return portalHomeInternal(portal);
  }

  return `${base}${normalized}`;
}

export function portalHomeInternal(portal: PortalId): string {
  switch (portal) {
    case "admin":
      return "/admin/dojos";
    case "instructor":
      return "/instructor/dojos";
    case "student":
      return "/student";
  }
}

export function portalForPath(pathname: string): PortalId | null {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/instructor") || pathname.startsWith("/register")) {
    return "instructor";
  }
  if (pathname === "/student" || pathname.startsWith("/student/")) {
    return "student";
  }
  return null;
}

export function pathBelongsToPortal(pathname: string, portal: PortalId): boolean {
  const base = PORTALS[portal].basePath;
  if (pathname === base || pathname.startsWith(`${base}/`)) return true;
  if (portal === "instructor" && pathname.startsWith("/register")) return true;
  return false;
}

function shouldUseSubdomainUrls(): boolean {
  return Boolean(getAppDomain()) || process.env.NODE_ENV === "development";
}

function devPortSuffix(): string {
  if (process.env.NODE_ENV !== "development") return "";
  return `:${process.env.NEXT_PUBLIC_DEV_PORT || "3000"}`;
}

/** Browser-visible path for a portal route (subdomain-aware). Pass host from request/context. */
export function portalPath(
  portal: PortalId,
  segment: string,
  host?: string
): string {
  const internal = portalSegmentPath(portal, segment);

  if (host && getPortalFromHost(host) === portal) {
    const base = PORTALS[portal].basePath;
    const publicPath = internal.slice(base.length);
    return publicPath || "/";
  }

  return internal;
}

export function portalHomePath(portal: PortalId, host?: string): string {
  switch (portal) {
    case "admin":
      return portalPath("admin", "/dojos", host);
    case "instructor":
      return portalPath("instructor", "/dojos", host);
    case "student":
      return portalPath("student", "/", host);
  }
}

export function portalAbsoluteUrl(
  portal: PortalId,
  pathname: string,
  requestUrl: string,
  proto?: string | null
): string {
  const url = new URL(requestUrl);
  const domain = getAppDomain();

  if (domain) {
    url.hostname = `${portalSubdomain(portal)}.${domain}`;
    url.port = "";
  } else {
    url.hostname = `${portalSubdomain(portal)}.localhost`;
  }

  if (proto) {
    url.protocol = `${proto}:`;
  }

  const pathPortal = portalForPath(pathname);
  if (pathPortal === portal) {
    const base = PORTALS[portal].basePath;
    const segment = pathname.slice(base.length) || "/";
    url.pathname = portalPath(portal, segment, url.host);
  } else {
    url.pathname = portalPath(portal, pathname, url.host);
  }

  return url.toString();
}

/** Build absolute URL for a portal (SSR-safe, no window). */
export function portalAbsoluteHref(
  portal: PortalId,
  segment: string
): string {
  const domain = getAppDomain() || "localhost";
  const port = devPortSuffix();
  const targetHost = `${portalSubdomain(portal)}.${domain}${port}`;
  const proto = process.env.NODE_ENV === "development" ? "http" : "https";
  const path = portalPath(portal, segment, targetHost);
  return `${proto}://${portalSubdomain(portal)}.${domain}${port}${path}`;
}

/**
 * Link to a portal route. SSR-safe when currentHost is passed (via PortalHostProvider).
 * Cross-portal links use subdomain URLs in dev / when APP_DOMAIN is set.
 */
export function portalHref(
  portal: PortalId,
  segment: string,
  currentHost?: string
): string {
  const currentPortal = currentHost ? getPortalFromHost(currentHost) : null;

  if (currentPortal === portal) {
    return portalPath(portal, segment, currentHost);
  }

  if (!shouldUseSubdomainUrls()) {
    return portalSegmentPath(portal, segment);
  }

  return portalAbsoluteHref(portal, segment);
}

/** Map subdomain URL path to internal Next.js route, or null if already internal. */
export function subdomainRewritePath(
  portal: PortalId,
  pathname: string
): string | null {
  const base = PORTALS[portal].basePath;

  if (pathname === base || pathname.startsWith(`${base}/`)) {
    return null;
  }

  if (pathname === "/") {
    return portalHomeInternal(portal);
  }

  if (portal === "instructor" && pathname.startsWith("/register")) {
    return portalSegmentPath("instructor", pathname);
  }

  return `${base}${pathname}`;
}

/** Normalize subdomain pathname to internal form for route matching. */
export function normalizePortalPathname(
  pathname: string,
  portal: PortalId
): string {
  const base = PORTALS[portal].basePath;
  if (pathname === base || pathname.startsWith(`${base}/`)) {
    return pathname;
  }

  const rewritten = subdomainRewritePath(portal, pathname);
  return rewritten ?? pathname;
}

export function matchesPortalPath(
  pathname: string,
  portal: PortalId,
  segment: string,
  host?: string
): boolean {
  const internal = portalSegmentPath(portal, segment);
  const normalized = normalizePortalPathname(pathname, portal);
  const publicPath = portalPath(portal, segment, host);

  const matches = (value: string, base: string) =>
    value === base || value.startsWith(`${base}/`);

  return (
    matches(normalized, internal) ||
    matches(pathname, publicPath) ||
    matches(pathname, internal)
  );
}

export function getCookieDomain(): string | undefined {
  const domain = getAppDomain();
  if (!domain) return undefined;
  return `.${domain}`;
}
