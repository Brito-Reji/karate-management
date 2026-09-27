'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  commissionDashboardQuery,
  commissionSettingsQuery,
  upsertCommissionSetting,
  type FeeSettingInput,
} from '@/queries/commissionQueries';

export function useCommissionDashboard(
  page = 1,
  limit = 50,
  filters: Parameters<typeof commissionDashboardQuery>[2] = {}
) {
  return useQuery(commissionDashboardQuery(page, limit, filters));
}

export function useCommissionSettings() {
  return useQuery(commissionSettingsQuery());
}

export function useUpsertCommissionSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FeeSettingInput) => upsertCommissionSetting(data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.commissions.all() });
    },
  });
}

