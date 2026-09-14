import connectDB from "@/lib/db";
import Student from "@/models/Student";
import BeltProgression from "@/models/BeltProgression";
import { enrichStudentHistoryWithFromBelt } from "@/lib/beltHistory";
import { requireStaff, canAccessStudent } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

// GET belt history for a student
export async function GET(request, { params }) {
  const { user, error } = await requireStaff();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    const student = await Student.findById(id).select("dojoId createdBy").lean();
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }
    if (!(await canAccessStudent(user, student))) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const history = await BeltProgression.find({ studentId: id })
      .sort({ awardedDate: -1, createdAt: -1 })
      .lean();

    const enriched = enrichStudentHistoryWithFromBelt(history);

    return NextResponse.json({ success: true, history: enriched });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to load belt history" },
      { status: 500 }
    );
  }
}
