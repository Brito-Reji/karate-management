import connectDB from "@/lib/db";
import Student from "@/models/Student";
import BeltProgression from "@/models/BeltProgression";
import { requireStaff, canAccessStudent, isDuplicateKeyError } from "@/lib/requireAuth";
import { revalidateDojosCache } from "@/lib/cacheTags";
import { resequenceStudentIds } from "@/lib/resequenceStudentIds";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { user, error } = await requireStaff();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const student = await Student.findById(id).lean();
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }
    if (!canAccessStudent(user, student)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
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

export async function PUT(request, { params }) {
  const { user, error } = await requireStaff();
  if (error) return error;

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

    const existing = await Student.findById(id).select("createdBy dojoId status").lean();
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }
    if (!canAccessStudent(user, existing)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

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
    ).lean();

    revalidateDojosCache();

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

export async function DELETE(request, { params }) {
  const { user, error } = await requireStaff();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const existing = await Student.findById(id).select("createdBy").lean();
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }
    if (!canAccessStudent(user, existing)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const permanent = new URL(request.url).searchParams.get("permanent") === "1";

    if (permanent) {
      if (user.role !== "admin") {
        return NextResponse.json(
          { success: false, message: "Admin access required to permanently delete a student" },
          { status: 403 }
        );
      }

      await BeltProgression.deleteMany({ studentId: id });
      await Student.findByIdAndDelete(id);
      await resequenceStudentIds();
      revalidateDojosCache();

      return NextResponse.json({
        success: true,
        message: "Student deleted. Remaining student IDs were reassigned.",
      });
    }

    const student = await Student.findByIdAndUpdate(
      id,
      { status: "Inactive", updatedBy: user.userId, updatedAt: new Date() },
      { new: true }
    ).lean();

    revalidateDojosCache();

    return NextResponse.json({ success: true, message: "Student deactivated successfully", student });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete student", error: error.message },
      { status: 500 }
    );
  }
}
