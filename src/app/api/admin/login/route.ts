import connectDB from "@/lib/db";
import User from "@/models/User";
import { hashPassword, verifyPassword, isHashedPassword } from "@/lib/password";
import { setAuthCookie } from "@/lib/authCookie";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  await connectDB();
  const { identifier, password } = await req.json();

  const user = await User.findOne({
    $or: [{ email: identifier }, { phone: identifier }],
  });

  if (!user || !(await verifyPassword(password, user.password))) {
    return NextResponse.json(
      { success: false, error: "Invalid credentials" },
      { status: 401 }
    );
  }

  // Upgrade legacy plain-text passwords to bcrypt on successful login
  if (user.password && !isHashedPassword(user.password)) {
    user.password = await hashPassword(password);
    await user.save();
  }

  const response = NextResponse.json({
    success: true,
    user: { name: user.name, role: user.role },
  });

  await setAuthCookie(response, {
    userId: user._id.toString(),
    name: user.name,
    role: user.role,
  });

  return response;
}
