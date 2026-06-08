import { NextResponse } from "next/server";
import Dojo from "@/models/Dojo";
import connectDB from "@/lib/db";

export async function PUT(request, { params }) {
  try {
    await connectDB();

    const { name, location, instructor } = await request.json();
    const { id } = await params;

    const dojo = await Dojo.findByIdAndUpdate(
      id,
      { name, location, instructor },
      { new: true, runValidators: true }
    );

    if (!dojo) {
      return NextResponse.json(
        { success: false, message: "Dojo not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, dojo });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update dojo" },
      { status: 500 }
    );
  }
}
