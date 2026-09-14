import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/requireAuth";
import {
  getCachedDojoOptions,
  queryInstructorDojoOptions,
} from "@/lib/dojoQueriesServer";

export async function GET() {
  const { user, error } = await requireStaff();
  if (error) return error;

  try {
    const data =
      user.role === "instructor"
        ? await queryInstructorDojoOptions(user.userId)
        : await getCachedDojoOptions();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to load dojos" },
      { status: 500 }
    );
  }
}
