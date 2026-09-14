import connectDB from "@/lib/db";
import User from "@/models/User";
import { generateOtp, getOtpExpiry, hashOtp } from "@/lib/otp";
import { sendPasswordResetEmail } from "@/lib/email";
import { NextResponse } from "next/server";

const RESEND_COOLDOWN_MS = 60 * 1000;

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

    if (!user || !canResetPassword(user)) {
      return NextResponse.json(
        { success: false, message: "Unable to resend code for this email" },
        { status: 404 }
      );
    }

    if (user.passwordResetOtpExpiresAt) {
      const lastSentAt = user.passwordResetOtpExpiresAt.getTime() - 10 * 60 * 1000;
      const elapsed = Date.now() - lastSentAt;
      if (elapsed < RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${waitSeconds}s before requesting a new code`,
            retryAfter: waitSeconds,
          },
          { status: 429 }
        );
      }
    }

    const otp = generateOtp();
    user.passwordResetOtpHash = await hashOtp(otp);
    user.passwordResetOtpExpiresAt = getOtpExpiry();
    await user.save();

    await sendPasswordResetEmail(normalizedEmail, otp, user.name);

    return NextResponse.json({
      success: true,
      message: "A new reset code has been sent.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resend code";
    return NextResponse.json(
      {
        success: false,
        message: message.includes("Email service") ? message : "Failed to resend code",
        error: message,
      },
      { status: 500 }
    );
  }
}
