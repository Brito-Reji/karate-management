import { unstable_cache } from "next/cache";
import connectDB from "@/lib/db";
import Dojo from "@/models/Dojo";
import { attachDojoStudentCounts } from "@/lib/dojoStudentCounts";
import { CACHE_TAGS } from "@/lib/cacheTags";
import { prefixRegex } from "@/lib/mongoSearch";

export type DojoListItem = {
  _id: string;
  dojoId?: string;
  name?: string;
  location?: string;
  instructor?: string;
  instructors: string[];
  count?: number;
};

export function normalizeDojo(dojo: Record<string, unknown>): DojoListItem {
  const instructors = Array.isArray(dojo.instructors) && dojo.instructors.length > 0
    ? (dojo.instructors as string[])
    : typeof dojo.instructor === "string"
      ? dojo.instructor.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  return {
    ...(dojo as Omit<DojoListItem, "_id" | "instructors">),
    _id: String(dojo._id),
    instructors,
  };
}

export function dojoSearchFilter(search: string) {
  if (!search) return {};
  const q = prefixRegex(search);
  return {
    $or: [
      { name: q },
      { dojoId: q },
      { location: q },
      { instructor: q },
      { instructors: q },
    ],
  };
}

export async function queryDojosWithCounts(page: number, limit: number, search: string) {
  await connectDB();
  const filter = dojoSearchFilter(search);
  const skip = (page - 1) * limit;

  const [dojos, total] = await Promise.all([
    Dojo.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
    Dojo.countDocuments(filter),
  ]);

  const mapped = dojos.map((dojo) => normalizeDojo(dojo as Record<string, unknown>));
  const data = await attachDojoStudentCounts(mapped);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / Math.max(limit, 1)) || 1,
  };
}

export function getCachedDojosWithCounts(page: number, limit: number, search: string) {
  return unstable_cache(
    () => queryDojosWithCounts(page, limit, search),
    ["dojos-list", String(page), String(limit), search],
    { revalidate: 60, tags: [CACHE_TAGS.dojos] }
  )();
}

export type DojoDropdownOption = {
  _id: string;
  dojoId?: string;
  name: string;
  location: string;
  instructor?: string;
  instructors: string[];
};

export async function queryDojoOptions(): Promise<DojoDropdownOption[]> {
  await connectDB();
  const dojos = await Dojo.find({})
    .select("_id dojoId name location instructor instructors")
    .sort({ name: 1 })
    .lean();

  return dojos.map((dojo) => {
    const normalized = normalizeDojo(dojo as Record<string, unknown>);
    return {
      _id: normalized._id,
      dojoId: normalized.dojoId,
      name: normalized.name ?? "",
      location: normalized.location ?? "",
      instructor:
        normalized.instructors.length > 0
          ? normalized.instructors.join(", ")
          : normalized.instructor,
      instructors: normalized.instructors,
    };
  });
}

export function getCachedDojoOptions() {
  return unstable_cache(
    () => queryDojoOptions(),
    ["dojos-options"],
    { revalidate: 60, tags: [CACHE_TAGS.dojos] }
  )();
}
