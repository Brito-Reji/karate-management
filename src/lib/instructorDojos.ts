import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Dojo from "@/models/Dojo";
import User from "@/models/User";

/** Mongo _id strings for dojos assigned to an instructor (User.dojoIds ∪ Dojo.instructorIds). */
export async function getAssignedDojoIds(userId: string): Promise<string[]> {
  await connectDB();

  const ids = new Set<string>();

  const user = await User.findById(userId).select("dojoIds").lean();
  if (user?.dojoIds) {
    for (const id of user.dojoIds) {
      if (id) ids.add(String(id));
    }
  }

  if (mongoose.Types.ObjectId.isValid(userId)) {
    const objectId = new mongoose.Types.ObjectId(userId);
    const linkedDojos = await Dojo.find({ instructorIds: objectId })
      .select("_id")
      .lean();
    for (const dojo of linkedDojos) {
      ids.add(String(dojo._id));
    }
  }

  return [...ids];
}

export async function isDojoAssignedToInstructor(
  userId: string,
  dojoId: string
): Promise<boolean> {
  if (!dojoId?.trim()) return false;
  const assigned = await getAssignedDojoIds(userId);
  return assigned.includes(dojoId.trim());
}
