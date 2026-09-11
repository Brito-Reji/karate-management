import connectDB from "@/lib/db";
import Student from "@/models/Student";
import { getNextSequence } from "@/models/Counter";
import { requireStaff, getStudentScopeFilter, isDuplicateKeyError } from "@/lib/requireAuth";
import { prefixRegex } from "@/lib/mongoSearch";
import { revalidateDojosCache } from "@/lib/cacheTags";
import { NextResponse } from "next/server";

const LIST_SELECT =
  "studentId name dojoId dob gender phoneNumber belt status createdAt createdBy";

export async function GET(request) {
  const { user, error } = await requireStaff();
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 100);
    const search = searchParams.get("search")?.trim() || "";
    const dojoId = searchParams.get("dojoId")?.trim() || "";
    const belt = searchParams.get("belt")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const filter: Record<string, unknown> = { ...getStudentScopeFilter(user) };

    if (search) {
      const prefix = prefixRegex(search);
      filter.$or = [
        { studentId: search },
        { name: prefix },
        { studentId: prefix },
        { phoneNumber: prefix },
      ];
    }

    if (dojoId) filter.dojoId = dojoId;
    if (belt) filter.belt = belt;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(filter)
        .select(LIST_SELECT)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Student.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      students,
      total,
      page,
      totalPages: Math.ceil(total / Math.max(limit, 1)),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to load students" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const { user, error } = await requireStaff();
  if (error) return error;

  try {
    await connectDB();

    const { name, dojoId, dob, gender, phoneNumber, belt, pendingFees, image, status } =
      await request.json();

    const nextId = await getNextSequence("studentId");

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

    revalidateDojosCache();

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
