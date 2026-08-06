import connectDB from "@/lib/db";
import BeltProgression from "@/models/BeltProgression";
import "@/models/Student";
import { requireAdmin } from "@/lib/requireAuth";
import { type NextRequest, NextResponse } from "next/server";

// GET recent belt tests across all students
export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 100);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const skip = (page - 1) * limit;

    const total = await BeltProgression.countDocuments({});
    const history = await BeltProgression.find({})
      .sort({ awardedDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "studentId",
        select: "name studentId belt dojoId phoneNumber status",
      });

    const entries = history.map((entry) => {
      const obj = entry.toObject() as {
        _id: unknown;
        beltName: string;
        rank: number;
        awardedDate: Date;
        examiner?: string;
        notes?: string;
        status?: string;
        createdAt?: Date;
        studentId:
          | {
              _id: unknown;
              name?: string;
              studentId?: string;
              belt?: string;
              dojoId?: string;
              phoneNumber?: string;
              status?: string;
            }
          | unknown;
      };

      const student =
        obj.studentId && typeof obj.studentId === "object" && "name" in obj.studentId
          ? (obj.studentId as {
              _id: unknown;
              name?: string;
              studentId?: string;
              belt?: string;
              dojoId?: string;
              phoneNumber?: string;
              status?: string;
            })
          : null;

      return {
        _id: obj._id,
        beltName: obj.beltName,
        rank: obj.rank,
        awardedDate: obj.awardedDate,
        examiner: obj.examiner,
        notes: obj.notes,
        status: obj.status,
        createdAt: obj.createdAt,
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
    return NextResponse.json(
      { success: false, message: "Failed to load recent tests", error: err.message },
      { status: 500 }
    );
  }
}
