import { signUploadParams, isCloudinaryConfigured } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function POST() {
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
    const signed = signUploadParams("karate/instructors");
    return NextResponse.json({ success: true, ...signed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sign upload";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
