import { queryKeys } from '@/lib/queryKeys';

export type StaffUser = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'instructor';
  createdAt?: string;
};

export async function fetchStaffUsers(): Promise<StaffUser[]> {
  const res = await fetch('/api/admin/users');
  if (!res.ok) throw new Error('Failed to load staff');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to load staff');
  return json.users;
}

export async function updateStaffRole(
  id: string,
  role: StaffUser['role']
): Promise<{ user: StaffUser; selfUpdated?: boolean }> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to update role');
  }
  return { user: json.user, selfUpdated: json.selfUpdated };
}

export const staffListQuery = () => ({
  queryKey: queryKeys.staff.list(),
  queryFn: fetchStaffUsers,
  staleTime: 5 * 60 * 1000,
});
