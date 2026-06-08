import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";

// get single student
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const student = await Student.findById(id)
      .populate("dojoLocation", "name")
      .lean();

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ student });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch student" },
      { status: 500 }
    );
  }
}

// update student
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // belt change — push old belt to history
    if (body.currentBelt && body.currentBelt !== student.currentBelt) {
      student.beltHistory.push({
        belt: student.currentBelt,
        dateEarned: student.dateOfLastTest || student.createdAt,
        notes: body.beltChangeNotes || "",
      });
      student.dateOfLastTest = body.dateOfLastTest || new Date();
    }

    // update fields
    const fieldsToUpdate = [
      "name",
      "phone",
      "dateOfBirth",
      "currentBelt",
      "dojoLocation",
      "dateOfLastTest",
      "profileImage",
    ];

    fieldsToUpdate.forEach((field) => {
      if (body[field] !== undefined) {
        student[field] = body[field];
      }
    });

    await student.save();

    return NextResponse.json({ student });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 }
    );
  }
}

// delete student
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Student deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete student" },
      { status: 500 }
    );
  }
}
