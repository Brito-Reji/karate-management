import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/requireAuth";
import { getCachedDojosWithCounts } from "@/lib/dojoQueriesServer";

export async function GET(request) {
  const { error } = await requireStaff();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const result = await getCachedDojosWithCounts(1, 20, query);

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to search dojos" },
      { status: 500 }
    );
  }
}
