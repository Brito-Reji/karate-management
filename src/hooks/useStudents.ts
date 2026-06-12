'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  type Student,
  type StudentFilters,
  type StudentInput,
  type StudentListResponse,
  studentListQuery,
  studentDetailQuery,
  createStudent,
  updateStudent,
  deleteStudent,
} from '@/queries/studentQueries';

// --- queries ---

export function useStudents(page: number, search: string, filters: StudentFilters) {
  return useQuery({
    ...studentListQuery(page, search, filters),
    placeholderData: keepPreviousData,
  });
}

export function useStudent(id: string) {
  return useQuery(studentDetailQuery(id));
}

// --- mutations ---

export function useCreateStudent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createStudent,

    onMutate: async (newStudent: StudentInput) => {
      await qc.cancelQueries({ queryKey: queryKeys.students.all() });

      const snapshot = qc.getQueriesData({ queryKey: queryKeys.students.all() });

      qc.setQueriesData<StudentListResponse>({ queryKey: queryKeys.students.all() }, (old) => {
        if (!old?.students) return old;
        return {
          ...old,
          students: [{ _id: '__optimistic__', ...newStudent }, ...old.students],
        };
      });

      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all() });
    },
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateStudent,

    onMutate: async ({ id, ...patch }: StudentInput & { id: string }) => {
      await qc.cancelQueries({ queryKey: queryKeys.students.all() });
      await qc.cancelQueries({ queryKey: queryKeys.students.detail(id) });

      const prevList   = qc.getQueriesData({ queryKey: queryKeys.students.all() });
      const prevDetail = qc.getQueryData<Student>(queryKeys.students.detail(id));

      qc.setQueriesData<StudentListResponse>({ queryKey: queryKeys.students.all() }, (old) => {
        if (!old?.students) return old;
        return {
          ...old,
          students: old.students.map((s) => (s._id === id ? { ...s, ...patch } : s)),
        };
      });

      qc.setQueryData<Student>(queryKeys.students.detail(id), (old) =>
        old ? { ...old, ...patch } : old
      );

      return { prevList, prevDetail };
    },

    onError: (_err, { id }, ctx) => {
      ctx?.prevList?.forEach(([key, data]) => qc.setQueryData(key, data));
      if (ctx?.prevDetail)
        qc.setQueryData(queryKeys.students.detail(id), ctx.prevDetail);
    },

    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all() });
      qc.invalidateQueries({ queryKey: queryKeys.students.detail(id) });
    },
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteStudent,

    // optimistic: flip status to Inactive instantly
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: queryKeys.students.all() });

      const prevList = qc.getQueriesData({ queryKey: queryKeys.students.all() });

      qc.setQueriesData<StudentListResponse>({ queryKey: queryKeys.students.all() }, (old) => {
        if (!old?.students) return old;
        return {
          ...old,
          students: old.students.map((s) =>
            s._id === id ? { ...s, status: 'Inactive' } : s
          ),
        };
      });

      return { prevList };
    },

    onError: (_err, _id, ctx) => {
      ctx?.prevList?.forEach(([key, data]) => qc.setQueryData(key, data));
    },

    onSettled: (_data, _err, id) => {
      qc.invalidateQueries({ queryKey: queryKeys.students.all() });
      qc.invalidateQueries({ queryKey: queryKeys.students.detail(id) });
    },
  });
}
