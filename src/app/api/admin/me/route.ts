import connectDB from "@/lib/db";
import User from "@/models/User";
import { setAuthCookie, verifyAuthToken } from "@/lib/authCookie";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  const payload = await verifyAuthToken(token);
  if (!payload) {
    return NextResponse.json(
      { success: false, message: "Invalid token" },
      { status: 401 }
    );
  }

  try {
    await connectDB();
    const user = await User.findById(payload.userId)
      .select("name role isBlocked")
      .lean();

    if (!user || user.isBlocked) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const authUser = {
      userId: payload.userId,
      name: user.name,
      role: user.role,
    };

    const response = NextResponse.json({
      success: true,
      user: authUser,
    });

    if (user.name !== payload.name || user.role !== payload.role) {
      await setAuthCookie(response, authUser);
    }

    return response;
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to load user" },
      { status: 500 }
    );
  }
}
