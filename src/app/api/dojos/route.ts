import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Dojo from "@/models/Dojo";

export async function GET() {
  try {
    await connectDB();
    const dojos = await Dojo.find({}).sort({ createdAt: -1 });
    return NextResponse.json(dojos, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch dojos" },
      { status: 500 }
    );
  }
}
