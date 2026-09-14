import { queryKeys } from '@/lib/queryKeys';

export type ApplicationItem =
  | {
      kind: 'registration';
      _id: string;
      name: string;
      email?: string;
      phone?: string;
      avatarUrl?: string;
      bio?: string;
      dojoIds?: string[];
      dojos?: Array<{
        _id: string;
        dojoId: string;
        name: string;
        location: string;
      }>;
      appliedAt?: string;
      createdAt?: string;
    }
  | {
      kind: 'change';
      _id: string;
      type: 'profile_update' | 'dojo_update' | 'dojo_join';
      status: 'pending';
      submittedBy: {
        _id: string;
        name: string;
        email?: string;
        phone?: string;
        avatarUrl?: string;
      };
      targetDojo?: {
        _id: string;
        dojoId: string;
        name: string;
        location: string;
        imageUrl?: string;
      };
      payload: Record<string, unknown>;
      currentSnapshot?: Record<string, unknown>;
      createdAt?: string;
    };

/** @deprecated use ApplicationItem */
export type InstructorApplication = Extract<ApplicationItem, { kind: 'registration' }>;

export async function fetchApplications(): Promise<ApplicationItem[]> {
  const res = await fetch('/api/admin/applications');
  if (!res.ok) throw new Error('Failed to load applications');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to load applications');
  return json.applications;
}

export async function reviewApplication(
  id: string,
  action: 'approve' | 'reject',
  options?: { rejectionReason?: string; kind?: 'registration' | 'change' }
): Promise<void> {
  const res = await fetch(`/api/admin/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      rejectionReason: options?.rejectionReason,
      kind: options?.kind,
    }),
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
