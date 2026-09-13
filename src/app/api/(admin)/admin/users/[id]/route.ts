import connectDB from "@/lib/db";
import User from "@/models/User";
import { requireAdmin } from "@/lib/requireAuth";
import { setAuthCookie } from "@/lib/authCookie";
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
    const isBlocked = body?.isBlocked;

    const hasRole = role !== undefined;
    const hasBlocked = isBlocked !== undefined;

    if (!hasRole && !hasBlocked) {
      return NextResponse.json(
        { success: false, message: "Nothing to update" },
        { status: 400 }
      );
    }

    if (hasRole && !isStaffRole(role)) {
      return NextResponse.json(
        { success: false, message: "Role must be admin or instructor" },
        { status: 400 }
      );
    }

    if (hasBlocked && typeof isBlocked !== "boolean") {
      return NextResponse.json(
        { success: false, message: "isBlocked must be a boolean" },
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
        { success: false, message: "Only staff accounts can be updated here" },
        { status: 400 }
      );
    }

    if (hasBlocked && isBlocked) {
      if (actor.userId === target._id.toString()) {
        return NextResponse.json(
          { success: false, message: "You cannot block yourself" },
          { status: 400 }
        );
      }

      if (target.role === "admin") {
        const activeAdminCount = await User.countDocuments({
          role: "admin",
          isBlocked: { $ne: true },
        });
        if (activeAdminCount <= 1) {
          return NextResponse.json(
            { success: false, message: "Cannot block the last active admin" },
            { status: 400 }
          );
        }
      }
    }

    let changed = false;

    if (hasRole && target.role !== role) {
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
      changed = true;
    }

    if (hasBlocked && target.isBlocked !== isBlocked) {
      target.isBlocked = isBlocked;
      if (isBlocked) {
        target.refreshToken = undefined;
      }
      changed = true;
    }

    if (!changed) {
      return NextResponse.json({ success: true, user: toSafeUser(target) });
    }

    target.updatedAt = new Date();
    await target.save();

    const selfUpdated = actor.userId === target._id.toString();
    const response = NextResponse.json({
      success: true,
      user: toSafeUser(target),
      selfUpdated,
    });

    if (selfUpdated && hasRole) {
      await setAuthCookie(response, {
        userId: target._id.toString(),
        name: target.name,
        role: target.role,
      });
    }

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update staff user";
    return NextResponse.json(
      { success: false, message: "Failed to update staff user", error: message },
      { status: 500 }
    );
  }
}
