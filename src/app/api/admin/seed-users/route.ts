import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

// seed admin users — call this once via POST /api/admin/seed-users
export async function POST() {
  try {
    await connectDB();

    const users = [
      {
        name: "Sensei Martin",
        email: "martinskarateacademy@gmail.com",
        phone: "9999999999",
        password: "martinskarateoffical@123",
        role: "admin",
      },
      // add more users here
      // {
      //   name: "Person 2",
      //   email: "person2@example.com",
      //   phone: "8888888888",
      //   password: "password123",
      //   role: "admin",
      // },
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

      await User.create(u);
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
