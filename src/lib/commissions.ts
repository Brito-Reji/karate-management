import mongoose from "mongoose";
import BeltProgression from "@/models/BeltProgression";
import Dojo from "@/models/Dojo";
import Student from "@/models/Student";
import TestFeeSetting from "@/models/TestFeeSetting";
import User from "@/models/User";
import { BELTS } from "@/lib/constants";
import { enrichEntriesWithFromBelt } from "@/lib/beltHistory";
import connectDB from "@/lib/db";
import { getTodayDateString, parseExamDayRange } from "@/lib/examDayDates";
import { escapeRegex } from "@/lib/mongoSearch";

export type FeeSettingMap = Map<
  string,
  { fee: number; instructorCommission: number }
>;

export function buildPassFailStatusFilter(
  statusParam: string | null | undefined
): Record<string, unknown> {
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

export function getDefaultMonthRange(): { from: string; to: string } {
  const today = getTodayDateString();
  const [year, month] = today.split("-").map(Number);
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export function parseInclusiveDateRange(
  fromStr: string | null | undefined,
  toStr: string | null | undefined,
  allDates: boolean
): { from: string | null; to: string | null; awardedDate?: Record<string, Date> } {
  if (allDates) {
    return { from: null, to: null };
  }

  const defaults = getDefaultMonthRange();
  const from = fromStr?.trim() || defaults.from;
  const to = toStr?.trim() || defaults.to;

  const startRange = parseExamDayRange(from);
  const endRange = parseExamDayRange(to);
  if (!startRange || !endRange) {
    throw new Error("Invalid date format. Use YYYY-MM-DD.");
  }

  return {
    from,
    to,
    awardedDate: { $gte: startRange.start, $lt: endRange.end },
  };
}

export async function loadFeeSettingsMap(): Promise<FeeSettingMap> {
  const rows = await TestFeeSetting.find({}).lean();
  const map: FeeSettingMap = new Map();
  for (const row of rows) {
    map.set(row.beltName, {
      fee: row.fee,
      instructorCommission: row.instructorCommission,
    });
  }
  return map;
}

export function computeMoneyForBelt(
  beltName: string,
  feeMap: FeeSettingMap
): {
  feeConfigured: boolean;
  fee: number | null;
  commission: number | null;
  profit: number | null;
} {
  const setting = feeMap.get(beltName);
  if (!setting) {
    return {
      feeConfigured: false,
      fee: null,
      commission: null,
      profit: null,
    };
  }
  const profit = setting.fee - setting.instructorCommission;
  return {
    feeConfigured: true,
    fee: setting.fee,
    commission: setting.instructorCommission,
    profit,
  };
}

/** Commission recipient for tests at a student's dojo. */
export async function resolveDojoMainInstructor(
  studentDojoId: string | undefined | null
): Promise<{ id: mongoose.Types.ObjectId; name: string } | null> {
  if (!studentDojoId?.trim()) return null;

  const dojo = await Dojo.findOne({
    $or: [
      { dojoId: studentDojoId },
      ...(mongoose.Types.ObjectId.isValid(studentDojoId)
        ? [{ _id: studentDojoId }]
        : []),
    ],
  })
    .select("mainInstructor instructorIds")
    .lean();

  const mainName = dojo?.mainInstructor?.trim();
  if (!mainName) return null;

  const linked = new Set((dojo?.instructorIds ?? []).map(String));
  const linkedObjectIds = [...linked].filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );

  if (linkedObjectIds.length > 0) {
    const linkedUsers = await User.find({
      _id: { $in: linkedObjectIds },
      role: "instructor",
      isBlocked: { $ne: true },
    })
      .select("name")
      .lean();

    const onDojo = linkedUsers.find(
      (user) =>
        user.name?.trim().toLowerCase() === mainName.toLowerCase()
    );
    if (onDojo) {
      return {
        id: onDojo._id as mongoose.Types.ObjectId,
        name: onDojo.name,
      };
    }
  }

  const users = await User.find({
    role: "instructor",
    name: { $regex: `^${escapeRegex(mainName)}$`, $options: "i" },
    isBlocked: { $ne: true },
  })
    .select("name")
    .lean();

  if (users.length === 0) return null;

  const preferred =
    users.find((user) => linked.has(String(user._id))) ?? users[0];

  return { id: preferred._id as mongoose.Types.ObjectId, name: preferred.name };
}

export async function assertInstructorOnStudentDojo(
  studentDojoId: string | undefined | null,
  instructorId: string
): Promise<{ ok: true; instructorName: string } | { ok: false; message: string }> {
  if (!studentDojoId?.trim()) {
    return { ok: false, message: "Student has no dojo assigned" };
  }
  if (!mongoose.Types.ObjectId.isValid(instructorId)) {
    return { ok: false, message: "Invalid instructor id" };
  }

  const dojo = await Dojo.findOne({
    $or: [{ dojoId: studentDojoId }, { _id: studentDojoId }],
  })
    .select("instructorIds")
    .lean();

  if (!dojo) {
    return { ok: false, message: "Dojo not found for student" };
  }

  const allowed = (dojo.instructorIds ?? []).map(String);
  if (!allowed.includes(String(instructorId))) {
    return {
      ok: false,
      message: "Instructor is not assigned to this student's dojo",
    };
  }

  const user = await User.findById(instructorId).select("name role").lean();
  if (!user || user.role !== "instructor") {
    return { ok: false, message: "Instructor not found" };
  }

  return { ok: true, instructorName: user.name };
}

type PopulatedStudent = {
  _id: unknown;
  name?: string;
  studentId?: string;
  dojoId?: string;
};

export type CommissionsQueryParams = {
  from?: string | null;
  to?: string | null;
  allDates?: boolean;
  dojoId?: string;
  instructorId?: string;
  status?: string;
  assignment?: "all" | "assigned" | "unassigned";
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  scopeInstructorId?: string;
};

export async function queryCommissionsDashboard(params: CommissionsQueryParams) {
  await connectDB();

  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(params.limit ?? 50, 100);
  const skip = (page - 1) * limit;
  const assignment = params.assignment ?? "all";
  const sortField = params.sort ?? "awardedDate";
  const order = params.order === "asc" ? 1 : -1;

  const dateParts = parseInclusiveDateRange(
    params.from,
    params.to,
    params.allDates === true
  );

  const progressionFilter: Record<string, unknown> = {};
  const andClauses: Record<string, unknown>[] = [];

  if (dateParts.awardedDate) {
    progressionFilter.awardedDate = dateParts.awardedDate;
  }

  const statusFilter = buildPassFailStatusFilter(params.status ?? null);
  if (Object.keys(statusFilter).length > 0) {
    andClauses.push(statusFilter);
  }

  if (params.scopeInstructorId) {
    andClauses.push({
      instructorId: new mongoose.Types.ObjectId(params.scopeInstructorId),
    });
  } else if (assignment === "unassigned") {
    andClauses.push({
      $or: [{ instructorId: null }, { instructorId: { $exists: false } }],
    });
  } else if (assignment === "assigned") {
    andClauses.push({ instructorId: { $ne: null, $exists: true } });
  }

  if (
    assignment !== "unassigned" &&
    params.instructorId?.trim() &&
    !params.scopeInstructorId
  ) {
    if (!mongoose.Types.ObjectId.isValid(params.instructorId)) {
      throw new Error("Invalid instructorId");
    }
    andClauses.push({
      instructorId: new mongoose.Types.ObjectId(params.instructorId),
    });
  }

  if (andClauses.length > 0) {
    progressionFilter.$and = andClauses;
  }

  const dojoId = params.dojoId?.trim() || "";
  let studentScopeFilter: Record<string, unknown> = {};
  if (dojoId) {
    const matchingStudents = await Student.find({ dojoId }).select("_id").lean();
    studentScopeFilter = {
      studentId: { $in: matchingStudents.map((s) => s._id) },
    };
  }

  const listFilter = { ...progressionFilter, ...studentScopeFilter };

  const [feeMap, allMatching, total] = await Promise.all([
    loadFeeSettingsMap(),
    BeltProgression.find(listFilter)
      .populate({
        path: "studentId",
        select: "name studentId dojoId",
      })
      .populate({ path: "instructorId", select: "name" })
      .lean(),
    BeltProgression.countDocuments(listFilter),
  ]);

  const enriched = await enrichEntriesWithFromBelt(allMatching);

  const dojoIds = new Set<string>();
  for (const entry of enriched) {
    const st = entry.studentId as PopulatedStudent | null;
    if (st?.dojoId) dojoIds.add(st.dojoId);
  }

  const dojos = await Dojo.find({
    dojoId: { $in: [...dojoIds] },
  })
    .select("dojoId name")
    .lean();
  const dojoNameById = new Map(dojos.map((d) => [d.dojoId, d.name]));

  type Row = {
    _id: string;
    student: { _id: string; name: string; studentId: string } | null;
    beltName: string;
    fromBelt?: string;
    status: "Pass" | "Fail";
    awardedDate: string;
    dojoId: string | null;
    dojoName: string | null;
    instructorId: string | null;
    instructorName: string | null;
    examiner: string | null;
    fee: number | null;
    commission: number | null;
    profit: number | null;
    feeConfigured: boolean;
    sortStudentName: string;
    sortAwardedDate: number;
  };

  const rows: Row[] = enriched.map((entry) => {
    const studentRaw = entry.studentId;
    const student =
      studentRaw && typeof studentRaw === "object" && "name" in studentRaw
        ? (studentRaw as PopulatedStudent)
        : null;

    const instructorRaw = entry.instructorId;
    const instructor =
      instructorRaw && typeof instructorRaw === "object" && "name" in instructorRaw
        ? (instructorRaw as { _id: unknown; name?: string })
        : null;

    const money = computeMoneyForBelt(entry.beltName, feeMap);
    const dojoIdVal = student?.dojoId ?? null;

    return {
      _id: String(entry._id),
      student: student
        ? {
            _id: String(student._id),
            name: student.name ?? "",
            studentId: student.studentId ?? "",
          }
        : null,
      beltName: entry.beltName,
      fromBelt: entry.fromBelt as string | undefined,
      status: (entry.status === "Fail" ? "Fail" : "Pass") as "Pass" | "Fail",
      awardedDate: new Date(entry.awardedDate).toISOString(),
      dojoId: dojoIdVal,
      dojoName: dojoIdVal ? dojoNameById.get(dojoIdVal) ?? null : null,
      instructorId: instructor ? String(instructor._id) : entry.instructorId ? String(entry.instructorId) : null,
      instructorName: instructor?.name ?? null,
      examiner: entry.examiner ?? null,
      fee: money.fee,
      commission: money.commission,
      profit: money.profit,
      feeConfigured: money.feeConfigured,
      sortStudentName: student?.name?.toLowerCase() ?? "",
      sortAwardedDate: new Date(entry.awardedDate).getTime(),
    };
  });

  const summary = {
    tests: rows.length,
    fees: 0,
    commission: 0,
    profit: 0,
    unassigned: {
      tests: 0,
      fees: 0,
      commission: 0,
      profit: 0,
    },
    missingFeeSetting: 0,
  };

  type InstructorKey = string;
  const byInstructorMap = new Map<
    InstructorKey,
    {
      instructorId: string;
      instructorName: string;
      dojoId: string;
      dojoName: string;
      tests: number;
      commission: number;
    }
  >();

  for (const row of rows) {
    if (!row.feeConfigured) {
      summary.missingFeeSetting += 1;
      continue;
    }

    const fee = row.fee ?? 0;
    const commission = row.commission ?? 0;
    const profit = row.profit ?? 0;

    if (!row.instructorId) {
      summary.unassigned.tests += 1;
      summary.unassigned.fees += fee;
      summary.unassigned.commission += commission;
      summary.unassigned.profit += profit;
      continue;
    }

    summary.fees += fee;
    summary.commission += commission;
    summary.profit += profit;

    const dojoKey = row.dojoId ?? "";
    const key = `${row.instructorId}:${dojoKey}`;
    const existing = byInstructorMap.get(key);
    if (existing) {
      existing.tests += 1;
      existing.commission += commission;
    } else {
      byInstructorMap.set(key, {
        instructorId: row.instructorId,
        instructorName: row.instructorName ?? "",
        dojoId: dojoKey,
        dojoName: row.dojoName ?? "",
        tests: 1,
        commission,
      });
    }
  }

  const compareRows = (a: Row, b: Row) => {
    let cmp = 0;
    switch (sortField) {
      case "studentName":
        cmp = a.sortStudentName.localeCompare(b.sortStudentName);
        break;
      case "beltName":
        cmp = a.beltName.localeCompare(b.beltName);
        break;
      case "fee":
        cmp = (a.fee ?? -1) - (b.fee ?? -1);
        break;
      case "commission":
        cmp = (a.commission ?? -1) - (b.commission ?? -1);
        break;
      case "profit":
        cmp = (a.profit ?? -1) - (b.profit ?? -1);
        break;
      case "awardedDate":
      default:
        cmp = a.sortAwardedDate - b.sortAwardedDate;
        break;
    }
    return order === 1 ? cmp : -cmp;
  };

  rows.sort(compareRows);
  const paged = rows.slice(skip, skip + limit);

  const byInstructor = [...byInstructorMap.values()].sort((a, b) =>
    a.instructorName.localeCompare(b.instructorName)
  );

  return {
    filters: {
      from: dateParts.from,
      to: dateParts.to,
      dojoId,
      instructorId: params.instructorId?.trim() || "",
      status: params.status?.trim() || "",
      assignment,
    },
    summary,
    byInstructor,
    entries: paged.map(
      ({
        sortStudentName: _s,
        sortAwardedDate: _d,
        ...rest
      }) => rest
    ),
    total,
    page,
    totalPages: Math.ceil(total / Math.max(limit, 1)) || 1,
  };
}

export function validateFeeSettingInput(body: {
  beltName?: unknown;
  fee?: unknown;
  instructorCommission?: unknown;
}): { beltName: string; fee: number; instructorCommission: number } | { error: string } {
  const beltName = typeof body.beltName === "string" ? body.beltName.trim() : "";
  if (!BELTS.some((b) => b.name === beltName)) {
    return { error: "Invalid belt name" };
  }

  const fee = Number(body.fee);
  const instructorCommission = Number(body.instructorCommission);

  if (!Number.isFinite(fee) || fee < 0) {
    return { error: "Fee must be a number >= 0" };
  }
  if (!Number.isFinite(instructorCommission) || instructorCommission < 0) {
    return { error: "Instructor commission must be a number >= 0" };
  }

  return { beltName, fee, instructorCommission };
}

export async function listMergedFeeSettings() {
  await connectDB();
  const saved = await TestFeeSetting.find({}).lean();
  const byBelt = new Map(saved.map((s) => [s.beltName, s]));

  return BELTS.map((belt) => {
    const row = byBelt.get(belt.name);
    if (!row) {
      return {
        beltName: belt.name,
        rank: belt.rank,
        configured: false,
        fee: null as number | null,
        instructorCommission: null as number | null,
        adminProfit: null as number | null,
        updatedAt: null as string | null,
      };
    }
    return {
      beltName: belt.name,
      rank: belt.rank,
      configured: true,
      fee: row.fee,
      instructorCommission: row.instructorCommission,
      adminProfit: row.fee - row.instructorCommission,
      updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
    };
  });
}
