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
    const dojos = await Dojo.find({})
      .select("dojoId name location instructor instructors createdAt")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(dojos, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch dojos" },
      { status: 500, headers: corsHeaders }
    );
  }
}
