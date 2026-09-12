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

export const staffListQuery = () => ({
  queryKey: queryKeys.staff.list(),
  queryFn: fetchStaffUsers,
  staleTime: 5 * 60 * 1000,
});
