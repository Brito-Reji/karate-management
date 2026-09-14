import connectDB from "@/lib/db";
import User from "@/models/User";
import { generateOtp, getOtpExpiry, hashOtp } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/email";
import { NextResponse } from "next/server";

const GENERIC_SUCCESS_MESSAGE =
  "If an account exists for this email, a reset code has been sent.";

function canResetPassword(user: {
  role: string;
  email?: string;
  emailVerified?: boolean;
  isBlocked?: boolean;
  approvalStatus?: string;
}): boolean {
  return (
    user.role === "instructor" &&
    Boolean(user.email) &&
    user.emailVerified === true &&
    user.isBlocked !== true &&
    user.approvalStatus !== "rejected"
  );
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const { email } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && canResetPassword(user)) {
      const otp = generateOtp();
      user.passwordResetOtpHash = await hashOtp(otp);
      user.passwordResetOtpExpiresAt = getOtpExpiry();
      await user.save();

      await sendPasswordResetEmail(normalizedEmail, otp, user.name);
    }

    return NextResponse.json({
      success: true,
      message: GENERIC_SUCCESS_MESSAGE,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send reset code";
    return NextResponse.json(
      {
        success: false,
        message: message.includes("Email service") ? message : "Failed to send reset code",
        error: message,
      },
      { status: 500 }
    );
  }
}
