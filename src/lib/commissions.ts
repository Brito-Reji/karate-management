import BeltProgression from "@/models/BeltProgression";
import Dojo from "@/models/Dojo";
import Student from "@/models/Student";
import TestFeeSetting from "@/models/TestFeeSetting";
import { BELTS } from "@/lib/constants";
import { enrichEntriesWithFromBelt } from "@/lib/beltHistory";
import connectDB from "@/lib/db";
import { getTodayDateString, parseExamDayRange } from "@/lib/examDayDates";

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

type DojoCommissionInfo = {
  dojoId: string;
  mongoId: string;
  name: string;
  mainInstructor: string | null;
};

function studentDojoKeys(info: DojoCommissionInfo): string[] {
  return [...new Set([info.dojoId, info.mongoId].filter(Boolean))];
}

/** Index dojos by both the public dojo code and the stored student link. */
async function loadDojoCommissionIndex(): Promise<Map<string, DojoCommissionInfo>> {
  const dojos = await Dojo.find({}).select("dojoId name mainInstructor").lean();
  const byKey = new Map<string, DojoCommissionInfo>();

  for (const dojo of dojos) {
    const info: DojoCommissionInfo = {
      dojoId: dojo.dojoId,
      mongoId: String(dojo._id),
      name: dojo.name,
      mainInstructor: dojo.mainInstructor?.trim() || null,
    };
    if (info.dojoId) byKey.set(info.dojoId, info);
    byKey.set(info.mongoId, info);
  }

  return byKey;
}

function uniqueDojos(index: Map<string, DojoCommissionInfo>): DojoCommissionInfo[] {
  const byMongoId = new Map<string, DojoCommissionInfo>();
  for (const info of index.values()) byMongoId.set(info.mongoId, info);
  return [...byMongoId.values()];
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
  instructor?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
};

function emptyDashboard(
  filters: {
    from: string | null;
    to: string | null;
    dojoId: string;
    instructor: string;
    status: string;
  },
  page: number
) {
  return {
    filters,
    summary: {
      tests: 0,
      fees: 0,
      commission: 0,
      profit: 0,
      noMainInstructor: { tests: 0, commission: 0 },
      missingFeeSetting: 0,
    },
    byInstructor: [] as Array<{
      instructorName: string;
      dojoId: string;
      dojoName: string;
      tests: number;
      commission: number;
    }>,
    entries: [],
    total: 0,
    page,
    totalPages: 1,
  };
}

export async function queryCommissionsDashboard(params: CommissionsQueryParams) {
  await connectDB();

  const page = Math.max(params.page ?? 1, 1);
  const limit = Math.min(params.limit ?? 50, 100);
  const skip = (page - 1) * limit;
  const sortField = params.sort ?? "awardedDate";
  const order = params.order === "asc" ? 1 : -1;
  const dojoId = params.dojoId?.trim() || "";
  const instructor = params.instructor?.trim() || "";

  const dateParts = parseInclusiveDateRange(
    params.from,
    params.to,
    params.allDates === true
  );

  const filters = {
    from: dateParts.from,
    to: dateParts.to,
    dojoId,
    instructor,
    status: params.status?.trim() || "",
  };

  const dojoIndex = await loadDojoCommissionIndex();
  const dojos = uniqueDojos(dojoIndex);

  let allowedDojoKeys: string[] | null = null;
  if (dojoId) {
    const selected = dojoIndex.get(dojoId);
    if (!selected) return emptyDashboard(filters, page);
    allowedDojoKeys = studentDojoKeys(selected);
  }

  if (instructor) {
    const named = dojos.filter(
      (dojo) => dojo.mainInstructor?.toLowerCase() === instructor.toLowerCase()
    );
    const keys = named.flatMap(studentDojoKeys);
    if (allowedDojoKeys) {
      const allowed = new Set(keys);
      allowedDojoKeys = allowedDojoKeys.filter((key) => allowed.has(key));
    } else {
      allowedDojoKeys = keys;
    }
    if (allowedDojoKeys.length === 0) return emptyDashboard(filters, page);
  }

  const progressionFilter: Record<string, unknown> = {};
  const andClauses: Record<string, unknown>[] = [];

  if (dateParts.awardedDate) {
    progressionFilter.awardedDate = dateParts.awardedDate;
  }

  const statusFilter = buildPassFailStatusFilter(params.status ?? null);
  if (Object.keys(statusFilter).length > 0) {
    andClauses.push(statusFilter);
  }

  if (andClauses.length > 0) {
    progressionFilter.$and = andClauses;
  }

  let studentScopeFilter: Record<string, unknown> = {};
  if (allowedDojoKeys) {
    const matchingStudents = await Student.find({
      dojoId: { $in: allowedDojoKeys },
    })
      .select("_id")
      .lean();
    studentScopeFilter = {
      studentId: { $in: matchingStudents.map((s) => s._id) },
    };
  }

  const listFilter = { ...progressionFilter, ...studentScopeFilter };

  const [feeMap, allMatching] = await Promise.all([
    loadFeeSettingsMap(),
    BeltProgression.find(listFilter)
      .populate({
        path: "studentId",
        select: "name studentId dojoId",
      })
      .lean(),
  ]);

  const enriched = await enrichEntriesWithFromBelt(allMatching);

  type Row = {
    _id: string;
    student: { _id: string; name: string; studentId: string } | null;
    beltName: string;
    fromBelt?: string;
    status: "Pass" | "Fail";
    awardedDate: string;
    dojoId: string | null;
    dojoName: string | null;
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

    const money = computeMoneyForBelt(entry.beltName, feeMap);
    const linked = student?.dojoId ? dojoIndex.get(student.dojoId) : undefined;

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
      dojoId: linked?.dojoId ?? null,
      dojoName: linked?.name ?? null,
      instructorName: linked?.mainInstructor ?? null,
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
    noMainInstructor: {
      tests: 0,
      commission: 0,
    },
    missingFeeSetting: 0,
  };

  const byInstructorMap = new Map<
    string,
    {
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

    summary.fees += fee;
    summary.profit += profit;

    if (!row.instructorName) {
      summary.noMainInstructor.tests += 1;
      summary.noMainInstructor.commission += commission;
      continue;
    }

    summary.commission += commission;

    const dojoKey = row.dojoId ?? "";
    const key = `${row.instructorName.toLowerCase()}:${dojoKey}`;
    const existing = byInstructorMap.get(key);
    if (existing) {
      existing.tests += 1;
      existing.commission += commission;
    } else {
      byInstructorMap.set(key, {
        instructorName: row.instructorName,
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
  const total = rows.length;
  const paged = rows.slice(skip, skip + limit);

  const byInstructor = [...byInstructorMap.values()].sort((a, b) =>
    a.instructorName.localeCompare(b.instructorName)
  );

  return {
    filters,
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
