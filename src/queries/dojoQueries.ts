// dojo API functions — colocated with the domain
import { queryKeys } from '@/lib/queryKeys';

export type Dojo = {
  _id: string;
  dojoId?: string;
  name: string;
  location: string;
  instructor?: string;
  status?: "Active" | "Inactive";
  count?: number;
};

export type DojoInput = {
  name: string;
  location: string;
  instructor?: string;
};

export type DojoListResponse = {
  success: boolean;
  data: Dojo[];
  total?: number;
  page?: number;
  totalPages?: number;
  message?: string;
};

// --- fetchers ---

export async function fetchDojos({ page = 1, search = '' } = {}): Promise<DojoListResponse> {
  const res = await fetch(
    `/api/admin/dojos?page=${page}&search=${encodeURIComponent(search)}`
  );
  if (!res.ok) throw new Error('Failed to load dojos');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to load dojos');
  return json; // { data, total, page, totalPages }
}

export async function fetchSearchDojos(query: string): Promise<DojoListResponse> {
  const res = await fetch(`/api/admin/dojos/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to search dojos");
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to search dojos");
  return json;
}

export async function fetchDojo(id: string): Promise<Dojo> {
  const res = await fetch(`/api/admin/dojos/${id}`);
  if (!res.ok) throw new Error('Dojo not found');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.dojo;
}

// --- query options (use these directly in useQuery) ---

export const dojoListQuery = (page: number, search: string) => ({
  queryKey: queryKeys.dojos.list(page, search),
  queryFn:  () => fetchDojos({ page, search }),
});

export const dojoDetailQuery = (id: string) => ({
  queryKey: queryKeys.dojos.detail(id),
  queryFn:  () => fetchDojo(id),
  enabled:  !!id,
});

// --- mutation functions ---

export async function createDojo(data: DojoInput): Promise<Dojo> {
  const res = await fetch('/api/admin/dojos', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create dojo');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.dojo;
}

export async function updateDojo({ id, ...data }: DojoInput & { id: string }): Promise<Dojo> {
  const res = await fetch(`/api/admin/dojos/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update dojo');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.dojo;
}
