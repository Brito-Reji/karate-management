import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Dojo from "@/models/Dojo";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const dojo = await Dojo.findOne({ dojoId: id });

    if (!dojo) {
      return NextResponse.json(
        { message: "Dojo not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(dojo, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch dojo" },
      { status: 500 }
    );
  }
}
