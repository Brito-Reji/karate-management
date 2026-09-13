import connectDB from "@/lib/db";
import User from "@/models/User";
import Dojo from "@/models/Dojo";
import { requireAdmin } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();

    const applications = await User.find({
      role: "instructor",
      approvalStatus: "pending",
    })
      .select("-password -refreshToken")
      .sort({ appliedAt: -1, createdAt: -1 })
      .lean();

    const allDojoIds = applications.flatMap((app) => app.dojoIds || []);
    const dojos = await Dojo.find({ _id: { $in: allDojoIds } })
      .select("_id dojoId name location")
      .lean();

    const dojoMap = new Map(
      dojos.map((dojo) => [dojo._id.toString(), dojo])
    );

    const enriched = applications.map((app) => ({
      ...app,
      dojos: (app.dojoIds || [])
        .map((id) => dojoMap.get(id))
        .filter(Boolean),
    }));

    return NextResponse.json({ success: true, applications: enriched });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load applications";
    return NextResponse.json(
      { success: false, message: "Failed to load applications", error: message },
      { status: 500 }
    );
  }
}
