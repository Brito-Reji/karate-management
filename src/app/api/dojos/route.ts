import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Dojo from "@/models/Dojo";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    await connectDB();
    const dojos = await Dojo.find({}).sort({ createdAt: -1 });
    return NextResponse.json(dojos, { status: 200, headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch dojos" },
      { status: 500, headers: corsHeaders }
    );
  }
}
