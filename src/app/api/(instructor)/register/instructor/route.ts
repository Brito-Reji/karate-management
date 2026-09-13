import connectDB from "@/lib/db";
import User from "@/models/User";
import Dojo from "@/models/Dojo";
import { isDuplicateKeyError } from "@/lib/requireAuth";
import { hashPassword } from "@/lib/password";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    await connectDB();
    const { name, email, phone, password, confirmPassword, dojoIds } =
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

    const hashed = await hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password: hashed,
      role: "instructor",
      approvalStatus: "pending",
      isBlocked: true,
      dojoIds,
      appliedAt: new Date(),
    });

    const safe = user.toObject();
    delete safe.password;
    delete safe.refreshToken;

    return NextResponse.json({
      success: true,
      message:
        "Your application has been submitted. An admin will review it shortly.",
      user: safe,
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
      { success: false, message: "Registration failed", error: message },
      { status: 500 }
    );
  }
}
