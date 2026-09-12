'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  type BeltHistoryEntry,
  type RecentTestsFilters,
  type ExamDayFilters,
  beltHistoryQuery,
  recentTestsQuery,
  examDayQuery,
  allDojosQuery,
  promoteStudent,
  updateBeltHistoryEntry,
  deleteBeltHistoryEntry,
} from '@/queries/studentQueries';

export function useBeltHistory(studentId: string) {
  return useQuery(beltHistoryQuery(studentId));
}

export function useRecentTests(
  page = 1,
  limit = 50,
  filters: RecentTestsFilters = {}
) {
  return useQuery(recentTestsQuery(page, limit, filters));
}

export function useExamDay(
  page = 1,
  limit = 50,
  filters: ExamDayFilters = {}
) {
  return useQuery(examDayQuery(page, limit, filters));
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
      qc.invalidateQueries({ queryKey: queryKeys.tests.all() });
      qc.invalidateQueries({ queryKey: ['examDay'] });
    },
  });
}

export function useUpdateBeltHistory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateBeltHistoryEntry,

    onSettled: (_data, _err, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all() });
      qc.invalidateQueries({ queryKey: queryKeys.students.detail(vars.studentId) });
      qc.invalidateQueries({ queryKey: queryKeys.students.beltHistory(vars.studentId) });
      qc.invalidateQueries({ queryKey: queryKeys.tests.all() });
      qc.invalidateQueries({ queryKey: ['examDay'] });
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
      qc.invalidateQueries({ queryKey: queryKeys.tests.all() });
      qc.invalidateQueries({ queryKey: ['examDay'] });
    },
  });
}

