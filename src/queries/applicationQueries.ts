import { queryKeys } from '@/lib/queryKeys';

export type InstructorApplication = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  dojoIds?: string[];
  dojos?: Array<{
    _id: string;
    dojoId: string;
    name: string;
    location: string;
  }>;
  appliedAt?: string;
  createdAt?: string;
};

export async function fetchApplications(): Promise<InstructorApplication[]> {
  const res = await fetch('/api/admin/applications');
  if (!res.ok) throw new Error('Failed to load applications');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to load applications');
  return json.applications;
}

export async function reviewApplication(
  id: string,
  action: 'approve' | 'reject',
  rejectionReason?: string
): Promise<void> {
  const res = await fetch(`/api/admin/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, rejectionReason }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to update application');
  }
}

export const applicationsListQuery = () => ({
  queryKey: queryKeys.applications.list(),
  queryFn: fetchApplications,
  staleTime: 30 * 1000,
});
