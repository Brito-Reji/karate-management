import { type NextRequest, NextResponse } from "next/server";
import Dojo from "@/models/Dojo";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/requireAuth";
import { revalidateDojosCache } from "@/lib/cacheTags";
import { normalizeDojo } from "@/lib/dojoQueriesServer";
import {
  validateInstructorIds,
  syncUserDojoIdsForInstructors,
} from "@/lib/dojoInstructors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();

    const { name, location, instructor, instructors, instructorIds } =
      await request.json();
    const { id } = await params;

    const existing = await Dojo.findById(id).select("instructorIds").lean();
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Dojo not found" },
        { status: 404 }
      );
    }

    const finalInstructors = Array.isArray(instructors)
      ? instructors.filter(Boolean)
      : instructor
        ? [instructor]
        : [];

    const finalInstructor = finalInstructors.join(", ");

    const previousIds = (existing.instructorIds || []).map(String);
    const updatePayload: Record<string, unknown> = {
      name,
      location,
      instructor: finalInstructor,
      instructors: finalInstructors,
    };

    let nextIds = previousIds;
    if (instructorIds !== undefined) {
      const validatedInstructorIds = await validateInstructorIds(instructorIds);
      updatePayload.instructorIds = validatedInstructorIds;
      nextIds = validatedInstructorIds.map(String);
    }

    const dojo = await Dojo.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    }).lean();

    if (instructorIds !== undefined) {
      await syncUserDojoIdsForInstructors(id, previousIds, nextIds);
    }

    if (!dojo) {
      return NextResponse.json(
        { success: false, message: "Dojo not found" },
        { status: 404 }
      );
    }

    revalidateDojosCache();

    return NextResponse.json({
      success: true,
      dojo: normalizeDojo(dojo as Record<string, unknown>),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update dojo";
    const isValidation =
      message.includes("invalid") || message.includes("not approved");
    return NextResponse.json(
      { success: false, message: isValidation ? message : "Failed to update dojo" },
      { status: isValidation ? 400 : 500 }
    );
  }
}
