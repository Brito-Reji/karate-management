import { queryKeys } from '@/lib/queryKeys';

export type CommissionSettingRow = {
  beltName: string;
  rank: number;
  configured: boolean;
  fee: number | null;
  instructorCommission: number | null;
  adminProfit: number | null;
  updatedAt: string | null;
};

export type CommissionDashboardEntry = {
  _id: string;
  student: { _id: string; name: string; studentId: string } | null;
  beltName: string;
  fromBelt?: string;
  status: 'Pass' | 'Fail';
  awardedDate: string;
  dojoId: string | null;
  dojoName: string | null;
  instructorId: string | null;
  instructorName: string | null;
  examiner: string | null;
  fee: number | null;
  commission: number | null;
  profit: number | null;
  feeConfigured: boolean;
};

export type CommissionDashboardResponse = {
  success: boolean;
  filters: {
    from: string | null;
    to: string | null;
    dojoId: string;
    instructorId: string;
    status: string;
    assignment: string;
  };
  summary: {
    tests: number;
    fees: number;
    commission: number;
    profit: number;
    unassigned: {
      tests: number;
      fees: number;
      commission: number;
      profit: number;
    };
    missingFeeSetting: number;
  };
  byInstructor: Array<{
    instructorId: string;
    instructorName: string;
    dojoId: string;
    dojoName: string;
    tests: number;
    commission: number;
  }>;
  entries: CommissionDashboardEntry[];
  total: number;
  page: number;
  totalPages: number;
  message?: string;
};

export type CommissionSettingsResponse = {
  success: boolean;
  settings: CommissionSettingRow[];
  message?: string;
};

export type FeeSettingInput = {
  beltName: string;
  fee: number;
  instructorCommission: number;
};

export function formatInr(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export async function fetchCommissionDashboard(
  page = 1,
  limit = 50,
  filters: {
    from?: string;
    to?: string;
    all?: boolean;
    dojoId?: string;
    instructorId?: string;
    status?: string;
    assignment?: string;
    sort?: string;
    order?: string;
  } = {}
): Promise<CommissionDashboardResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (filters.all) params.set('all', '1');
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.dojoId) params.set('dojoId', filters.dojoId);
  if (filters.instructorId) params.set('instructorId', filters.instructorId);
  if (filters.status) params.set('status', filters.status);
  if (filters.assignment) params.set('assignment', filters.assignment);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);

  const res = await fetch(`/api/admin/commissions?${params}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load commissions');
  }
  return json;
}

export async function fetchCommissionSettings(): Promise<CommissionSettingsResponse> {
  const res = await fetch('/api/admin/commissions/settings');
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to load fee settings');
  }
  return json;
}

export const commissionDashboardQuery = (
  page: number,
  limit: number,
  filters: Parameters<typeof fetchCommissionDashboard>[2] = {}
) => ({
  queryKey: queryKeys.commissions.dashboard(page, limit, filters),
  queryFn: () => fetchCommissionDashboard(page, limit, filters),
});

export const commissionSettingsQuery = () => ({
  queryKey: queryKeys.commissions.settings(),
  queryFn: fetchCommissionSettings,
});

export async function upsertCommissionSetting(data: FeeSettingInput) {
  const res = await fetch('/api/admin/commissions/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to save setting');
  }
  return json.setting as {
    beltName: string;
    fee: number;
    instructorCommission: number;
    adminProfit: number;
    updatedAt: string;
  };
}

export async function assignTestInstructor(testId: string, instructorId: string) {
  const res = await fetch(`/api/admin/commissions/tests/${testId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instructorId }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to assign instructor');
  }
  return json.entry as {
    _id: string;
    instructorId: string;
    instructorName: string;
    examiner: string;
  };
}
