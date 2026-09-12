import connectDB from "@/lib/db";
import User from "@/models/User";
import { verifyAuthToken } from "@/lib/authCookie";
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

/** Admins see all students; instructors only see students they created. */
export function getStudentScopeFilter(user: AuthUser): Record<string, unknown> {
  if (user.role === "admin") return {};
  return { createdBy: user.userId };
}

export function canAccessStudent(
  user: AuthUser,
  student: { createdBy?: string | null }
): boolean {
  if (user.role === "admin") return true;
  return student.createdBy === user.userId;
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
