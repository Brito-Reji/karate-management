import connectDB from "@/lib/db";
import Student from "@/models/Student";
import BeltProgression from "@/models/BeltProgression";
import { getNextSequence } from "@/models/Counter";
import { BELTS } from "@/lib/constants";
import { NextResponse } from "next/server";

// GET all students with pagination + search + dojo filter
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search")?.trim() || "";
    const dojoId = searchParams.get("dojoId")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (dojoId) filter.dojoId = dojoId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Student.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      students,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to load students" },
      { status: 500 }
    );
  }
}

// CREATE a new student
export async function POST(request) {
  try {
    await connectDB();

    const { name, dojoId, dob, gender, phoneNumber, belt, pendingFees, image, status } =
      await request.json();

    // atomic ID generation
    const nextId = await getNextSequence("studentId");

    const beltInfo = BELTS.find((b) => b.name === belt);

    const student = await Student.create({
      studentId: String(nextId),
      name,
      dojoId,
      dob,
      gender,
      phoneNumber,
      belt,
      pendingFees,
      image,
      status,
    });

    // initial belt progression entry
    await BeltProgression.create({
      studentId: student._id,
      beltName: belt,
      rank: beltInfo?.rank ?? 1,
      awardedDate: student.admissionDate || new Date(),
      notes: "Initial belt on enrollment",
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { success: false, message: "Failed to create student", error: error.message },
      { status: 500 }
    );
  }
}
