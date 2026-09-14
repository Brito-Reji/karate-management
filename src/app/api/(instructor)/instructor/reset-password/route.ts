import connectDB from "@/lib/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/password";
import { isOtpExpired, verifyOtp } from "@/lib/otp";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await connectDB();
    const { email, otp, password, confirmPassword } = await request.json();

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

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Password is required" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: "Passwords do not match" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
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
        { success: false, message: "Invalid reset request" },
        { status: 400 }
      );
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { success: false, message: "This account is blocked" },
        { status: 403 }
      );
    }

    if (user.approvalStatus === "rejected") {
      return NextResponse.json(
        { success: false, message: "This account is not eligible for password reset" },
        { status: 403 }
      );
    }

    if (isOtpExpired(user.passwordResetOtpExpiresAt)) {
      return NextResponse.json(
        { success: false, message: "Code expired. Please request a new one." },
        { status: 400 }
      );
    }

    const valid = await verifyOtp(otp.trim(), user.passwordResetOtpHash);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Invalid reset code" },
        { status: 400 }
      );
    }

    user.password = await hashPassword(password);
    user.passwordResetOtpHash = undefined;
    user.passwordResetOtpExpiresAt = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Your password has been reset. You can now sign in.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Password reset failed";
    return NextResponse.json(
      { success: false, message: "Password reset failed", error: message },
      { status: 500 }
    );
  }
}
