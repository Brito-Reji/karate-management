import { SignJWT, jwtVerify } from "jose";
import { type NextResponse } from "next/server";
import { getCookieDomain } from "@/lib/portalRouting";

export const AUTH_COOKIE_NAME = "token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type AuthTokenPayload = {
  userId: string;
  name: string;
  role: "admin" | "instructor" | "student";
};

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET);
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAuthToken(
  token: string
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      name: payload.name as string,
      role: payload.role as AuthTokenPayload["role"],
    };
  } catch {
    return null;
  }
}

export async function setAuthCookie(
  response: NextResponse,
  payload: AuthTokenPayload
): Promise<void> {
  const token = await signAuthToken(payload);
  const cookieDomain = getCookieDomain();
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });
}

export function clearAuthCookie(response: NextResponse): void {
  const cookieDomain = getCookieDomain();
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });
}
