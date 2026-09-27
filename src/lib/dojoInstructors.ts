import mongoose from "mongoose";
import User from "@/models/User";
import Dojo from "@/models/Dojo";

function instructorNameOnList(name: string, instructors: string[]): boolean {
  const normalized = name.trim().toLowerCase();
  return instructors.some((entry) => entry.trim().toLowerCase() === normalized);
}

/** Normalize and validate instructor user IDs (approved, unblocked instructors only). */
export async function validateInstructorIds(
  rawIds: unknown
): Promise<mongoose.Types.ObjectId[]> {
  if (!Array.isArray(rawIds)) return [];

  const uniqueIds = [...new Set(rawIds.map(String).filter(Boolean))];
  const objectIds = uniqueIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (objectIds.length === 0) return [];

  const users = await User.find({
    _id: { $in: objectIds },
    role: "instructor",
    approvalStatus: "approved",
    isBlocked: { $ne: true },
  })
    .select("_id")
    .lean();

  const validSet = new Set(users.map((u) => String(u._id)));
  const validated = objectIds.filter((id) => validSet.has(String(id)));

  if (validated.length !== objectIds.length) {
    throw new Error("One or more selected instructors are invalid or not approved");
  }

  return validated;
}

/** Main instructor is one name from the dojo's instructors string list. */
export function pickMainInstructor(
  raw: unknown,
  instructors: string[]
): string | null {
  const names = instructors.map((name) => name.trim()).filter(Boolean);
  const selected = typeof raw === "string" ? raw.trim() : "";

  if (!selected) {
    if (names.length === 1) return names[0];
    if (names.length > 1) {
      throw new Error("Select the main instructor who receives test commission");
    }
    return null;
  }

  const match = names.find((name) => name === selected);
  if (!match) {
    throw new Error("Main instructor must be one of this dojo's instructors");
  }
  return match;
}

/**
 * Link an approved instructor to specific dojos: set instructorIds and User.dojoIds,
 * and add the instructor's name to instructors when it is not already on that dojo.
 */
export async function linkApprovedInstructorToDojos(
  instructorUserId: mongoose.Types.ObjectId | string,
  dojoMongoIds: (mongoose.Types.ObjectId | string)[],
  instructorName: string
): Promise<void> {
  const userId =
    typeof instructorUserId === "string"
      ? new mongoose.Types.ObjectId(instructorUserId)
      : instructorUserId;

  const name = instructorName.trim();
  if (!name) return;

  const dojoIds = dojoMongoIds
    .filter((id) => mongoose.Types.ObjectId.isValid(String(id)))
    .map((id) => new mongoose.Types.ObjectId(String(id)));

  if (dojoIds.length === 0) return;

  await Dojo.updateMany(
    { _id: { $in: dojoIds } },
    { $addToSet: { instructorIds: userId } }
  );

  await User.updateOne(
    { _id: userId },
    { $addToSet: { dojoIds: { $each: dojoIds.map(String) } } }
  );

  const dojos = await Dojo.find({ _id: { $in: dojoIds } })
    .select("instructors")
    .lean();

  for (const dojo of dojos) {
    const list = Array.isArray(dojo.instructors) ? [...dojo.instructors] : [];
    if (instructorNameOnList(name, list)) continue;
    list.push(name);
    await Dojo.updateOne({ _id: dojo._id }, { $set: { instructors: list } });
  }
}

/** Keep User.dojoIds in sync when a dojo's instructorIds change. */
export async function syncUserDojoIdsForInstructors(
  dojoMongoId: string,
  previousIds: string[],
  nextIds: string[]
): Promise<void> {
  const prev = new Set(previousIds.map(String));
  const next = new Set(nextIds.map(String));

  const added = [...next].filter((id) => !prev.has(id));
  const removed = [...prev].filter((id) => !next.has(id));

  if (added.length > 0) {
    await User.updateMany(
      { _id: { $in: added } },
      { $addToSet: { dojoIds: dojoMongoId } }
    );
  }

  if (removed.length > 0) {
    await User.updateMany(
      { _id: { $in: removed } },
      { $pull: { dojoIds: dojoMongoId } }
    );
  }
}
