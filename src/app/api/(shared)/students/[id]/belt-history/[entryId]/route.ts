import connectDB from "@/lib/db";
import BeltProgression from "@/models/BeltProgression";
import { BELTS } from "@/lib/constants";
import { recomputeStudentBelt } from "@/lib/beltHistory";
import { requireAdmin } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

// update a belt history entry
export async function PUT(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();
    const { id, entryId } = await params;
    const { beltName, fromBelt, awardedDate, examiner, notes, status } = await request.json();

    const updateFields: Record<string, unknown> = { awardedDate, examiner, notes, status };

    if (beltName) {
      updateFields.beltName = beltName;
      const bInfo = BELTS.find((b) => b.name === beltName);
      if (bInfo) updateFields.rank = bInfo.rank;
    }

    if (fromBelt) {
      updateFields.fromBelt = fromBelt;
    }

    const entry = await BeltProgression.findByIdAndUpdate(
      entryId,
      updateFields,
      { new: true }
    );

    if (!entry) {
      return NextResponse.json(
        { success: false, message: "Entry not found" },
        { status: 404 }
      );
    }

    const belt = await recomputeStudentBelt(id);

    return NextResponse.json({ success: true, entry, belt });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update entry", error: error.message },
      { status: 500 }
    );
  }
}

// delete a belt history entry
export async function DELETE(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await connectDB();
    const { id, entryId } = await params;

    const entry = await BeltProgression.findByIdAndDelete(entryId);

    if (!entry) {
      return NextResponse.json(
        { success: false, message: "Entry not found" },
        { status: 404 }
      );
    }

    const belt = await recomputeStudentBelt(id);

    return NextResponse.json({ success: true, belt });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete entry", error: error.message },
      { status: 500 }
    );
  }
}
