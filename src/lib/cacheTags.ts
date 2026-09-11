import { revalidateTag } from "next/cache";

export const CACHE_TAGS = {
  dojos: "dojos",
} as const;

/** Next.js 16 requires a cacheLife profile as the second argument. */
export function revalidateDojosCache() {
  revalidateTag(CACHE_TAGS.dojos, "max");
}
