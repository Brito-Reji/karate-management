import BeltProgression from "@/models/BeltProgression";
import Student from "@/models/Student";

type BeltHistoryRow = {
  _id?: unknown;
  studentId?: unknown;
  beltName: string;
  fromBelt?: string;
  awardedDate: Date | string;
  createdAt?: Date | string;
  status?: "Pass" | "Fail";
  [key: string]: unknown;
};

/** Derive missing fromBelt values from chronological pass history (single student). */
export function enrichStudentHistoryWithFromBelt<T extends BeltHistoryRow>(
  entries: T[],
  defaultBelt = "White"
): T[] {
  const chronological = [...entries].sort((a, b) => {
    const dateDiff = new Date(a.awardedDate).getTime() - new Date(b.awardedDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
  });

  let lastKnownBelt = defaultBelt;
  const enriched = new Map<string, T>();

  for (const entry of chronological) {
    const key = String(entry._id);
    const fromBelt = entry.fromBelt ?? lastKnownBelt;
    enriched.set(key, { ...entry, fromBelt });

    if (entry.status !== "Fail") {
      lastKnownBelt = entry.beltName;
    }
  }

  return entries.map((entry) => enriched.get(String(entry._id)) ?? entry);
}

/** Fill missing fromBelt for mixed/paginated entries via per-row lookup. */
export async function enrichEntriesWithFromBelt<T extends BeltHistoryRow>(
  entries: T[]
): Promise<T[]> {
  return Promise.all(
    entries.map(async (entry) => {
      if (entry.fromBelt) return entry;

      const awardedDate = new Date(entry.awardedDate);
      const prevPass = await BeltProgression.findOne({
        studentId: entry.studentId,
        status: "Pass",
        $or: [
          { awardedDate: { $lt: awardedDate } },
          {
            awardedDate,
            createdAt: { $lt: entry.createdAt ?? awardedDate },
          },
        ],
      })
        .sort({ awardedDate: -1, createdAt: -1 })
        .lean();

      return {
        ...entry,
        fromBelt: prevPass?.beltName ?? "White",
      };
    })
  );
}

/** Set student.belt from the latest Pass entry, or White if none. */
export async function recomputeStudentBelt(studentId: string, defaultBelt = "White") {
  const latestPass = await BeltProgression.findOne({
    studentId,
    status: "Pass",
  })
    .sort({ awardedDate: -1, createdAt: -1 })
    .lean();

  const belt = latestPass?.beltName ?? defaultBelt;

  await Student.findByIdAndUpdate(studentId, {
    belt,
    updatedAt: new Date(),
  });

  return belt;
}
