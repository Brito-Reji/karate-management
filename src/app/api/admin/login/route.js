// app/api/admin/login/route.js

import { SignJWT } from "jose";
import { NextResponse } from "next/server";

export async function POST(req) {
  const { emailOrPhone, password } = await req.json();

  // Find admin in DB here

  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET
  );

  const token = await new SignJWT({
    role: "admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}