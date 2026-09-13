import { clearAuthCookie } from "@/lib/authCookie";
import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });
  clearAuthCookie(res);
  return res;
}
