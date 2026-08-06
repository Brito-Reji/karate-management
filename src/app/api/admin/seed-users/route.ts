import connectDB from "@/lib/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/password";
import { type NextRequest, NextResponse } from "next/server";

// Seed staff users — requires header: x-seed-secret: <SEED_SECRET>
// Set SEED_SECRET in env. Without it, seeding is disabled.
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

  try {
    await connectDB();

    const users: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role: "admin" | "instructor";
    }[] = [
      {
        name: "Sensei Martin",
        email: "martinskarateacademy@gmail.com",
        phone: "9999999999",
        password: "martinskarateoffical@123",
        role: "admin",
      },
      {
        name: "Staff One",
        email: "staff1@martinskarate.com",
        phone: "9000000001",
        password: "staff@123456",
        role: "instructor",
      },
      {
        name: "Staff Two",
        email: "staff2@martinskarate.com",
        phone: "9000000002",
        password: "staff@123456",
        role: "instructor",
      },
      {
        name: "Staff Three",
        email: "staff3@martinskarate.com",
        phone: "9000000003",
        password: "staff@123456",
        role: "instructor",
      },
      {
        name: "Staff Four",
        email: "staff4@martinskarate.com",
        phone: "9000000004",
        password: "staff@123456",
        role: "instructor",
      },
    ];

    const results: string[] = [];

    for (const u of users) {
      const exists = await User.findOne({
        $or: [{ email: u.email }, { phone: u.phone }],
      });

      if (exists) {
        results.push(`${u.name} — already exists, skipped`);
        continue;
      }

      const hashed = await hashPassword(u.password);
      await User.create({ ...u, password: hashed });
      results.push(`${u.name} — created`);
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to seed users", error: error.message },
      { status: 500 }
    );
  }
}
