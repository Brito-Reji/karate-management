import crypto from "crypto";
import { hashPassword, verifyPassword } from "@/lib/password";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export function generateOtp(): string {
  const max = 10 ** OTP_LENGTH;
  const num = crypto.randomInt(0, max);
  return num.toString().padStart(OTP_LENGTH, "0");
}

export async function hashOtp(otp: string): Promise<string> {
  return hashPassword(otp);
}

export async function verifyOtp(
  otp: string,
  storedHash: string | undefined | null
): Promise<boolean> {
  return verifyPassword(otp, storedHash);
}

export function getOtpExpiry(): Date {
  return new Date(Date.now() + OTP_EXPIRY_MS);
}

export function isOtpExpired(expiresAt: Date | undefined | null): boolean {
  if (!expiresAt) return true;
  return expiresAt.getTime() < Date.now();
}
