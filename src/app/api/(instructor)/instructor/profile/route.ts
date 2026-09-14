import connectDB from "@/lib/db";
import User from "@/models/User";
import { requireStaff } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

export async function GET() {
  const { user, error } = await requireStaff();
  if (error) return error;

  if (user.role !== "instructor") {
    return NextResponse.json(
      { success: false, message: "Instructor access required" },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const profile = await User.findById(user.userId)
      .select("name email phone bio avatarUrl avatarPublicId role approvalStatus")
      .lean();

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, profile });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load profile";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
