'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  type BeltHistoryEntry,
  beltHistoryQuery,
  recentTestsQuery,
  allDojosQuery,
  promoteStudent,
  updateBeltHistoryEntry,
  deleteBeltHistoryEntry,
} from '@/queries/studentQueries';

export function useBeltHistory(studentId: string) {
  return useQuery(beltHistoryQuery(studentId));
}

export function useRecentTests(limit = 30) {
  return useQuery(recentTestsQuery(limit));
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
      qc.invalidateQueries({ queryKey: queryKeys.tests.recent() });
    },
  });
}

export function useUpdateBeltHistory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateBeltHistoryEntry,

    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.beltHistory(vars.studentId) });
      qc.invalidateQueries({ queryKey: queryKeys.tests.recent() });
    },
  });
}

export function useDeleteBeltHistory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteBeltHistoryEntry,

    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all() });
      qc.invalidateQueries({ queryKey: queryKeys.students.beltHistory(vars.studentId) });
      qc.invalidateQueries({ queryKey: queryKeys.tests.recent() });
    },
  });
}

