// student API functions — colocated with the domain
import { queryKeys } from '@/lib/queryKeys';

// --- fetchers ---

export async function fetchStudents({ page = 1, search = '', ...filters } = {}) {
  const params = new URLSearchParams({
    page:   String(page),
    search: search,
    ...filters,
  });
  const res = await fetch(`/api/students?${params}`);
  if (!res.ok) throw new Error('Failed to load students');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to load students');
  return json; // { students, total, page, totalPages }
}

export async function fetchStudent(id) {
  const res = await fetch(`/api/students/${id}`);
  if (!res.ok) throw new Error('Student not found');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.student;
}

// --- query options ---

export const studentListQuery = (page, search, filters = {}) => ({
  queryKey: queryKeys.students.list(page, search, filters),
  queryFn:  () => fetchStudents({ page, search, ...filters }),
});

export const studentDetailQuery = (id) => ({
  queryKey: queryKeys.students.detail(id),
  queryFn:  () => fetchStudent(id),
  enabled:  !!id,
});

// --- mutation functions ---

export async function createStudent(data) {
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

export async function updateStudent({ id, ...data }) {
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

export async function deleteStudent(id) {
  const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to deactivate student');
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.student;
}
