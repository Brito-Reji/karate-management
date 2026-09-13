import { type NextRequest, NextResponse } from "next/server";
import Dojo from "@/models/Dojo";
import connectDB from "@/lib/db";
import { requireStaff } from "@/lib/requireAuth";
import { revalidateDojosCache } from "@/lib/cacheTags";
import { normalizeDojo } from "@/lib/dojoQueriesServer";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { error } = await requireStaff();
  if (error) return error;

  try {
    await connectDB();

    const { name, location, instructor, instructors } = await request.json();
    const { id } = await params;
    
    const finalInstructors = Array.isArray(instructors)
      ? instructors.filter(Boolean)
      : (instructor ? [instructor] : []);

    const finalInstructor = finalInstructors.join(", ");

    const dojo = await Dojo.findByIdAndUpdate(
      id,
      {
        name,
        location,
        instructor: finalInstructor,
        instructors: finalInstructors,
      },
      { new: true, runValidators: true }
    ).lean();

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
    return NextResponse.json(
      { success: false, message: "Failed to update dojo" },
      { status: 500 }
    );
  }
}
