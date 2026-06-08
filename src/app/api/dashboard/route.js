import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Student from "@/models/Student";
import DojoLocation from "@/models/DojoLocation";

// get dashboard stats
export async function GET() {
  try {
    await connectDB();

    const [totalStudents, dojos, beltDistribution, recentStudents] =
      await Promise.all([
        Student.countDocuments(),
        DojoLocation.countDocuments(),
        Student.aggregate([
          { $group: { _id: "$currentBelt", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        Student.find()
          .populate("dojoLocation", "name")
          .sort({ updatedAt: -1 })
          .limit(5)
          .lean(),
      ]);

    return NextResponse.json({
      totalStudents,
      totalDojos: dojos,
      beltDistribution,
      recentStudents,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
