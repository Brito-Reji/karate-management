'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  type BeltHistoryEntry,
  beltHistoryQuery,
  allDojosQuery,
  promoteStudent,
} from '@/queries/studentQueries';

export function useBeltHistory(studentId: string) {
  return useQuery(beltHistoryQuery(studentId));
}

export function useAllDojos() {
  return useQuery(allDojosQuery());
}

export function usePromoteStudent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: promoteStudent,

    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all() });
      qc.invalidateQueries({ queryKey: queryKeys.students.detail(vars.id) });
      qc.invalidateQueries({ queryKey: queryKeys.students.beltHistory(vars.id) });
    },
  });
}
