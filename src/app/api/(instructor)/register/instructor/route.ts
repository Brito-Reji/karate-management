import connectDB from "@/lib/db";
import User from "@/models/User";
import Dojo from "@/models/Dojo";
import { isDuplicateKeyError } from "@/lib/requireAuth";
import { hashPassword } from "@/lib/password";
import { generateOtp, getOtpExpiry, hashOtp } from "@/lib/otp";
import { sendInstructorOtpEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await connectDB();
    const { name, email, phone, password, confirmPassword, dojoIds, avatarUrl, avatarPublicId, bio } =
      await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    if (!phone?.trim()) {
      return NextResponse.json(
        { success: false, message: "Phone number is required" },
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

    if (!Array.isArray(dojoIds) || dojoIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "Select at least one dojo" },
        { status: 400 }
      );
    }

    const validDojos = await Dojo.find({ _id: { $in: dojoIds } }).select("_id");
    if (validDojos.length !== dojoIds.length) {
      return NextResponse.json(
        { success: false, message: "One or more selected dojos are invalid" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const hashed = await hashPassword(password);
    const otp = generateOtp();
    const otpHash = await hashOtp(otp);
    const otpExpiresAt = getOtpExpiry();

    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      if (existing.emailVerified) {
        return NextResponse.json(
          { success: false, message: "A user with this email already exists" },
          { status: 409 }
        );
      }

      if (existing.role !== "instructor") {
        return NextResponse.json(
          { success: false, message: "A user with this email already exists" },
          { status: 409 }
        );
      }

      existing.name = name.trim();
      existing.phone = phone.trim();
      existing.password = hashed;
      existing.dojoIds = dojoIds;
      existing.emailOtpHash = otpHash;
      existing.emailOtpExpiresAt = otpExpiresAt;
      existing.appliedAt = new Date();
      if (avatarUrl) {
        existing.avatarUrl = avatarUrl.trim();
        existing.avatarPublicId = avatarPublicId?.trim();
      }
      if (typeof bio === "string") existing.bio = bio.trim().slice(0, 500);
      await existing.save();

      await sendInstructorOtpEmail(normalizedEmail, otp, name.trim());

      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message: "Verification code sent to your email.",
        email: normalizedEmail,
      });
    }

    const existingPhone = await User.findOne({ phone: phone.trim() });
    if (existingPhone && existingPhone.emailVerified) {
      return NextResponse.json(
        { success: false, message: "A user with this phone number already exists" },
        { status: 409 }
      );
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashed,
      role: "instructor",
      approvalStatus: "pending",
      isBlocked: true,
      emailVerified: false,
      emailOtpHash: otpHash,
      emailOtpExpiresAt: otpExpiresAt,
      dojoIds,
      appliedAt: new Date(),
      avatarUrl: avatarUrl?.trim() || undefined,
      avatarPublicId: avatarPublicId?.trim() || undefined,
      bio: bio?.trim()?.slice(0, 500) || undefined,
    });

    await sendInstructorOtpEmail(normalizedEmail, otp, name.trim());

    const safe = user.toObject();
    delete safe.password;
    delete safe.refreshToken;
    delete safe.emailOtpHash;

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      message: "Verification code sent to your email.",
      email: normalizedEmail,
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return NextResponse.json(
        { success: false, message: "A user with this email or phone already exists" },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : "Registration failed";
    return NextResponse.json(
      { success: false, message: message.includes("Email service") ? message : "Registration failed", error: message },
      { status: 500 }
    );
  }
}
