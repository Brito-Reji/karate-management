import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudName && apiKey && apiSecret);
}

export function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

export type CloudinaryUploadFolder = "karate/instructors";

export function signUploadParams(folder: CloudinaryUploadFolder) {
  const cld = getCloudinary();
  const timestamp = Math.round(Date.now() / 1000);

  const params = {
    timestamp,
    folder,
  };

  const signature = cld.utils.api_sign_request(params, apiSecret!);

  return {
    cloudName: cloudName!,
    apiKey: apiKey!,
    timestamp,
    folder,
    signature,
  };
}

export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    const cld = getCloudinary();
    await cld.uploader.destroy(publicId);
  } catch {
    // Best-effort cleanup; do not block reject flows
  }
}
