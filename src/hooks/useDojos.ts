'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  type Dojo,
  type DojoInput,
  type DojoListResponse,
  dojoListQuery,
  dojoDetailQuery,
  createDojo,
  updateDojo,
} from '@/queries/dojoQueries';

// --- queries ---

export function useDojos(page: number, search: string, enabled = true) {
  return useQuery({
    ...dojoListQuery(page, search),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useDojo(id: string) {
  return useQuery(dojoDetailQuery(id));
}

// --- mutations ---

export function useCreateDojo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createDojo,

    // optimistic: add a temp row immediately
    onMutate: async (newDojo: DojoInput) => {
      await qc.cancelQueries({ queryKey: queryKeys.dojos.all() });

      const snapshot = qc.getQueriesData({ queryKey: queryKeys.dojos.all() });

      qc.setQueriesData<DojoListResponse>({ queryKey: queryKeys.dojos.all() }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: [{ _id: '__optimistic__', ...newDojo }, ...old.data],
        };
      });

      return { snapshot };
    },

    // rollback on error
    onError: (_err, _vars, ctx) => {
      ctx?.snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));
    },

    // always refetch to sync real server state
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.dojos.all() });
    },
  });
}

export function useUpdateDojo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: updateDojo,

    // optimistic: patch the list and detail cache in place
    onMutate: async ({ id, ...patch }: DojoInput & { id: string }) => {
      await qc.cancelQueries({ queryKey: queryKeys.dojos.all() });
      await qc.cancelQueries({ queryKey: queryKeys.dojos.detail(id) });

      const prevList   = qc.getQueriesData({ queryKey: queryKeys.dojos.all() });
      const prevDetail = qc.getQueryData<Dojo>(queryKeys.dojos.detail(id));

      // patch every cached list page
      qc.setQueriesData<DojoListResponse>({ queryKey: queryKeys.dojos.all() }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((d) => (d._id === id ? { ...d, ...patch } : d)),
        };
      });

      // patch the detail cache if present
      qc.setQueryData<Dojo>(queryKeys.dojos.detail(id), (old) =>
        old ? { ...old, ...patch } : old
      );

      return { prevList, prevDetail };
    },

    onError: (_err, { id }, ctx) => {
      ctx?.prevList?.forEach(([key, data]) => qc.setQueryData(key, data));
      if (ctx?.prevDetail) qc.setQueryData(queryKeys.dojos.detail(id), ctx.prevDetail);
    },

    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.dojos.all() });
      qc.invalidateQueries({ queryKey: queryKeys.dojos.detail(id) });
    },
  });
}
