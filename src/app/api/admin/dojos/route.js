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

    const page = Number(searchParams.get("page")) || 1;
    const limit = 10;

    const skip = (page - 1) * limit;

    const dojos = await Dojo.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Dojo.countDocuments();

    return NextResponse.json({
      success: true,
      data: dojos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}

