import connectDB from "@/lib/db";
import Student from "@/models/Student";
import BeltProgression from "@/models/BeltProgression";
import mongoose from "mongoose";
import { BELTS } from "@/lib/constants";
import { requireAdmin } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

// POST — promote a student's belt
export async function POST(request, { params }) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const { beltName, awardedDate, examiner, notes, status = "Pass", instructorId } =
      await request.json();

    const normalizedInstructorId =
      typeof instructorId === "string" && mongoose.Types.ObjectId.isValid(instructorId)
        ? new mongoose.Types.ObjectId(instructorId)
        : null;

    const student = await Student.findById(id).lean();
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    const newBelt = BELTS.find((b) => b.name === beltName);
    if (!newBelt) {
      return NextResponse.json(
        { success: false, message: "Invalid belt" },
        { status: 400 }
      );
    }

    const currentBelt = BELTS.find((b) => b.name === student.belt);
    if (currentBelt && newBelt.rank <= currentBelt.rank) {
      return NextResponse.json(
        { success: false, message: "New belt must be higher than current belt" },
        { status: 400 }
      );
    }

    let updatedStudent = student;
    if (status === "Pass") {
      updatedStudent = await Student.findByIdAndUpdate(
        id,
        { belt: beltName, updatedBy: user.userId, updatedAt: new Date() },
        { new: true }
      ).lean();
    }

    const progression = await BeltProgression.create({
      studentId: student._id,
      beltName,
      fromBelt: student.belt,
      rank: newBelt.rank,
      awardedDate: awardedDate || new Date(),
      examiner: examiner || user.name,
      instructorId: normalizedInstructorId,
      notes,
      status,
    });

    return NextResponse.json({ success: true, student: updatedStudent, progression });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to promote student", error: error.message },
      { status: 500 }
    );
  }
}
