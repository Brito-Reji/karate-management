import { NextResponse } from "next/server";
import Dojo from "@/models/Dojo";
import connectDB from "@/lib/db";
import { requireStaff } from "@/lib/requireAuth";
import { revalidateDojosCache } from "@/lib/cacheTags";
import { getCachedDojosWithCounts } from "@/lib/dojoQueriesServer";
import {
  validateInstructorIds,
  syncUserDojoIdsForInstructors,
} from "@/lib/dojoInstructors";

export async function POST(request) {
  const { error } = await requireStaff();
  if (error) return error;

  try {
    await connectDB();

    const { name, location, instructor, instructors, instructorIds } =
      await request.json();

    const count = await Dojo.countDocuments();
    const dojoId = `DJ-${String(count + 1).padStart(2, "0")}`;

    const finalInstructors = Array.isArray(instructors)
      ? instructors.filter(Boolean)
      : instructor
        ? [instructor]
        : [];

    const finalInstructor = finalInstructors.join(", ");
    const validatedInstructorIds = await validateInstructorIds(instructorIds);

    const dojo = await Dojo.create({
      name,
      location,
      instructor: finalInstructor,
      instructors: finalInstructors,
      instructorIds: validatedInstructorIds,
      dojoId,
    });

    if (validatedInstructorIds.length > 0) {
      await syncUserDojoIdsForInstructors(
        String(dojo._id),
        [],
        validatedInstructorIds.map(String)
      );
    }

    revalidateDojosCache();

    return NextResponse.json({
      success: true,
      dojo,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create dojo";
    const isValidation =
      message.includes("invalid") || message.includes("not approved");
    return NextResponse.json(
      {
        success: false,
        message: isValidation ? message : "Failed to create dojo",
      },
      {
        status: isValidation ? 400 : 500,
      }
    );
  }
}

export async function GET(request) {
  const { error } = await requireStaff();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get("page")) || 1;
    const limit = Math.min(Number(searchParams.get("limit")) || 4, 100);
    const search = searchParams.get("search")?.trim() || "";

    const result = await getCachedDojosWithCounts(page, limit, search);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
