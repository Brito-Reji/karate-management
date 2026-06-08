import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";

// get all students with optional filters
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const belt = searchParams.get("belt") || "";
    const dojo = searchParams.get("dojo") || "";

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    if (belt) {
      filter.currentBelt = belt;
    }

    if (dojo) {
      filter.dojoLocation = dojo;
    }

    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .populate("dojoLocation", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      students,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

// create a student
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const student = await Student.create(body);

    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    // handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
