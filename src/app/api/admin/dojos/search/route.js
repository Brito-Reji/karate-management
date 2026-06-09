import { NextResponse } from "next/server";
import Dojo from "@/models/Dojo";
import connectDB from "@/lib/db";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const dojos = await Dojo.aggregate([
      {
        $search: {
          index: "dojo",
          compound: {
            should: [
              {
                autocomplete: {
                  query,
                  path: "name",
                  fuzzy: { maxEdits: 1, prefixLength: 0 },
                },
              },
              {
                autocomplete: {
                  query,
                  path: "dojoId",
                  fuzzy: { maxEdits: 1, prefixLength: 0 },
                },
              },
              {
                autocomplete: {
                  query,
                  path: "location",
                  fuzzy: { maxEdits: 1, prefixLength: 0 },
                },
              },
              {
                autocomplete: {
                  query,
                  path: "instructor",
                  fuzzy: { maxEdits: 1, prefixLength: 0 },
                },
              },
            ],
          },
        },
      },
      {
        $limit: 20,
      },
    ]);

    return NextResponse.json({
      success: true,
      data: dojos,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
