import connectDB from "@/lib/db";
import User from "@/models/User";
import {
  clearAuthCookie,
  setAuthCookie,
  verifyAuthToken,
} from "@/lib/authCookie";
import { type NextRequest, NextResponse } from "next/server";

function unauthenticatedResponse(message: string, clearCookie = false) {
  const response = NextResponse.json(
    { success: false, message },
    { status: 401 }
  );
  if (clearCookie) clearAuthCookie(response);
  return response;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) {
    return unauthenticatedResponse("Not authenticated");
  }

  const payload = await verifyAuthToken(token);
  if (!payload) {
    return unauthenticatedResponse("Invalid token", true);
  }

  try {
    await connectDB();
    const user = await User.findById(payload.userId)
      .select("name role isBlocked")
      .lean();

    if (!user || user.isBlocked) {
      return unauthenticatedResponse("Not authenticated", true);
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
