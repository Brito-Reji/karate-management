import connectDB from "@/lib/db";
import Student from "@/models/Student";
import { NextResponse } from "next/server";

// GET single student
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, student });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to get student", error: error.message },
      { status: 500 }
    );
  }
}

// UPDATE student
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const {
      name,
      dojoId,
      dob,
      gender,
      phoneNumber,
      fatherName,
      motherName,
      admissionDate,
      belt,
      pendingFees,
      image,
      status,
    } = await request.json();

    const student = await Student.findByIdAndUpdate(
      id,
      {
        name,
        dojoId,
        dob,
        gender,
        phoneNumber,
        fatherName,
        motherName,
        admissionDate,
        belt,
        pendingFees,
        image,
        status,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Student updated successfully", student });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update student", error: error.message },
      { status: 500 }
    );
  }
}

// SOFT DELETE
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const student = await Student.findByIdAndUpdate(
      id,
      { status: "Inactive" },
      { new: true }
    );
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Student deleted successfully", student });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete student", error: error.message },
      { status: 500 }
    );
  }
}
