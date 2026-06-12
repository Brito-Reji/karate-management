import connectDB from "@/lib/db";
import Student from "@/models/Student";
import { NextResponse } from "next/server";

// CREATE THE STUDENT
export async function POST(request) {
  try {
    await connectDB();
    const lastStudent = await Student.findOne().sort({ studentId: -1 });

    const nextId = lastStudent ? lastStudent.studentId + 1 : 1001;
    const { name, dob, gender, phoneNumber, belt, pendingFees, image, status } =
      await request.json();
    const student = new Student({
      studentId: nextId,
      name,
      dob,
      gender,
      phoneNumber,
      belt,
      pendingFees,
      image,
      status,
    });
    await student.save();
    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create student",
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}

// GET SINGLE STUDENT
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const student = await Student.findById(id);
    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get student",
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}

// UPDATE STUDENT
export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const {
      name,
      rollNo,
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
        rollNo,
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
      },
      { new: true },
    );
    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Student updated successfully",
      student,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update student",
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}

// SOFT DELETE THE USER
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const student = await Student.findByIdAndUpdate(
      id,
      { status: "Inactive" },
      { new: true },
    );
    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message: "Student not found",
        },
        {
          status: 404,
        },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Student deleted successfully",
      student,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete student",
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}
