import connectDB from "@/lib/db";
import User from "@/models/User";
import { isOtpExpired, verifyOtp } from "@/lib/otp";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await connectDB();
    const { email, otp } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    if (!otp?.trim() || !/^\d{6}$/.test(otp.trim())) {
      return NextResponse.json(
        { success: false, message: "Enter a valid 6-digit code" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
      role: "instructor",
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "No registration found for this email" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "Email already verified.",
        alreadyVerified: true,
      });
    }

    if (isOtpExpired(user.emailOtpExpiresAt)) {
      return NextResponse.json(
        { success: false, message: "Code expired. Please request a new one." },
        { status: 400 }
      );
    }

    const valid = await verifyOtp(otp.trim(), user.emailOtpHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Invalid verification code" },
        { status: 400 }
      );
    }

    user.emailVerified = true;
    user.emailOtpHash = undefined;
    user.emailOtpExpiresAt = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message:
        "Email verified! Your application has been submitted for admin approval.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json(
      { success: false, message: "Verification failed", error: message },
      { status: 500 }
    );
  }
}
