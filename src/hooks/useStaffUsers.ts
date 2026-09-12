'use client';

import { useQuery } from '@tanstack/react-query';
import { staffListQuery } from '@/queries/staffQueries';

export function useStaffUsers(enabled = true) {
  return useQuery({
    ...staffListQuery(),
    enabled,
  });
}
