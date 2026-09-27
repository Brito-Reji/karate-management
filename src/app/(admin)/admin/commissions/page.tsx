'use client';

import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import CommissionsSubnav from '@/components/commissions/CommissionsSubnav';
import {
  useAssignTestInstructor,
  useCommissionDashboard,
} from '@/hooks/useCommissions';
import { useAllDojos } from '@/hooks/useBeltHistory';
import { getTodayDateString } from '@/lib/examDayDates';
import { formatInr } from '@/queries/commissionQueries';

function getDefaultMonthRange() {
  const today = getTodayDateString();
  const [year, month] = today.split('-').map(Number);
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
      ))}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
  onClick,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  onClick?: () => void;
  accent?: 'warn';
}) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`text-left p-4 sm:p-5 bg-white/[0.02] border border-white/[0.06] rounded-xl ${
        onClick ? 'hover:bg-white/[0.04] hover:border-white/[0.10] transition-all' : ''
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
      <p
        className={`mt-2 text-2xl sm:text-3xl font-light tabular-nums tracking-tight ${
          accent === 'warn' ? 'text-amber-200' : 'text-zinc-100'
        }`}
      >
        {value}
      </p>
      {sub ? <p className="text-xs text-zinc-500 mt-1">{sub}</p> : null}
    </Wrapper>
  );
}

function CommissionsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listRef = useRef<HTMLDivElement>(null);
  const defaults = getDefaultMonthRange();

  const currentPage = Number(searchParams.get('page')) || 1;
  const fromDate = searchParams.get('from') || defaults.from;
  const toDate = searchParams.get('to') || defaults.to;
  const allDates = searchParams.get('all') === '1';
  const selectedDojoId = searchParams.get('dojoId') || '';
  const selectedInstructorId = searchParams.get('instructorId') || '';
  const selectedStatus = (searchParams.get('status') as 'Pass' | 'Fail' | null) || '';
  const assignment =
    searchParams.get('assignment') === 'unassigned' ||
    searchParams.get('assignment') === 'assigned'
      ? (searchParams.get('assignment') as 'unassigned' | 'assigned')
      : 'all';
  const sort = searchParams.get('sort') || 'awardedDate';
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
  const LIMIT = 50;

  const { data: dojos = [] } = useAllDojos();
  const assignMutation = useAssignTestInstructor();

  const { data, isLoading, isFetching } = useCommissionDashboard(currentPage, LIMIT, {
    from: allDates ? undefined : fromDate,
    to: allDates ? undefined : toDate,
    all: allDates,
    dojoId: selectedDojoId,
    instructorId: selectedInstructorId,
    status: selectedStatus,
    assignment,
    sort,
    order,
  });

  const summary = data?.summary;
  const entries = data?.entries ?? [];
  const byInstructor = data?.byInstructor ?? [];
  const totalPages = data?.totalPages ?? 1;

  const [assignModal, setAssignModal] = useState<{
    testId: string;
    studentName: string;
    dojoId: string | null;
  } | null>(null);
  const [selectedAssignInstructor, setSelectedAssignInstructor] = useState('');
  const [assignError, setAssignError] = useState('');

  const instructorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const dojo of dojos) {
      for (const inst of dojo.registeredInstructors ?? []) {
        map.set(inst._id, inst.name);
      }
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dojos]);

  const assignCandidates = useMemo(() => {
    if (!assignModal?.dojoId) return [];
    const dojo = dojos.find(
      (d) => d.dojoId === assignModal.dojoId || d._id === assignModal.dojoId
    );
    return dojo?.registeredInstructors ?? [];
  }, [assignModal, dojos]);

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      router.push(`${pathname}?${params.toString()}`);
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [searchParams, router, pathname]
  );

  const setPage = useCallback(
    (page: number) => {
      setParams({ page: page <= 1 ? null : String(page) });
    },
    [setParams]
  );

  const toggleSort = (field: string) => {
    if (sort === field) {
      setParams({ sort: field, order: order === 'asc' ? 'desc' : 'asc', page: null });
    } else {
      setParams({ sort: field, order: 'desc', page: null });
    }
  };

  const handleAssign = () => {
    if (!assignModal || !selectedAssignInstructor) return;
    setAssignError('');
    assignMutation.mutate(
      { testId: assignModal.testId, instructorId: selectedAssignInstructor },
      {
        onSuccess: () => {
          setAssignModal(null);
          setSelectedAssignInstructor('');
        },
        onError: (err) => setAssignError(err.message),
      }
    );
  };

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      <div className="flex flex-col gap-4 border-b border-white/[0.04] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-light tracking-tight text-zinc-100">Commissions</h1>
            <p className="text-xs text-zinc-500 mt-1">
              Test fees, instructor commission, and academy profit for every belt test.
            </p>
          </div>
          <Link
            href="/admin/commissions/settings"
            className="h-10 w-full sm:w-auto px-4 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition-all flex items-center justify-center shrink-0"
          >
            Fee settings
          </Link>
        </div>
        <CommissionsSubnav />
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">From</span>
            <input
              type="date"
              value={allDates ? '' : fromDate}
              disabled={allDates}
              onChange={(e) => setParams({ from: e.target.value, page: null, all: null })}
              className="w-full h-10 px-3 bg-zinc-900/50 border border-white/[0.06] rounded-lg text-sm text-zinc-200 disabled:opacity-40"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">To</span>
            <input
              type="date"
              value={allDates ? '' : toDate}
              disabled={allDates}
              onChange={(e) => setParams({ to: e.target.value, page: null, all: null })}
              className="w-full h-10 px-3 bg-zinc-900/50 border border-white/[0.06] rounded-lg text-sm text-zinc-200 disabled:opacity-40"
            />
          </label>
          <label className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Dojo</span>
            <select
              value={selectedDojoId}
              onChange={(e) => setParams({ dojoId: e.target.value || null, page: null })}
              className="w-full h-10 px-3 bg-zinc-900/50 border border-white/[0.06] rounded-lg text-sm text-zinc-200"
            >
              <option value="">All dojos</option>
              {dojos.map((d) => (
                <option key={d._id} value={d.dojoId || d._id}>
                  {d.name} — {d.location}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Instructor</span>
            <select
              value={selectedInstructorId}
              disabled={assignment === 'unassigned'}
              onChange={(e) =>
                setParams({ instructorId: e.target.value || null, page: null })
              }
              className="w-full h-10 px-3 bg-zinc-900/50 border border-white/[0.06] rounded-lg text-sm text-zinc-200 disabled:opacity-40"
            >
              <option value="">All instructors</option>
              {instructorOptions.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['', 'Pass', 'Fail'] as const).map((s) => (
            <button
              key={s || 'all-status'}
              type="button"
              onClick={() => setParams({ status: s || null, page: null })}
              className={`px-3 py-1.5 rounded-lg text-xs border ${
                selectedStatus === s
                  ? 'bg-white/[0.06] border-white/[0.10] text-zinc-100'
                  : 'bg-white/[0.02] border-white/[0.06] text-zinc-500'
              }`}
            >
              {s || 'All outcomes'}
            </button>
          ))}
          {(
            [
              ['all', 'All tests'],
              ['assigned', 'Assigned'],
              ['unassigned', 'Needs instructor'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setParams({
                  assignment: value === 'all' ? null : value,
                  instructorId: value === 'unassigned' ? null : selectedInstructorId || null,
                  page: null,
                })
              }
              className={`px-3 py-1.5 rounded-lg text-xs border ${
                assignment === value
                  ? 'bg-white/[0.06] border-white/[0.10] text-zinc-100'
                  : 'bg-white/[0.02] border-white/[0.06] text-zinc-500'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setParams({ all: allDates ? null : '1', page: null })}
            className={`px-3 py-1.5 rounded-lg text-xs border ${
              allDates
                ? 'bg-white/[0.06] border-white/[0.10] text-zinc-100'
                : 'bg-white/[0.02] border-white/[0.06] text-zinc-500'
            }`}
          >
            All dates
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <SummaryCard label="Tests conducted" value={summary?.tests ?? 0} />
          <SummaryCard label="Total fees" value={formatInr(summary?.fees ?? 0)} sub="Assigned instructors only" />
          <SummaryCard
            label="Commission owed"
            value={formatInr(summary?.commission ?? 0)}
            sub="Fixed per test"
          />
          <SummaryCard
            label="Academy profit"
            value={
              <span className={(summary?.profit ?? 0) < 0 ? 'text-red-400' : undefined}>
                {formatInr(summary?.profit ?? 0)}
              </span>
            }
          />
          <SummaryCard
            label="Needs instructor"
            value={summary?.unassigned.tests ?? 0}
            sub={
              summary?.unassigned.tests
                ? `${formatInr(summary.unassigned.commission)} commission pending assignment`
                : 'All tests assigned'
            }
            accent="warn"
            onClick={() =>
              setParams({ assignment: 'unassigned', instructorId: null, page: null })
            }
          />
        </div>
      )}

      {(summary?.missingFeeSetting ?? 0) > 0 && (
        <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          {summary?.missingFeeSetting} test(s) use belts with no fee configured — rupee totals exclude them.{' '}
          <Link href="/admin/commissions/settings" className="underline">
            Configure fees
          </Link>
        </p>
      )}

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-medium text-zinc-200">By instructor</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Commission owed in the filtered range</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-white/[0.06]">
                <th className="px-4 py-3 font-medium">Instructor</th>
                <th className="px-4 py-3 font-medium">Dojo</th>
                <th className="px-4 py-3 font-medium">Tests</th>
                <th className="px-4 py-3 font-medium">Commission</th>
              </tr>
            </thead>
            <tbody>
              {byInstructor.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 text-xs">
                    No assigned instructor data for this filter.
                  </td>
                </tr>
              ) : (
                byInstructor.map((row) => (
                  <tr key={`${row.instructorId}:${row.dojoId}`} className="border-b border-white/[0.04]">
                    <td className="px-4 py-3 text-zinc-200">{row.instructorName || '—'}</td>
                    <td className="px-4 py-3 text-zinc-400">{row.dojoName || row.dojoId || '—'}</td>
                    <td className="px-4 py-3 text-zinc-300 tabular-nums">{row.tests}</td>
                    <td className="px-4 py-3 text-zinc-200 tabular-nums">{formatInr(row.commission)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div
        ref={listRef}
        className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
      >
        <div className="px-4 sm:px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium text-zinc-200">Line items</h2>
            {isFetching && !isLoading ? (
              <p className="text-[10px] text-zinc-500 mt-0.5 animate-pulse">Updating…</p>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="p-4">
            <SkeletonRows />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[720px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-white/[0.06]">
                    <th className="px-4 py-3 font-medium">
                      <button type="button" onClick={() => toggleSort('studentName')}>
                        Student
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">Belt</th>
                    <th className="px-4 py-3 font-medium">Dojo</th>
                    <th className="px-4 py-3 font-medium">Instructor</th>
                    <th className="px-4 py-3 font-medium">
                      <button type="button" onClick={() => toggleSort('awardedDate')}>
                        Date
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <button type="button" onClick={() => toggleSort('fee')}>
                        Fee
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <button type="button" onClick={() => toggleSort('commission')}>
                        Commission
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium">
                      <button type="button" onClick={() => toggleSort('profit')}>
                        Profit
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-zinc-500 text-xs">
                        No tests match this filter.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => (
                      <tr key={entry._id} className="border-b border-white/[0.04]">
                        <td className="px-4 py-3">
                          <div className="text-zinc-200">{entry.student?.name ?? '—'}</div>
                          <div className="text-[10px] text-zinc-500">{entry.student?.studentId}</div>
                        </td>
                        <td className="px-4 py-3 text-zinc-300">
                          {entry.beltName}
                          <span className="text-zinc-600 text-xs ml-1">({entry.status})</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-xs">{entry.dojoName ?? '—'}</td>
                        <td className="px-4 py-3 text-zinc-300 text-xs">
                          {entry.instructorName ?? (
                            <span className="text-amber-200/90">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                          {new Date(entry.awardedDate).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-zinc-200">
                          {entry.feeConfigured ? formatInr(entry.fee) : '—'}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-zinc-200">
                          {entry.feeConfigured ? formatInr(entry.commission) : '—'}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {entry.feeConfigured ? (
                            <span className={(entry.profit ?? 0) < 0 ? 'text-red-400' : 'text-zinc-200'}>
                              {formatInr(entry.profit)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!entry.instructorId ? (
                            <button
                              type="button"
                              onClick={() => {
                                setAssignError('');
                                setSelectedAssignInstructor('');
                                setAssignModal({
                                  testId: entry._id,
                                  studentName: entry.student?.name ?? 'Student',
                                  dojoId: entry.dojoId,
                                });
                              }}
                              className="text-xs text-zinc-300 hover:text-white underline"
                            >
                              Assign
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="text-xs text-zinc-400 disabled:opacity-30"
                >
                  Previous
                </button>
                <span className="text-xs text-zinc-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="text-xs text-zinc-400 disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md bg-zinc-950 border border-white/[0.08] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-medium text-zinc-100">Assign instructor</h3>
            <p className="text-xs text-zinc-500">
              Test for {assignModal.studentName}. Choose from this student&apos;s dojo instructors.
            </p>
            {assignCandidates.length === 0 ? (
              <p className="text-xs text-amber-200">No registered instructors on this dojo.</p>
            ) : (
              <select
                value={selectedAssignInstructor}
                onChange={(e) => setSelectedAssignInstructor(e.target.value)}
                className="w-full h-10 px-3 bg-zinc-900 border border-white/[0.06] rounded-lg text-sm text-zinc-200"
              >
                <option value="">Select instructor</option>
                {assignCandidates.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name}
                  </option>
                ))}
              </select>
            )}
            {assignError ? <p className="text-xs text-red-400">{assignError}</p> : null}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAssignModal(null)}
                className="px-4 h-9 text-xs text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedAssignInstructor || assignMutation.isPending}
                onClick={handleAssign}
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

export default function CommissionsPage() {
  return (
    <Suspense fallback={<SkeletonRows />}>
      <CommissionsContent />
    </Suspense>
  );
}
