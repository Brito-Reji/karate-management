export type AuthUser = {
  userId: string;
  name: string;
  role: string;
};

export async function fetchMe(): Promise<AuthUser> {
  const res = await fetch('/api/admin/me');
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Not authenticated');
  }
  return json.user as AuthUser;
}

export const meQuery = {
  queryKey: ['auth', 'me'] as const,
  queryFn: fetchMe,
  staleTime: 1000 * 60,
  gcTime: 1000 * 60 * 60,
  refetchOnWindowFocus: true as const,
};
