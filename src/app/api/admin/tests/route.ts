import connectDB from "@/lib/db";
import BeltProgression from "@/models/BeltProgression";
import "@/models/Student";
import { requireAdmin } from "@/lib/requireAuth";
import { type NextRequest, NextResponse } from "next/server";

type PopulatedStudent = {
  _id: unknown;
  name?: string;
  studentId?: string;
  belt?: string;
  dojoId?: string;
  phoneNumber?: string;
  status?: string;
};

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 100);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const skip = (page - 1) * limit;

    const [total, history] = await Promise.all([
      BeltProgression.countDocuments({}),
      BeltProgression.find({})
        .sort({ awardedDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "studentId",
          select: "name studentId belt dojoId phoneNumber status",
        })
        .lean(),
    ]);

    const entries = history.map((entry) => {
      const populated = entry.studentId;
      const student =
        populated && typeof populated === "object" && "name" in populated
          ? (populated as PopulatedStudent)
          : null;

      return {
        _id: entry._id,
        beltName: entry.beltName,
        rank: entry.rank,
        awardedDate: entry.awardedDate,
        examiner: entry.examiner,
        notes: entry.notes,
        status: entry.status,
        createdAt: entry.createdAt,
        student: student
          ? {
              _id: student._id,
              name: student.name,
              studentId: student.studentId,
              belt: student.belt,
              dojoId: student.dojoId,
              phoneNumber: student.phoneNumber,
              status: student.status,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      history: entries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load recent tests";
    return NextResponse.json(
      { success: false, message: "Failed to load recent tests", error: message },
      { status: 500 }
    );
  }
}
