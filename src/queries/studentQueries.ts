import { queryKeys } from '@/lib/queryKeys';

export type Student = {
  _id: string;
  studentId?: string;
  name?: string;
  dojoId?: string;
  dob?: string;
  gender?: "Male" | "Female" | "Other";
  phoneNumber?: string;
  fatherName?: string;
  motherName?: string;
  admissionDate?: string;
  belt?: string;
  pendingFees?: number;
  image?: string;
  status?: "Active" | "Inactive";
};

export type StudentInput = Omit<Student, "_id">;

export type StudentFilters = Record<string, string>;

type StudentListParams = {
  page?: number;
  search?: string;
  [key: string]: string | number | undefined;
};

export type StudentListResponse = {
  success: boolean;
  students: Student[];
  total?: number;
  page?: number;
  totalPages?: number;
  message?: string;
};

export type BeltHistoryEntry = {
  _id: string;
  studentId: string;
  beltName: string;
  rank: number;
  awardedDate: string;
  examiner?: string;
  notes?: string;
  createdAt?: string;
};

// --- fetchers ---

export async function fetchStudents({
  page = 1,
  search = '',
  ...filters
}: StudentListParams = {}): Promise<StudentListResponse> {
  const params = new URLSearchParams({
    page:   String(page),
    search: search,
    ...filters,
  });
  const res = await fetch(`/api/students?${params}`);
  if (!res.ok) throw new Error('Failed to load students');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to load students');
  return json;
}

export async function fetchStudent(id: string): Promise<Student> {
  const res = await fetch(`/api/students/${id}`);
  if (!res.ok) throw new Error('Student not found');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.student;
}

export async function fetchBeltHistory(id: string): Promise<BeltHistoryEntry[]> {
  const res = await fetch(`/api/students/${id}/belt-history`);
  if (!res.ok) throw new Error('Failed to load belt history');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.history;
}

// unpaginated dojo list for dropdowns
export async function fetchAllDojos(): Promise<{ _id: string; dojoId: string; name: string; location: string }[]> {
  const res = await fetch('/api/admin/dojos?limit=100');
  if (!res.ok) throw new Error('Failed to load dojos');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data;
}

// --- query options ---

export const studentListQuery = (page: number, search: string, filters: StudentFilters = {}) => ({
  queryKey: queryKeys.students.list(page, search, filters),
  queryFn:  () => fetchStudents({ page, search, ...filters }),
});

export const studentDetailQuery = (id: string) => ({
  queryKey: queryKeys.students.detail(id),
  queryFn:  () => fetchStudent(id),
  enabled:  !!id,
});

export const beltHistoryQuery = (id: string) => ({
  queryKey: queryKeys.students.beltHistory(id),
  queryFn:  () => fetchBeltHistory(id),
  enabled:  !!id,
});

export const allDojosQuery = () => ({
  queryKey: queryKeys.dojos.dropdown(),
  queryFn:  () => fetchAllDojos(),
  staleTime: 5 * 60 * 1000,
});

// --- mutation functions ---

export async function createStudent(data: StudentInput): Promise<Student> {
  const res = await fetch('/api/students', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create student');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.student;
}

export async function updateStudent({ id, ...data }: StudentInput & { id: string }): Promise<Student> {
  const res = await fetch(`/api/students/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update student');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.student;
}

export async function deleteStudent(id: string): Promise<Student> {
  const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to deactivate student');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.student;
}

export async function promoteStudent({
  id,
  beltName,
  awardedDate,
  examiner,
  notes,
}: {
  id: string;
  beltName: string;
  awardedDate?: string;
  examiner?: string;
  notes?: string;
}): Promise<{ student: Student; progression: BeltHistoryEntry }> {
  const res = await fetch(`/api/students/${id}/promote`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ beltName, awardedDate, examiner, notes }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Failed to promote student');
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json;
}
