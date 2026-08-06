import { NextResponse } from "next/server";
import Dojo from "@/models/Dojo";
import connectDB from "@/lib/db";
import { attachDojoStudentCounts } from "@/lib/dojoStudentCounts";
import { requireStaff } from "@/lib/requireAuth";

export async function GET(request) {
  const { error } = await requireStaff();
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const regex = new RegExp(query, "i");

    const dojos = await Dojo.aggregate([
      {
        $match: {
          $or: [
            { name: { $regex: regex } },
            { dojoId: { $regex: regex } },
            { location: { $regex: regex } },
            { instructor: { $regex: regex } },
          ],
        },
      },
      { $limit: 20 },
    ]);

    const mappedDojos = dojos.map((dojo) => {
      const d = { ...dojo };
      if (!d.instructors || d.instructors.length === 0) {
        d.instructors = d.instructor
          ? d.instructor.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
      }
      return d;
    });

    const data = await attachDojoStudentCounts(mappedDojos);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
