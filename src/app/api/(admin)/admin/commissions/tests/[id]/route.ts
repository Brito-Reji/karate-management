import connectDB from "@/lib/db";
import { assertInstructorOnStudentDojo } from "@/lib/commissions";
import BeltProgression from "@/models/BeltProgression";
import Student from "@/models/Student";
import { requireAdmin } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const { instructorId } = await request.json();

    if (!instructorId || typeof instructorId !== "string") {
      return NextResponse.json(
        { success: false, message: "instructorId is required" },
        { status: 400 }
      );
    }

    const progression = await BeltProgression.findById(id).lean();
    if (!progression) {
      return NextResponse.json(
        { success: false, message: "Test not found" },
        { status: 404 }
      );
    }

    const student = await Student.findById(progression.studentId).select("dojoId").lean();
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    const check = await assertInstructorOnStudentDojo(student.dojoId, instructorId);
    if (check.ok === false) {
      return NextResponse.json({ success: false, message: check.message }, { status: 400 });
    }

    const updated = await BeltProgression.findByIdAndUpdate(
      id,
      { instructorId, examiner: check.instructorName },
      { new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      entry: {
        _id: String(updated!._id),
        instructorId: String(updated!.instructorId),
        instructorName: check.instructorName,
        examiner: updated!.examiner ?? check.instructorName,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to assign instructor" },
      { status: 500 }
    );
  }
}
