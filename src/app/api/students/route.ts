import connectDB from "@/lib/db";
import Student, { ensureSharedPhoneAllowed } from "@/models/Student";
import BeltProgression from "@/models/BeltProgression";
import { getNextSequence } from "@/models/Counter";
import { BELTS } from "@/lib/constants";
import { requireStaff, getStudentScopeFilter, isDuplicateKeyError } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

// GET all students with pagination + search + dojo filter
export async function GET(request) {
  const { user, error } = await requireStaff();
  if (error) return error;

  try {
    await connectDB();
    await ensureSharedPhoneAllowed();

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search")?.trim() || "";
    const dojoId = searchParams.get("dojoId")?.trim() || "";
    const belt = searchParams.get("belt")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const filter: Record<string, unknown> = { ...getStudentScopeFilter(user) };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (dojoId) filter.dojoId = dojoId;
    if (belt) filter.belt = belt;
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
  const { user, error } = await requireStaff();
  if (error) return error;

  try {
    await connectDB();
    await ensureSharedPhoneAllowed();

    const { name, dojoId, dob, gender, phoneNumber, belt, pendingFees, image, status } =
      await request.json();

    const nextId = await getNextSequence("studentId");

    const beltInfo = BELTS.find((b) => b.name === belt);

    const student = await Student.create({
      studentId: String(nextId),
      name,
      dojoId: dojoId?.trim() || undefined,
      dob: dob || undefined,
      gender: gender || undefined,
      phoneNumber: phoneNumber?.trim() || undefined,
      belt,
      pendingFees,
      image,
      status,
      createdBy: user.userId,
      updatedBy: user.userId,
    });

    await BeltProgression.create({
      studentId: student._id,
      beltName: belt,
      rank: beltInfo?.rank ?? 1,
      awardedDate: student.admissionDate || new Date(),
      notes: "Initial belt on enrollment",
    });

    return NextResponse.json({ success: true, student });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      return NextResponse.json(
        { success: false, message: "A student with this ID already exists. Please try again." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to create student", error: err.message },
      { status: 500 }
    );
  }
}
