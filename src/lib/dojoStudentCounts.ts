import Student from "@/models/Student";

type DojoWithId = { _id: unknown };

/** Attach Active student counts to dojo records (keyed by dojo Mongo _id string). */
export async function attachDojoStudentCounts<T extends DojoWithId>(
  dojos: T[]
): Promise<(T & { count: number })[]> {
  if (dojos.length === 0) return [];

  const ids = dojos.map((d) => String(d._id));

  const counts = await Student.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        status: "Active",
        dojoId: { $in: ids },
      },
    },
    { $group: { _id: "$dojoId", count: { $sum: 1 } } },
  ]);

  const countByDojoId = new Map(counts.map((c) => [c._id, c.count]));

  return dojos.map((dojo) => ({
    ...dojo,
    count: countByDojoId.get(String(dojo._id)) ?? 0,
  }));
}
