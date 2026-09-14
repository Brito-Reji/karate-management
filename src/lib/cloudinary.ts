import { v2 as cloudinary } from "cloudinary";

const PLACEHOLDER_VALUES = new Set([
  "your-cloud-name",
  "your-api-key",
  "your-api-secret",
]);

type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function parseCloudinaryUrl(url: string): CloudinaryCredentials | null {
  const match = url.trim().match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/?]+)/);
  if (!match) return null;

  const [, apiKey, apiSecret, cloudName] = match;
  return { cloudName, apiKey, apiSecret };
}

function getCloudinaryCredentials(): CloudinaryCredentials | null {
  const fromUrl = process.env.CLOUDINARY_URL
    ? parseCloudinaryUrl(process.env.CLOUDINARY_URL)
    : null;

  const cloudName = (fromUrl?.cloudName ?? process.env.CLOUDINARY_CLOUD_NAME)?.trim();
  const apiKey = (fromUrl?.apiKey ?? process.env.CLOUDINARY_API_KEY)?.trim();
  const apiSecret = (fromUrl?.apiSecret ?? process.env.CLOUDINARY_API_SECRET)?.trim();

  if (!cloudName || !apiKey || !apiSecret) return null;
  if (
    PLACEHOLDER_VALUES.has(cloudName) ||
    PLACEHOLDER_VALUES.has(apiKey) ||
    PLACEHOLDER_VALUES.has(apiSecret)
  ) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

const credentials = getCloudinaryCredentials();

export function isCloudinaryConfigured(): boolean {
  return credentials !== null;
}

export function getCloudinary() {
  if (!credentials) {
    throw new Error("Cloudinary is not configured");
  }

  cloudinary.config({
    cloud_name: credentials.cloudName,
    api_key: credentials.apiKey,
    api_secret: credentials.apiSecret,
    secure: true,
  });

  return cloudinary;
}

export type CloudinaryUploadFolder = "karate/instructors";

export function signUploadParams(folder: CloudinaryUploadFolder) {
  if (!credentials) {
    throw new Error("Cloudinary is not configured");
  }

  const cld = getCloudinary();
  const timestamp = Math.round(Date.now() / 1000);

  const params = {
    timestamp,
    folder,
  };

  const signature = cld.utils.api_sign_request(params, credentials.apiSecret);

  return {
    cloudName: credentials.cloudName,
    apiKey: credentials.apiKey,
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
