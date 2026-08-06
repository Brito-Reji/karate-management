import connectDB from "@/lib/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/password";
import { type NextRequest, NextResponse } from "next/server";

// Seed admin user — requires x-seed-secret header and admin env vars.
export async function POST(request: NextRequest) {
  const seedSecret = process.env.SEED_SECRET;
  if (!seedSecret) {
    return NextResponse.json(
      {
        success: false,
        message: "Seeding is disabled. Set SEED_SECRET in environment variables.",
      },
      { status: 403 }
    );
  }

  const provided = request.headers.get("x-seed-secret");
  if (provided !== seedSecret) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const name = process.env.ADMIN_NAME?.trim() || "Admin";
  const email = process.env.ADMIN_EMAIL?.trim();
  const phone = process.env.ADMIN_PHONE?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !phone || !password) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Set ADMIN_EMAIL, ADMIN_PHONE, and ADMIN_PASSWORD in environment variables.",
      },
      { status: 403 }
    );
  }

  try {
    await connectDB();

    const exists = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (exists) {
      return NextResponse.json({
        success: true,
        message: "Admin already exists, skipped",
      });
    }

    const hashed = await hashPassword(password);
    await User.create({
      name,
      email,
      phone,
      password: hashed,
      role: "admin",
    });

    return NextResponse.json({
      success: true,
      message: "Admin user created",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to seed users",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
