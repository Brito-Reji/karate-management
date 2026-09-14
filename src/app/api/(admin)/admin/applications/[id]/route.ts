import connectDB from "@/lib/db";
import User from "@/models/User";
import Dojo from "@/models/Dojo";
import ChangeRequest from "@/models/ChangeRequest";
import { revalidateDojosCache } from "@/lib/cacheTags";
import { applyApprovedChangeRequest, rejectChangeRequest } from "@/lib/changeRequests";
import { requireAdmin } from "@/lib/requireAuth";
import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function toSafeUser(user: { toObject: () => Record<string, unknown> }) {
  const safe = user.toObject();
  delete safe.password;
  delete safe.refreshToken;
  return safe;
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { user: admin, error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;
    const { action, rejectionReason, kind } = await request.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Action must be approve or reject" },
        { status: 400 }
      );
    }

    const resolvedKind =
      kind === "change" || kind === "registration"
        ? kind
        : (await ChangeRequest.findById(id).select("_id").lean())
          ? "change"
          : "registration";

    if (resolvedKind === "change") {
      if (action === "approve") {
        const updated = await applyApprovedChangeRequest(id, admin.userId);
        return NextResponse.json({ success: true, request: updated });
      }

      const updated = await rejectChangeRequest(id, admin.userId, rejectionReason);
      return NextResponse.json({ success: true, request: updated });
    }

    const target = await User.findById(id);
    if (!target) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    if (target.role !== "instructor" || target.approvalStatus !== "pending") {
      return NextResponse.json(
        { success: false, message: "This application is not pending review" },
        { status: 400 }
      );
    }

    if (action === "approve") {
      target.approvalStatus = "approved";
      target.isBlocked = false;
      target.approvedAt = new Date();
      target.approvedBy = admin.userId;
      target.rejectionReason = undefined;

      const validDojoIds = (target.dojoIds || []).filter((dojoId) =>
        mongoose.Types.ObjectId.isValid(dojoId)
      );

      if (validDojoIds.length > 0) {
        await Dojo.updateMany(
          { _id: { $in: validDojoIds } },
          { $addToSet: { instructorIds: target._id } }
        );

        revalidateDojosCache();
      }
    } else {
      target.approvalStatus = "rejected";
      target.isBlocked = true;
      target.rejectionReason = rejectionReason?.trim() || undefined;
    }

    target.updatedAt = new Date();
    await target.save();

    return NextResponse.json({ success: true, user: toSafeUser(target) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update application";
    return NextResponse.json(
      { success: false, message: "Failed to update application", error: message },
      { status: 500 }
    );
  }
}
