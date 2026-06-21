import connectDB from "@/lib/db";
import BeltProgression from "@/models/BeltProgression";
import { NextResponse } from "next/server";

// GET belt history for a student
export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const history = await BeltProgression.find({ studentId: id }).sort({
      awardedDate: -1,
      createdAt: -1,
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to load belt history" },
      { status: 500 }
    );
  }
}
