import { queryCommissionsDashboard } from "@/lib/commissions";
import { requireAdmin } from "@/lib/requireAuth";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const allDates = searchParams.get("all") === "1";

    const result = await queryCommissionsDashboard({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      allDates,
      dojoId: searchParams.get("dojoId")?.trim() || "",
      instructor: searchParams.get("instructor")?.trim() || "",
      status: searchParams.get("status")?.trim() || "",
      page: Number(searchParams.get("page")) || 1,
      limit: Number(searchParams.get("limit")) || 50,
      sort: searchParams.get("sort")?.trim() || "awardedDate",
      order: searchParams.get("order") === "asc" ? "asc" : "desc",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load commissions";
    const status = message.includes("Invalid") ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
