import connectDB from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "@/lib/requireAuth";
import { SignJWT } from "jose";
import { type NextRequest, NextResponse } from "next/server";

type StaffRole = "admin" | "instructor";

function isStaffRole(value: unknown): value is StaffRole {
  return value === "admin" || value === "instructor";
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

function toSafeUser(user: { toObject: () => Record<string, unknown> }) {
  const safe = user.toObject();
  delete safe.password;
  delete safe.refreshToken;
  return safe;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { user: actor, error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const role = body?.role;

    if (!isStaffRole(role)) {
      return NextResponse.json(
        { success: false, message: "Role must be admin or instructor" },
        { status: 400 }
      );
    }

    const target = await User.findById(id);
    if (!target) {
      return NextResponse.json(
        { success: false, message: "Staff user not found" },
        { status: 404 }
      );
    }

    if (!isStaffRole(target.role)) {
      return NextResponse.json(
        { success: false, message: "Only staff roles can be changed here" },
        { status: 400 }
      );
    }

    if (target.role === role) {
      return NextResponse.json({ success: true, user: toSafeUser(target) });
    }

    if (target.role === "admin" && role === "instructor") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json(
          { success: false, message: "Cannot demote the last admin" },
          { status: 400 }
        );
      }
    }

    target.role = role;
    target.updatedAt = new Date();
    await target.save();

    const selfUpdated = actor.userId === target._id.toString();
    const response = NextResponse.json({
      success: true,
      user: toSafeUser(target),
      selfUpdated,
    });

    if (selfUpdated) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const token = await new SignJWT({
        userId: target._id.toString(),
        name: target.name,
        role: target.role,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update role";
    return NextResponse.json(
      { success: false, message: "Failed to update role", error: message },
      { status: 500 }
    );
  }
}
