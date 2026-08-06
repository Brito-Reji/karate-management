import connectDB from "@/lib/db";
import Student, { ensureSharedPhoneAllowed } from "@/models/Student";
import { requireStaff, isDuplicateKeyError } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

// GET single student
export async function GET(request, { params }) {
  const { error } = await requireStaff();
  if (error) return error;

  try {
    await connectDB();
    await ensureSharedPhoneAllowed();
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
  const { user, error } = await requireStaff();
  if (error) return error;

  try {
    await connectDB();
    await ensureSharedPhoneAllowed();
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
        dojoId: dojoId?.trim() || undefined,
        dob: dob || undefined,
        gender: gender || undefined,
        phoneNumber: phoneNumber?.trim() || undefined,
        fatherName,
        motherName,
        admissionDate,
        belt,
        pendingFees,
        image,
        status,
        updatedBy: user.userId,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Student updated successfully", student });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return NextResponse.json(
        { success: false, message: "Could not update student due to a conflict. Please try again." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to update student", error: err.message },
      { status: 500 }
    );
  }
}

// SOFT DELETE
export async function DELETE(request, { params }) {
  const { user, error } = await requireStaff();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const student = await Student.findByIdAndUpdate(
      id,
      { status: "Inactive", updatedBy: user.userId, updatedAt: new Date() },
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
