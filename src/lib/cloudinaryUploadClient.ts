export type CloudinaryUploadFolder = "karate/instructors";

export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Please choose a JPEG, PNG, WebP, or GIF image.";
  }
  if (file.size > MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

export async function uploadImageToCloudinary(
  file: File,
  folder: CloudinaryUploadFolder,
  signEndpoint = "/api/uploads/cloudinary-sign"
): Promise<CloudinaryUploadResult> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const signRes = await fetch(signEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });

  const signJson = await signRes.json();
  if (!signRes.ok || !signJson.success) {
    throw new Error(signJson.message || "Failed to prepare upload");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signJson.apiKey);
  formData.append("timestamp", String(signJson.timestamp));
  formData.append("signature", signJson.signature);
  formData.append("folder", signJson.folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signJson.cloudName}/image/upload`,
    { method: "POST", body: formData }
  );

  const uploadJson = await uploadRes.json();
  if (!uploadRes.ok || !uploadJson.secure_url) {
    throw new Error(uploadJson.error?.message || "Upload failed");
  }

  return {
    secureUrl: uploadJson.secure_url as string,
    publicId: uploadJson.public_id as string,
  };
}
