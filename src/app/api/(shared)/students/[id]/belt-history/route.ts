import connectDB from "@/lib/db";
import BeltProgression from "@/models/BeltProgression";
import { enrichStudentHistoryWithFromBelt } from "@/lib/beltHistory";
import { requireAdmin } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

// GET belt history for a student
export async function GET(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();
    const { id } = await params;

    const history = await BeltProgression.find({ studentId: id })
      .sort({ awardedDate: -1, createdAt: -1 })
      .lean();

    const enriched = enrichStudentHistoryWithFromBelt(history);

    return NextResponse.json({ success: true, history: enriched });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to load belt history" },
      { status: 500 }
    );
  }
}
