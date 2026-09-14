import {
  fetchApplications,
  reviewApplication,
  type ApplicationItem,
} from '@/queries/applicationQueries';

export type { ApplicationItem };

export async function fetchChangeRequests() {
  const res = await fetch('/api/instructor/change-requests');
  if (!res.ok) throw new Error('Failed to load change requests');
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Failed to load change requests');
  return json.requests as Array<{
    _id: string;
    type: string;
    status: string;
    targetDojoId?: string;
    payload: Record<string, unknown>;
    currentSnapshot?: Record<string, unknown>;
    createdAt?: string;
  }>;
}

export async function submitChangeRequest(body: {
  type: 'profile_update' | 'dojo_update' | 'dojo_join';
  targetDojoId?: string;
  payload?: Record<string, unknown>;
}) {
  const res = await fetch('/api/instructor/change-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to submit request');
  }
  return json.request;
}

export { fetchApplications, reviewApplication };
