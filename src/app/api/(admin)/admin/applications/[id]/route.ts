import connectDB from "@/lib/db";
import User from "@/models/User";
import Dojo from "@/models/Dojo";
import { revalidateDojosCache } from "@/lib/cacheTags";
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
    const { action, rejectionReason } = await request.json();

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Action must be approve or reject" },
        { status: 400 }
      );
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

      const validDojoIds = (target.dojoIds || []).filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
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
