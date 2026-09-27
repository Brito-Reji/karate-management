'use client';

import React, { Suspense, useState } from 'react';
import CommissionsSubnav from '@/components/commissions/CommissionsSubnav';
import { useCommissionSettings, useUpsertCommissionSetting } from '@/hooks/useCommissions';
import { formatInr } from '@/queries/commissionQueries';

function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
      ))}
    </div>
  );
}

function SettingsContent() {
  const { data, isLoading, isFetching } = useCommissionSettings();
  const upsert = useUpsertCommissionSetting();
  const settings = data?.settings ?? [];

  const [editing, setEditing] = useState<{
    beltName: string;
    fee: string;
    instructorCommission: string;
  } | null>(null);
  const [formError, setFormError] = useState('');

  const openEdit = (row: (typeof settings)[number]) => {
    setFormError('');
    setEditing({
      beltName: row.beltName,
      fee: row.configured && row.fee != null ? String(row.fee) : '',
      instructorCommission:
        row.configured && row.instructorCommission != null
          ? String(row.instructorCommission)
          : '',
    });
  };

  const handleSave = () => {
    if (!editing) return;
    setFormError('');
    const fee = Number(editing.fee);
    const instructorCommission = Number(editing.instructorCommission);
    if (!Number.isFinite(fee) || fee < 0) {
      setFormError('Enter a valid fee (≥ 0)');
      return;
    }
    if (!Number.isFinite(instructorCommission) || instructorCommission < 0) {
      setFormError('Enter a valid commission (≥ 0)');
      return;
    }
    upsert.mutate(
      { beltName: editing.beltName, fee, instructorCommission },
      {
        onSuccess: () => setEditing(null),
        onError: (err) => setFormError(err.message),
      }
    );
  };

  const previewProfit =
    editing &&
    Number.isFinite(Number(editing.fee)) &&
    Number.isFinite(Number(editing.instructorCommission))
      ? Number(editing.fee) - Number(editing.instructorCommission)
      : null;

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-xl font-light tracking-tight text-zinc-100">Fee settings</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Per-belt test fee and fixed instructor commission (INR). Academy profit is computed automatically.
          </p>
        </div>
        <CommissionsSubnav />
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-200">All belts</h2>
          {isFetching && !isLoading ? (
            <span className="text-[10px] text-zinc-500 animate-pulse">Syncing…</span>
          ) : null}
        </div>

        {isLoading ? (
          <div className="p-4">
            <SkeletonRows />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[640px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-white/[0.06]">
                  <th className="px-4 py-3 font-medium">Belt</th>
                  <th className="px-4 py-3 font-medium">Test fee</th>
                  <th className="px-4 py-3 font-medium">Instructor commission</th>
                  <th className="px-4 py-3 font-medium">Academy profit</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {settings.map((row) => (
                  <tr key={row.beltName} className="border-b border-white/[0.04]">
                    <td className="px-4 py-3 text-zinc-200 font-medium">{row.beltName}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-300">
                      {row.configured ? formatInr(row.fee) : '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-300">
                      {row.configured ? formatInr(row.instructorCommission) : '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.configured ? (
                        <span
                          className={
                            (row.adminProfit ?? 0) < 0 ? 'text-red-400' : 'text-zinc-200'
                          }
                        >
                          {formatInr(row.adminProfit)}
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="text-xs text-zinc-400 hover:text-zinc-100"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-zinc-950 border border-white/[0.08] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-medium text-zinc-100">{editing.beltName} — fees</h3>
            <label className="block space-y-1.5">
              <span className="text-xs text-zinc-400">Test fee (₹)</span>
              <input
                type="number"
                min={0}
                value={editing.fee}
                onChange={(e) => setEditing({ ...editing, fee: e.target.value })}
                className="w-full h-10 px-3 bg-zinc-900 border border-white/[0.06] rounded-lg text-sm text-zinc-200"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs text-zinc-400">Instructor commission (₹)</span>
              <input
                type="number"
                min={0}
                value={editing.instructorCommission}
                onChange={(e) =>
                  setEditing({ ...editing, instructorCommission: e.target.value })
                }
                className="w-full h-10 px-3 bg-zinc-900 border border-white/[0.06] rounded-lg text-sm text-zinc-200"
              />
            </label>
            {previewProfit != null ? (
              <p className="text-xs text-zinc-500">
                Academy profit per test:{' '}
                <span className={previewProfit < 0 ? 'text-red-400' : 'text-zinc-200'}>
                  {formatInr(previewProfit)}
                </span>
              </p>
            ) : null}
            {formError ? <p className="text-xs text-red-400">{formError}</p> : null}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-4 h-9 text-xs text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={upsert.isPending}
                onClick={handleSave}
                className="px-4 h-9 bg-zinc-100 text-zinc-950 text-xs font-medium rounded-lg disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommissionSettingsPage() {
  return (
    <Suspense fallback={<SkeletonRows />}>
      <SettingsContent />
    </Suspense>
  );
}
