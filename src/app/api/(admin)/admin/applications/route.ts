import connectDB from "@/lib/db";
import User from "@/models/User";
import Dojo from "@/models/Dojo";
import ChangeRequest from "@/models/ChangeRequest";
import { requireAdmin } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();

    const registrations = await User.find({
      role: "instructor",
      approvalStatus: "pending",
      emailVerified: true,
    })
      .select("name email phone dojoIds appliedAt createdAt avatarUrl bio approvalStatus role")
      .sort({ appliedAt: -1, createdAt: -1 })
      .lean();

    const allDojoIds = registrations.flatMap((app) => app.dojoIds || []);
    const dojos =
      allDojoIds.length > 0
        ? await Dojo.find({ _id: { $in: allDojoIds } })
            .select("_id dojoId name location")
            .lean()
        : [];

    const dojoMap = new Map(
      dojos.map((dojo) => [dojo._id.toString(), dojo])
    );

    const registrationItems = registrations.map((app) => ({
      kind: "registration" as const,
      ...app,
      dojos: (app.dojoIds || [])
        .map((id) => dojoMap.get(id))
        .filter(Boolean),
    }));

    const changeRequests = await ChangeRequest.find({ status: "pending" })
      .sort({ createdAt: -1 })
      .lean();

    const submitterIds = [...new Set(changeRequests.map((r) => String(r.submittedBy)))];
    const targetDojoIds = [
      ...new Set(
        changeRequests
          .map((r) => (r.targetDojoId ? String(r.targetDojoId) : null))
          .filter(Boolean) as string[]
      ),
    ];

    const [submitters, targetDojos] = await Promise.all([
      submitterIds.length > 0
        ? User.find({ _id: { $in: submitterIds } })
            .select("name email phone avatarUrl")
            .lean()
        : Promise.resolve([]),
      targetDojoIds.length > 0
        ? Dojo.find({ _id: { $in: targetDojoIds } })
            .select("_id dojoId name location imageUrl")
            .lean()
        : Promise.resolve([]),
    ]);

    const submitterMap = new Map(submitters.map((u) => [String(u._id), u]));
    const targetDojoMap = new Map(targetDojos.map((d) => [String(d._id), d]));

    const changeItems = changeRequests.map((request) => ({
      kind: "change" as const,
      _id: String(request._id),
      type: request.type,
      status: request.status,
      submittedBy: submitterMap.get(String(request.submittedBy)) ?? {
        _id: String(request.submittedBy),
        name: "Unknown",
      },
      targetDojo: request.targetDojoId
        ? targetDojoMap.get(String(request.targetDojoId))
        : undefined,
      payload: request.payload as Record<string, unknown>,
      currentSnapshot: request.currentSnapshot as Record<string, unknown> | undefined,
      createdAt: request.createdAt,
    }));

    const applications = [...registrationItems, ...changeItems].sort((a, b) => {
      const aTime = new Date(
        ("appliedAt" in a && a.appliedAt) ||
          ("createdAt" in a && a.createdAt) ||
          0
      ).getTime();
      const bTime = new Date(
        ("appliedAt" in b && b.appliedAt) ||
          ("createdAt" in b && b.createdAt) ||
          0
      ).getTime();
      return bTime - aTime;
    });

    return NextResponse.json({ success: true, applications });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load applications";
    return NextResponse.json(
      { success: false, message: "Failed to load applications", error: message },
      { status: 500 }
    );
  }
}
