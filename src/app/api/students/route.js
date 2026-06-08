import connectDB from "@/lib/db";
import Student from "@/models/Student";
import { NextResponse } from "next/server";

export async function GET(request) {
  await connectDB();
  const students = await Student.find();
  return NextResponse.json({ success: true, students });
}

export async function POST(request) {
  await connectDB();
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
  const student = new Student({
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
  });
  await student.save();
  return NextResponse.json({ success: true, student });
}
