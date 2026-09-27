import connectDB from "@/lib/db";
import {
  listMergedFeeSettings,
  validateFeeSettingInput,
} from "@/lib/commissions";
import TestFeeSetting from "@/models/TestFeeSetting";
import { requireAdmin } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const settings = await listMergedFeeSettings();
    return NextResponse.json({ success: true, settings });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to load fee settings" },
      { status: 500 }
    );
  }
}

async function upsertSetting(
  request: Request,
  userId: string,
  isPost: boolean
) {
  await connectDB();
  const body = await request.json();
  const parsed = validateFeeSettingInput(body);
  if ("error" in parsed) {
    return NextResponse.json(
      { success: false, message: parsed.error },
      { status: 400 }
    );
  }

  const existing = await TestFeeSetting.findOne({ beltName: parsed.beltName }).lean();
  const setting = await TestFeeSetting.findOneAndUpdate(
    { beltName: parsed.beltName },
    {
      beltName: parsed.beltName,
      fee: parsed.fee,
      instructorCommission: parsed.instructorCommission,
      ...(existing ? { updatedBy: userId } : { createdBy: userId, updatedBy: userId }),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  const status = existing ? 200 : isPost ? 201 : 200;

  return NextResponse.json(
    {
      success: true,
      setting: {
        beltName: setting!.beltName,
        fee: setting!.fee,
        instructorCommission: setting!.instructorCommission,
        adminProfit: setting!.fee - setting!.instructorCommission,
        updatedAt: setting!.updatedAt
          ? new Date(setting!.updatedAt).toISOString()
          : new Date().toISOString(),
      },
    },
    { status }
  );
}

export async function POST(request: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  try {
    return await upsertSetting(request, user!.userId, true);
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to save fee setting" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const { user, error } = await requireAdmin();
  if (error) return error;

  try {
    return await upsertSetting(request, user!.userId, false);
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to save fee setting" },
      { status: 500 }
    );
  }
}
