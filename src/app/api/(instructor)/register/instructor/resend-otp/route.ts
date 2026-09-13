import connectDB from "@/lib/db";
import User from "@/models/User";
import { generateOtp, getOtpExpiry, hashOtp } from "@/lib/otp";
import { sendInstructorOtpEmail } from "@/lib/email";
import { NextResponse } from "next/server";

const RESEND_COOLDOWN_MS = 60 * 1000;

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
      return NextResponse.json(
        { success: false, message: "Email is already verified" },
        { status: 400 }
      );
    }

    if (user.emailOtpExpiresAt) {
      const lastSentAt =
        user.emailOtpExpiresAt.getTime() - 10 * 60 * 1000;
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
    user.emailOtpHash = await hashOtp(otp);
    user.emailOtpExpiresAt = getOtpExpiry();
    await user.save();

    await sendInstructorOtpEmail(normalizedEmail, otp, user.name);

    return NextResponse.json({
      success: true,
      message: "A new verification code has been sent.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to resend code";
    return NextResponse.json(
      { success: false, message: message.includes("Email service") ? message : "Failed to resend code", error: message },
      { status: 500 }
    );
  }
}
