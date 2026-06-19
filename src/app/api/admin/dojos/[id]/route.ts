import { type NextRequest, NextResponse } from "next/server";
import Dojo from "@/models/Dojo";
import connectDB from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, { params }: RouteContext) {
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
    );

    if (!dojo) {
      return NextResponse.json(
        { success: false, message: "Dojo not found" },
        { status: 404 }
      );
    }

    const d = dojo.toObject();
    if (!d.instructors || d.instructors.length === 0) {
      d.instructors = d.instructor
        ? d.instructor.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
    }

    return NextResponse.json({ success: true, dojo: d });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update dojo" },
      { status: 500 }
    );
  }
}
