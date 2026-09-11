import connectDB from "@/lib/db";
import User from "@/models/User";
import { requireAdmin, isDuplicateKeyError } from "@/lib/requireAuth";
import { hashPassword } from "@/lib/password";
import { NextResponse } from "next/server";

// GET all staff users
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();
    const users = await User.find({ role: { $in: ["admin", "instructor"] } })
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, users });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Failed to load users", error: err.message },
      { status: 500 }
    );
  }
}

// CREATE a new staff user (admin or instructor)
export async function POST(request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();
    const { name, email, phone, password, role = "instructor" } = await request.json();

    if (!name || !password) {
      return NextResponse.json(
        { success: false, message: "Name and password are required" },
        { status: 400 }
      );
    }

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, message: "Email or phone is required" },
        { status: 400 }
      );
    }

    if (!["admin", "instructor"].includes(role)) {
      return NextResponse.json(
        { success: false, message: "Role must be admin or instructor" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(password);

    const user = await User.create({
      name,
      email: email || undefined,
      phone: phone || undefined,
      password: hashed,
      role,
    });

    const safe = user.toObject();
    delete safe.password;
    delete safe.refreshToken;

    return NextResponse.json({ success: true, user: safe });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return NextResponse.json(
        { success: false, message: "A user with this email or phone already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to create user", error: err.message },
      { status: 500 }
    );
  }
}
