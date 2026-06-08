import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import DojoLocation from "@/models/DojoLocation";

// get all dojos
export async function GET() {
  try {
    await connectDB();
    const dojos = await DojoLocation.find().sort({ name: 1 }).lean();
    return NextResponse.json({ dojos });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dojos" },
      { status: 500 }
    );
  }
}
