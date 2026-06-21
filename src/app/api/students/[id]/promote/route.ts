import connectDB from "@/lib/db";
import Student from "@/models/Student";
import BeltProgression from "@/models/BeltProgression";
import { BELTS } from "@/lib/constants";
import { NextResponse } from "next/server";

// POST — promote a student's belt
export async function POST(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { beltName, awardedDate, examiner, notes } = await request.json();

    const student = await Student.findById(id);
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

    // update belt
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { belt: beltName, updatedAt: new Date() },
      { new: true }
    );

    // log the progression
    const progression = await BeltProgression.create({
      studentId: student._id,
      beltName,
      rank: newBelt.rank,
      awardedDate: awardedDate || new Date(),
      examiner,
      notes,
    });

    return NextResponse.json({ success: true, student: updatedStudent, progression });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to promote student", error: error.message },
      { status: 500 }
    );
  }
}
