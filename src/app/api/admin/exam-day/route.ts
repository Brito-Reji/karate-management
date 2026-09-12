import connectDB from "@/lib/db";
import BeltProgression from "@/models/BeltProgression";
import Student from "@/models/Student";
import { enrichEntriesWithFromBelt } from "@/lib/beltHistory";
import { resolveStudentDojoFilter } from "@/lib/dojoQueriesServer";
import {
  EXAM_DAY_TIMEZONE,
  getTodayDateString,
  parseExamDayRange,
} from "@/lib/examDayDates";
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

function buildStatusFilter(statusParam: string | null): Record<string, unknown> {
  const status = statusParam?.trim();
  if (status === "Fail") {
    return { status: "Fail" as const };
  }
  if (status === "Pass") {
    return {
      $or: [
        { status: "Pass" as const },
        { status: { $exists: false } },
        { status: null },
      ],
    };
  }
  return {};
}

function mapEntry(
  entry: Awaited<ReturnType<typeof enrichEntriesWithFromBelt>>[number]
) {
  const populated = entry.studentId;
  const student =
    populated && typeof populated === "object" && "name" in populated
      ? (populated as PopulatedStudent)
      : null;

  return {
    _id: entry._id,
    beltName: entry.beltName,
    fromBelt: entry.fromBelt,
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
}

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const skip = (page - 1) * limit;
    const dateParam = searchParams.get("date")?.trim() || getTodayDateString();
    const statusParam = searchParams.get("status");
    const dojoId = searchParams.get("dojoId")?.trim() || "";
    const instructor = searchParams.get("instructor")?.trim() || "";

    const range = parseExamDayRange(dateParam);
    if (!range) {
      return NextResponse.json(
        { success: false, message: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const dateFilter = {
      awardedDate: { $gte: range.start, $lt: range.end },
    };
    const statusFilter = buildStatusFilter(statusParam);

    const dojoStudentFilter = await resolveStudentDojoFilter(dojoId, instructor);
    let studentScopeFilter: Record<string, unknown> = {};
    if (dojoStudentFilter) {
      const matchingStudents = await Student.find(dojoStudentFilter).select("_id").lean();
      studentScopeFilter = {
        studentId: { $in: matchingStudents.map((student) => student._id) },
      };
    }

    const listFilter = { ...dateFilter, ...statusFilter, ...studentScopeFilter };

    const passFilter: Record<string, unknown> = {
      ...dateFilter,
      ...studentScopeFilter,
      $or: [
        { status: "Pass" },
        { status: { $exists: false } },
        { status: null },
      ],
    };
    const failFilter: Record<string, unknown> = {
      ...dateFilter,
      ...studentScopeFilter,
      status: "Fail",
    };

    const dayTotalFilter = { ...dateFilter, ...studentScopeFilter };

    const [dayTotal, pass, fail, listTotal, history, examDateRows] =
      await Promise.all([
        BeltProgression.countDocuments(dayTotalFilter),
        BeltProgression.countDocuments(passFilter),
        BeltProgression.countDocuments(failFilter),
        BeltProgression.countDocuments(listFilter),
        BeltProgression.find(listFilter)
          .sort({ awardedDate: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate({
            path: "studentId",
            select: "name studentId belt dojoId phoneNumber status",
          })
          .lean(),
        BeltProgression.aggregate<{ _id: string }>([
          {
            $group: {
              _id: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$awardedDate",
                  timezone: EXAM_DAY_TIMEZONE,
                },
              },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: 60 },
        ]),
      ]);

    const enriched = await enrichEntriesWithFromBelt(history);
    const entries = enriched.map(mapEntry);
    const examDates = examDateRows.map((row) => row._id);

    return NextResponse.json({
      success: true,
      date: dateParam,
      history: entries,
      total: listTotal,
      page,
      totalPages: Math.ceil(listTotal / Math.max(limit, 1)),
      stats: {
        total: dayTotal,
        pass,
        fail,
      },
      examDates,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load exam day dashboard";
    return NextResponse.json(
      { success: false, message: "Failed to load exam day dashboard", error: message },
      { status: 500 }
    );
  }
}
