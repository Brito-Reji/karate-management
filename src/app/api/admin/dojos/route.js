import {NextResponse} from "next/server"
import Dojo from "@/models/Dojo"
import connectDB from "@/lib/db"




export async function POST(request) {
  try {
    await connectDB();

    const { name, location, instructor } = await request.json();

    // auto-generate dojoId like DJ-01, DJ-02 ...
    const count = await Dojo.countDocuments();
    const dojoId = `DJ-${String(count + 1).padStart(2, '0')}`;

    const dojo = await Dojo.create({
      name,
      location,
      instructor,
      dojoId,
    });

    return NextResponse.json({
      success: true,
      dojo,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create dojo",
      },
      {
        status: 500,
      }
    );
  }
}

// GET ALL DOJOS
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);

    const page  = Number(searchParams.get("page"))  || 1;
    const limit = Number(searchParams.get("limit")) || 4;
    const search = searchParams.get("search")?.trim() || "";

    const filter = search
      ? {
          $or: [
            { name:       { $regex: search, $options: "i" } },
            { location:   { $regex: search, $options: "i" } },
            { instructor: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const skip = (page - 1) * limit;

    const [dojos, total] = await Promise.all([
      Dojo.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Dojo.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: dojos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

