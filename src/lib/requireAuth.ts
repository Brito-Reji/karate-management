import connectDB from "@/lib/db";
import User from "@/models/User";
import { verifyAuthToken } from "@/lib/authCookie";
import { getAssignedDojoIds, isDojoAssignedToInstructor } from "@/lib/instructorDojos";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type AuthUser = {
  userId: string;
  name: string;
  role: "admin" | "instructor" | "student";
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload) return null;

  await connectDB();
  const user = await User.findById(payload.userId)
    .select("name role isBlocked")
    .lean();

  if (!user || user.isBlocked) return null;

  return {
    userId: payload.userId,
    name: user.name,
    role: user.role as AuthUser["role"],
  };
}

const STAFF_ROLES: AuthUser["role"][] = ["admin", "instructor"];

export async function requireStaff() {
  const user = await getAuthUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      ),
    };
  }
  if (!STAFF_ROLES.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      ),
    };
  }
  return { user, error: null };
}

/** Admins see all students; instructors see students in their assigned dojos. */
export async function getStudentScopeFilter(
  user: AuthUser
): Promise<Record<string, unknown>> {
  if (user.role === "admin") return {};

  const dojoIds = await getAssignedDojoIds(user.userId);
  if (dojoIds.length === 0) {
    return { dojoId: { $in: ["__no_match__"] } };
  }
  return { dojoId: { $in: dojoIds } };
}

export async function canAccessStudent(
  user: AuthUser,
  student: { dojoId?: string | null; createdBy?: string | null }
): Promise<boolean> {
  if (user.role === "admin") return true;
  if (!student.dojoId) return false;
  return isDojoAssignedToInstructor(user.userId, student.dojoId);
}

export async function assertInstructorCanUseDojo(
  user: AuthUser,
  dojoId: string | undefined | null
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (user.role === "admin") return { ok: true };
  if (!dojoId?.trim()) {
    return { ok: false, message: "Dojo is required for instructor-created students" };
  }
  const allowed = await isDojoAssignedToInstructor(user.userId, dojoId);
  if (!allowed) {
    return { ok: false, message: "You are not assigned to this dojo" };
  }
  return { ok: true };
}

export async function requireAdmin() {
  const user = await getAuthUser();
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      ),
    };
  }
  if (user.role !== "admin") {
    return {
      user: null,
      error: NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      ),
    };
  }
  return { user, error: null };
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}
