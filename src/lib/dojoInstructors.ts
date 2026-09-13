import mongoose from "mongoose";
import User from "@/models/User";

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
