import mongoose from "mongoose";
import connectDB from "@/lib/db";
import ChangeRequest, {
  type ChangeRequestType,
  type DojoJoinPayload,
  type DojoUpdatePayload,
  type ProfilePayload,
} from "@/models/ChangeRequest";
import Dojo from "@/models/Dojo";
import User from "@/models/User";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import { revalidateDojosCache } from "@/lib/cacheTags";
import { isDojoAssignedToInstructor } from "@/lib/instructorDojos";

function profileSnapshot(user: {
  name?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}) {
  return {
    name: user.name ?? "",
    phone: user.phone ?? "",
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? "",
  };
}

function dojoSnapshot(dojo: {
  name?: string;
  location?: string;
}) {
  return {
    name: dojo.name ?? "",
    location: dojo.location ?? "",
  };
}

async function replacePendingRequest(filter: Record<string, unknown>, create: Record<string, unknown>) {
  const existing = await ChangeRequest.findOne({ ...filter, status: "pending" });
  if (existing) {
    await ChangeRequest.deleteOne({ _id: existing._id });
  }
  return ChangeRequest.create(create);
}

export async function listInstructorChangeRequests(userId: string) {
  await connectDB();
  return ChangeRequest.find({ submittedBy: userId, status: "pending" })
    .sort({ createdAt: -1 })
    .lean();
}

export async function createProfileUpdateRequest(
  userId: string,
  payload: ProfilePayload
) {
  await connectDB();
  const user = await User.findById(userId).select("name phone bio avatarUrl role").lean();
  if (!user || user.role !== "instructor") {
    throw new Error("Instructor not found");
  }

  const nextPayload: ProfilePayload = {};
  if (payload.name?.trim()) nextPayload.name = payload.name.trim();
  if (payload.phone?.trim()) nextPayload.phone = payload.phone.trim();
  if (typeof payload.bio === "string") nextPayload.bio = payload.bio.trim().slice(0, 500);
  if (payload.avatarUrl) {
    nextPayload.avatarUrl = payload.avatarUrl;
    nextPayload.avatarPublicId = payload.avatarPublicId;
  }

  if (Object.keys(nextPayload).length === 0) {
    throw new Error("No profile changes to submit");
  }

  return replacePendingRequest(
    { submittedBy: userId, type: "profile_update" },
    {
      type: "profile_update",
      status: "pending",
      submittedBy: userId,
      payload: nextPayload,
      currentSnapshot: profileSnapshot(user),
    }
  );
}

export async function createDojoUpdateRequest(
  userId: string,
  dojoMongoId: string,
  payload: DojoUpdatePayload
) {
  await connectDB();

  const allowed = await isDojoAssignedToInstructor(userId, dojoMongoId);
  if (!allowed) {
    throw new Error("You are not assigned to this dojo");
  }

  const dojo = await Dojo.findById(dojoMongoId).lean();
  if (!dojo) throw new Error("Dojo not found");

  const nextPayload: DojoUpdatePayload = {};
  if (payload.name?.trim()) nextPayload.name = payload.name.trim();
  if (payload.location?.trim()) nextPayload.location = payload.location.trim();

  if (Object.keys(nextPayload).length === 0) {
    throw new Error("No dojo changes to submit");
  }

  return replacePendingRequest(
    { submittedBy: userId, type: "dojo_update", targetDojoId: dojoMongoId },
    {
      type: "dojo_update",
      status: "pending",
      submittedBy: userId,
      targetDojoId: dojoMongoId,
      payload: nextPayload,
      currentSnapshot: dojoSnapshot(dojo),
    }
  );
}

export async function createDojoJoinRequest(userId: string, dojoMongoId: string) {
  await connectDB();

  const alreadyAssigned = await isDojoAssignedToInstructor(userId, dojoMongoId);
  if (alreadyAssigned) {
    throw new Error("You are already assigned to this dojo");
  }

  const dojo = await Dojo.findById(dojoMongoId).lean();
  if (!dojo) throw new Error("Dojo not found");

  const joinPayload: DojoJoinPayload = {
    dojoId: dojo.dojoId,
    dojoName: dojo.name,
    dojoLocation: dojo.location,
  };

  return replacePendingRequest(
    { submittedBy: userId, type: "dojo_join", targetDojoId: dojoMongoId },
    {
      type: "dojo_join",
      status: "pending",
      submittedBy: userId,
      targetDojoId: dojoMongoId,
      payload: joinPayload,
      currentSnapshot: { assigned: false },
    }
  );
}

export async function applyApprovedChangeRequest(
  requestId: string,
  adminUserId: string
) {
  await connectDB();
  const request = await ChangeRequest.findById(requestId);
  if (!request || request.status !== "pending") {
    throw new Error("Change request is not pending");
  }

  if (request.type === "profile_update") {
    const payload = request.payload as ProfilePayload;
    const user = await User.findById(request.submittedBy);
    if (!user) throw new Error("Instructor not found");

    if (payload.name) user.name = payload.name;
    if (payload.phone) user.phone = payload.phone;
    if (typeof payload.bio === "string") user.bio = payload.bio;
    if (payload.avatarUrl) {
      if (user.avatarPublicId && user.avatarPublicId !== payload.avatarPublicId) {
        await deleteCloudinaryAsset(user.avatarPublicId);
      }
      user.avatarUrl = payload.avatarUrl;
      user.avatarPublicId = payload.avatarPublicId;
    }
    user.updatedAt = new Date();
    await user.save();
  } else if (request.type === "dojo_update") {
    const payload = request.payload as DojoUpdatePayload;
    const dojo = await Dojo.findById(request.targetDojoId);
    if (!dojo) throw new Error("Dojo not found");

    const assigned = await isDojoAssignedToInstructor(
      String(request.submittedBy),
      String(request.targetDojoId)
    );
    if (!assigned) throw new Error("Instructor is not assigned to this dojo");

    if (payload.name) dojo.name = payload.name;
    if (payload.location) dojo.location = payload.location;
    await dojo.save();
    revalidateDojosCache();
  } else if (request.type === "dojo_join") {
    const targetId = String(request.targetDojoId);
    const instructorId = request.submittedBy;

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      throw new Error("Invalid dojo");
    }

    await Dojo.updateOne(
      { _id: targetId },
      { $addToSet: { instructorIds: instructorId } }
    );
    await User.updateOne(
      { _id: instructorId },
      { $addToSet: { dojoIds: targetId } }
    );
    revalidateDojosCache();
  }

  request.status = "approved";
  request.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
  request.reviewedAt = new Date();
  request.rejectionReason = undefined;
  await request.save();

  return request;
}

export async function rejectChangeRequest(
  requestId: string,
  adminUserId: string,
  rejectionReason?: string
) {
  await connectDB();
  const request = await ChangeRequest.findById(requestId);
  if (!request || request.status !== "pending") {
    throw new Error("Change request is not pending");
  }

  if (request.type === "profile_update") {
    const payload = request.payload as ProfilePayload;
    const user = await User.findById(request.submittedBy).select("avatarPublicId").lean();
    if (payload.avatarPublicId && payload.avatarPublicId !== user?.avatarPublicId) {
      await deleteCloudinaryAsset(payload.avatarPublicId);
    }
  }

  request.status = "rejected";
  request.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
  request.reviewedAt = new Date();
  request.rejectionReason = rejectionReason?.trim() || undefined;
  await request.save();

  return request;
}

export function changeRequestTypeLabel(type: ChangeRequestType): string {
  switch (type) {
    case "profile_update":
      return "Profile update";
    case "dojo_update":
      return "Dojo edit";
    case "dojo_join":
      return "Join dojo";
    default:
      return type;
  }
}
