import connectDB from "@/lib/db";
import {
  createDojoJoinRequest,
  createDojoUpdateRequest,
  createProfileUpdateRequest,
  listInstructorChangeRequests,
} from "@/lib/changeRequests";
import { requireStaff } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

export async function GET() {
  const { user, error } = await requireStaff();
  if (error) return error;

  if (user.role !== "instructor") {
    return NextResponse.json(
      { success: false, message: "Instructor access required" },
      { status: 403 }
    );
  }

  try {
    const requests = await listInstructorChangeRequests(user.userId);
    return NextResponse.json({ success: true, requests });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load requests";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { user, error } = await requireStaff();
  if (error) return error;

  if (user.role !== "instructor") {
    return NextResponse.json(
      { success: false, message: "Instructor access required" },
      { status: 403 }
    );
  }

  try {
    await connectDB();
    const body = await request.json();
    const { type } = body;

    let created;
    if (type === "profile_update") {
      created = await createProfileUpdateRequest(user.userId, body.payload ?? {});
    } else if (type === "dojo_update") {
      if (!body.targetDojoId) {
        return NextResponse.json(
          { success: false, message: "targetDojoId is required" },
          { status: 400 }
        );
      }
      created = await createDojoUpdateRequest(
        user.userId,
        body.targetDojoId,
        body.payload ?? {}
      );
    } else if (type === "dojo_join") {
      if (!body.targetDojoId) {
        return NextResponse.json(
          { success: false, message: "targetDojoId is required" },
          { status: 400 }
        );
      }
      created = await createDojoJoinRequest(user.userId, body.targetDojoId);
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid request type" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, request: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit request";
    const status = message.includes("not assigned") || message.includes("already") ? 400 : 500;
    return NextResponse.json({ success: false, message }, { status });
  }
}
