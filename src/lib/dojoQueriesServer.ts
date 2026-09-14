import { unstable_cache } from "next/cache";
import connectDB from "@/lib/db";
import Dojo from "@/models/Dojo";
import User from "@/models/User";
import { attachDojoStudentCounts } from "@/lib/dojoStudentCounts";
import { CACHE_TAGS } from "@/lib/cacheTags";
import { prefixRegex } from "@/lib/mongoSearch";
import { getAssignedDojoIds } from "@/lib/instructorDojos";

export type RegisteredInstructor = {
  _id: string;
  name: string;
};

export type DojoListItem = {
  _id: string;
  dojoId?: string;
  name?: string;
  location?: string;
  instructor?: string;
  instructors: string[];
  instructorIds: string[];
  registeredInstructors: RegisteredInstructor[];
  imageUrl?: string;
  count?: number;
};

export const NO_MATCH_DOJO_ID = "__no_match__";

function extractRegisteredInstructors(
  rawIds: unknown,
  nameById?: Map<string, string>
): RegisteredInstructor[] {
  if (!Array.isArray(rawIds)) return [];

  const populated = rawIds
    .filter(
      (entry): entry is { _id: unknown; name: string } =>
        entry !== null &&
        typeof entry === "object" &&
        "name" in entry &&
        typeof (entry as { name: unknown }).name === "string"
    )
    .map((entry) => ({
      _id: String(entry._id),
      name: entry.name,
    }));

  if (populated.length > 0) return populated;

  if (!nameById) {
    return rawIds.map((id) => ({ _id: String(id), name: "" }));
  }

  return rawIds
    .map((id) => String(id))
    .filter((id) => nameById.has(id))
    .map((id) => ({ _id: id, name: nameById.get(id)! }));
}

async function buildInstructorNameMap(
  dojos: Record<string, unknown>[]
): Promise<Map<string, string>> {
  const idSet = new Set<string>();
  for (const dojo of dojos) {
    if (!Array.isArray(dojo.instructorIds)) continue;
    for (const id of dojo.instructorIds) {
      if (id && typeof id === "object" && "name" in id) continue;
      idSet.add(String(id));
    }
  }

  if (idSet.size === 0) return new Map();

  const users = await User.find({ _id: { $in: [...idSet] } })
    .select("name")
    .lean();

  return new Map(users.map((u) => [String(u._id), u.name as string]));
}

export function normalizeDojo(
  dojo: Record<string, unknown>,
  nameById?: Map<string, string>
): DojoListItem {
  const instructors =
    Array.isArray(dojo.instructors) && dojo.instructors.length > 0
      ? (dojo.instructors as string[])
      : typeof dojo.instructor === "string"
        ? dojo.instructor
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

  const registeredInstructors = extractRegisteredInstructors(
    dojo.instructorIds,
    nameById
  ).filter((i) => i.name);
  const instructorIds = Array.isArray(dojo.instructorIds)
    ? registeredInstructors.length > 0
      ? registeredInstructors.map((i) => i._id)
      : (dojo.instructorIds as unknown[]).map(String)
    : [];

  const { instructorIds: _rawIds, ...rest } = dojo;

  return {
    ...(rest as Omit<
      DojoListItem,
      "_id" | "instructors" | "instructorIds" | "registeredInstructors"
    >),
    _id: String(dojo._id),
    instructors,
    instructorIds,
    registeredInstructors,
  };
}

export async function getDojoIdsForInstructor(instructor: string): Promise<string[]> {
  await connectDB();
  const dojos = await Dojo.find({})
    .select("_id dojoId instructor instructors")
    .lean();

  const ids = new Set<string>();

  for (const dojo of dojos) {
    const normalized = normalizeDojo(dojo as Record<string, unknown>);
    if (!normalized.instructors.includes(instructor)) continue;

    ids.add(normalized._id);
    if (normalized.dojoId) ids.add(normalized.dojoId);
  }

  return [...ids];
}

export async function resolveStudentDojoFilter(
  dojoId: string,
  instructor: string
): Promise<Record<string, unknown> | null> {
  if (!dojoId && !instructor) return null;

  if (instructor) {
    const instructorDojoIds = await getDojoIdsForInstructor(instructor);

    if (dojoId) {
      return {
        dojoId: instructorDojoIds.includes(dojoId)
          ? dojoId
          : { $in: [NO_MATCH_DOJO_ID] },
      };
    }

    return {
      dojoId: instructorDojoIds.length
        ? { $in: instructorDojoIds }
        : { $in: [NO_MATCH_DOJO_ID] },
    };
  }

  return { dojoId };
}

export async function dojoSearchFilter(search: string) {
  if (!search) return {};
  const q = prefixRegex(search);

  const matchingInstructors = await User.find({
    role: "instructor",
    name: q,
  })
    .select("_id")
    .lean();

  const instructorIdFilter =
    matchingInstructors.length > 0
      ? [{ instructorIds: { $in: matchingInstructors.map((u) => u._id) } }]
      : [];

  return {
    $or: [
      { name: q },
      { dojoId: q },
      { location: q },
      { instructor: q },
      { instructors: q },
      ...instructorIdFilter,
    ],
  };
}

export async function queryDojosWithCounts(page: number, limit: number, search: string) {
  await connectDB();
  const filter = await dojoSearchFilter(search);
  const skip = (page - 1) * limit;

  const [dojos, total] = await Promise.all([
    Dojo.find(filter)
      .select("_id dojoId name location instructor instructors instructorIds imageUrl createdAt")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    Dojo.countDocuments(filter),
  ]);

  const nameById = await buildInstructorNameMap(
    dojos as Record<string, unknown>[]
  );
  const mapped = dojos.map((dojo) =>
    normalizeDojo(dojo as Record<string, unknown>, nameById)
  );
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
  instructorIds: string[];
  registeredInstructors: RegisteredInstructor[];
};

export async function queryDojoOptions(): Promise<DojoDropdownOption[]> {
  await connectDB();
  const dojos = await Dojo.find({})
    .select("_id dojoId name location instructor instructors instructorIds imageUrl")
    .sort({ location: 1 })
    .lean();

  const nameById = await buildInstructorNameMap(
    dojos as Record<string, unknown>[]
  );

  return dojos.map((dojo) => {
    const normalized = normalizeDojo(dojo as Record<string, unknown>, nameById);
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
      instructorIds: normalized.instructorIds,
      registeredInstructors: normalized.registeredInstructors,
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

export async function queryInstructorDojosWithCounts(
  userId: string,
  page: number,
  limit: number,
  search: string
) {
  await connectDB();
  const assignedIds = await getAssignedDojoIds(userId);
  if (assignedIds.length === 0) {
    return { data: [], total: 0, page, totalPages: 1 };
  }

  const baseFilter = { _id: { $in: assignedIds } };
  const searchFilter = search ? await dojoSearchFilter(search) : {};
  const filter = { $and: [baseFilter, searchFilter] };
  const skip = (page - 1) * limit;

  const [dojos, total] = await Promise.all([
    Dojo.find(filter)
      .select("_id dojoId name location instructor instructors instructorIds imageUrl createdAt")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    Dojo.countDocuments(filter),
  ]);

  const nameById = await buildInstructorNameMap(
    dojos as Record<string, unknown>[]
  );
  const mapped = dojos.map((dojo) =>
    normalizeDojo(dojo as Record<string, unknown>, nameById)
  );
  const data = await attachDojoStudentCounts(mapped);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / Math.max(limit, 1)) || 1,
  };
}

export async function queryInstructorDojoOptions(
  userId: string
): Promise<DojoDropdownOption[]> {
  await connectDB();
  const assignedIds = await getAssignedDojoIds(userId);
  if (assignedIds.length === 0) return [];

  const dojos = await Dojo.find({ _id: { $in: assignedIds } })
    .select("_id dojoId name location instructor instructors instructorIds imageUrl")
    .sort({ location: 1 })
    .lean();

  const nameById = await buildInstructorNameMap(
    dojos as Record<string, unknown>[]
  );

  return dojos.map((dojo) => {
    const normalized = normalizeDojo(dojo as Record<string, unknown>, nameById);
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
      instructorIds: normalized.instructorIds,
      registeredInstructors: normalized.registeredInstructors,
    };
  });
}
