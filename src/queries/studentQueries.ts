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
  createdBy?: string;
  updatedBy?: string;
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
  status?: 'Pass' | 'Fail';
  createdAt?: string;
};

export type RecentTestEntry = {
  _id: string;
  beltName: string;
  rank: number;
  awardedDate: string;
  examiner?: string;
  notes?: string;
  status?: 'Pass' | 'Fail';
  createdAt?: string;
  student: Student | null;
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

export type RecentTestsResponse = {
  history: RecentTestEntry[];
  total: number;
  page: number;
  totalPages: number;
};

export async function fetchRecentTests(page = 1, limit = 10): Promise<RecentTestsResponse> {
  const res = await fetch(`/api/admin/tests?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load recent tests');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to load recent tests');
  return {
    history: json.history,
    total: json.total,
    page: json.page,
    totalPages: json.totalPages,
  };
}

export type DojoDropdownOption = {
  _id: string;
  dojoId?: string;
  name: string;
  location: string;
  instructor?: string;
  instructors?: string[];
};

// unpaginated dojo list for dropdowns
export async function fetchAllDojos(): Promise<DojoDropdownOption[]> {
  const res = await fetch('/api/admin/dojos/options');
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

export const recentTestsQuery = (page = 1, limit = 10) => ({
  queryKey: queryKeys.tests.recent(page, limit),
  queryFn:  () => fetchRecentTests(page, limit),
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
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create student');
  return json.student;
}

export async function updateStudent({ id, ...data }: StudentInput & { id: string }): Promise<Student> {
  const res = await fetch(`/api/students/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update student');
  return json.student;
}

export async function deleteStudent(id: string): Promise<Student> {
  const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || 'Failed to deactivate student');
  return json.student;
}

export async function promoteStudent({
  id,
  beltName,
  awardedDate,
  examiner,
  notes,
  status = 'Pass',
}: {
  id: string;
  beltName: string;
  awardedDate?: string;
  examiner?: string;
  notes?: string;
  status?: 'Pass' | 'Fail';
}): Promise<{ student: Student; progression: BeltHistoryEntry }> {
  const res = await fetch(`/api/students/${id}/promote`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ beltName, awardedDate, examiner, notes, status }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Failed to record test result');
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json;
}

// update a belt history entry
export async function updateBeltHistoryEntry({
  studentId,
  entryId,
  beltName,
  awardedDate,
  examiner,
  notes,
  status,
}: {
  studentId: string;
  entryId: string;
  beltName?: string;
  awardedDate?: string;
  examiner?: string;
  notes?: string;
  status?: 'Pass' | 'Fail';
}): Promise<{ entry: BeltHistoryEntry }> {
  const res = await fetch(`/api/students/${studentId}/belt-history/${entryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ beltName, awardedDate, examiner, notes, status }),
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Failed to update entry');
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json;
}

// delete a belt history entry
export async function deleteBeltHistoryEntry({
  studentId,
  entryId,
}: {
  studentId: string;
  entryId: string;
}): Promise<void> {
  const res = await fetch(`/api/students/${studentId}/belt-history/${entryId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const json = await res.json();
    throw new Error(json.message || 'Failed to delete entry');
  }
}

