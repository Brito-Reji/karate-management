import { signUploadParams, isCloudinaryConfigured } from "@/lib/cloudinary";
import { requireStaff } from "@/lib/requireAuth";
import { NextResponse } from "next/server";

const ALLOWED_FOLDERS = new Set(["karate/instructors"]);

export async function POST(request: Request) {
  const { error } = await requireStaff();
  if (error) return error;

  if (!isCloudinaryConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message: "Image uploads are not configured. Contact an administrator.",
      },
      { status: 503 }
    );
  }

  try {
    const { folder } = await request.json();
    if (!ALLOWED_FOLDERS.has(folder)) {
      return NextResponse.json(
        { success: false, message: "Invalid upload folder" },
        { status: 400 }
      );
    }

    const signed = signUploadParams(folder);

    return NextResponse.json({ success: true, ...signed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sign upload";
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
