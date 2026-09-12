'use client';

import React, { Suspense, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAllDojos, useExamDay } from '@/hooks/useBeltHistory';
import { BELTS } from '@/lib/constants';
import {
  formatExamDayChip,
  formatExamDayLabel,
  getTodayDateString,
  shiftDateString,
} from '@/lib/examDayDates';

function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
      ))}
    </div>
  );
}

function BeltDot({ belt }: { belt: string }) {
  const info = BELTS.find((b) => b.name === belt);
  if (!info) return null;
  return (
    <span
      className="inline-block w-3 h-3 rounded-full border border-white/10 shrink-0"
      style={{ backgroundColor: info.color }}
      title={belt}
    />
  );
}

function BeltProgressionLabel({
  fromBelt,
  beltName,
  status,
}: {
  fromBelt?: string;
  beltName: string;
  status?: 'Pass' | 'Fail';
}) {
  const from = fromBelt || 'White';
  const isFail = status === 'Fail';

  if (isFail) {
    return (
      <span className="inline-flex items-center flex-wrap gap-x-1.5 gap-y-1 text-sm font-medium text-zinc-200">
        <BeltDot belt={from} />
        <span>{from}</span>
        <span className="text-zinc-600 font-normal">· attempted</span>
        <BeltDot belt={beltName} />
        <span>{beltName}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center flex-wrap gap-x-1.5 gap-y-1 text-sm font-medium text-zinc-200">
      <BeltDot belt={from} />
      <span>{from}</span>
      <span className="text-zinc-600 font-normal">→</span>
      <BeltDot belt={beltName} />
      <span>{beltName}</span>
    </span>
  );
}

function ExamDayContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;
  const selectedDate = searchParams.get('date') || getTodayDateString();
  const selectedStatus = (searchParams.get('status') as 'Pass' | 'Fail' | null) || '';
  const EXAM_DAY_LIMIT = 50;
  const todayDate = getTodayDateString();
  const isToday = selectedDate === todayDate;
  const listRef = useRef<HTMLDivElement>(null);

  const { data: dojos = [] } = useAllDojos();
  const {
    data: examDayData,
    isLoading,
    isFetching,
  } = useExamDay(currentPage, EXAM_DAY_LIMIT, {
    date: selectedDate,
    status: selectedStatus,
  });

  const entries = examDayData?.history ?? [];
  const totalPages = examDayData?.totalPages ?? 1;
  const dayStats = examDayData?.stats ?? { total: 0, pass: 0, fail: 0 };
  const examDates = examDayData?.examDates ?? [];

  const dojoName = (dojoId: string) => {
    const d = dojos.find((dj) => dj._id === dojoId);
    return d ? d.name : '—';
  };

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

  const setDashboardDate = useCallback(
    (date: string) => {
      setParams({ date, page: null, status: selectedStatus || null });
    },
    [setParams, selectedStatus]
  );

  const setStatusFilter = useCallback(
    (status: '' | 'Pass' | 'Fail') => {
      setParams({ status: status || null, page: null });
    },
    [setParams]
  );

  const setPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page <= 1) params.delete('page');
      else params.set('page', String(page));
      router.push(`${pathname}?${params.toString()}`);
      listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [searchParams, router, pathname]
  );

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-xl font-light tracking-tight text-zinc-100">Exam Day</h1>
          <p className="text-xs text-zinc-500 mt-1">
            View all belt tests on a selected date with pass and fail totals.
          </p>
        </div>
        <Link
          href="/admin/tests"
          className="h-10 w-full sm:w-auto px-4 bg-zinc-100 hover:bg-white active:scale-[0.98] text-zinc-950 text-xs font-medium rounded-lg transition-all flex items-center justify-center shrink-0"
        >
          Record a test
        </Link>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-medium text-zinc-200">
              {isToday ? "Today's Tests" : 'Selected Day'}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 break-words">
              {formatExamDayLabel(selectedDate)}
              {typeof dayStats.total === 'number' ? (
                <span className="text-zinc-600">
                  {' '}
                  · {dayStats.total} test{dayStats.total === 1 ? '' : 's'}
                </span>
              ) : null}
            </p>
          </div>
          {isFetching && !isLoading && (
            <span className="text-[10px] text-zinc-500 font-mono animate-pulse shrink-0">
              Syncing…
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setDashboardDate(shiftDateString(selectedDate, -1))}
              className="h-10 w-10 shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 transition-all flex items-center justify-center"
              aria-label="Previous day"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setDashboardDate(e.target.value)}
              className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
            />
            <button
              type="button"
              onClick={() => setDashboardDate(shiftDateString(selectedDate, 1))}
              className="h-10 w-10 shrink-0 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-zinc-400 hover:text-zinc-200 transition-all flex items-center justify-center"
              aria-label="Next day"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {!isToday && (
            <button
              type="button"
              onClick={() => setDashboardDate(todayDate)}
              className="h-10 px-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] text-xs font-medium text-zinc-300 hover:text-white transition-all w-full sm:w-auto"
            >
              Today
            </button>
          )}
        </div>

        {examDates.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 px-0.5">
              Dates with exams
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
              {examDates.map((date) => {
                const isSelected = date === selectedDate;
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => setDashboardDate(date)}
                    className={`h-10 shrink-0 px-3.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-white/[0.06] border-white/[0.12] text-zinc-100'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    {formatExamDayChip(date)}
                    {date === todayDate ? ' · Today' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('')}
          className={`rounded-xl border p-3 sm:p-4 text-left transition-all active:scale-[0.99] ${
            selectedStatus === ''
              ? 'bg-white/[0.04] border-white/[0.12]'
              : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.03]'
          }`}
        >
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Total</p>
          <p className="text-xl sm:text-2xl font-light text-zinc-100 mt-1">{dayStats.total}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('Pass')}
          className={`rounded-xl border p-3 sm:p-4 text-left transition-all active:scale-[0.99] ${
            selectedStatus === 'Pass'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-white/[0.02] border-white/[0.06] hover:bg-emerald-500/5'
          }`}
        >
          <p className="text-[10px] uppercase tracking-wider text-emerald-500/80">Passed</p>
          <p className="text-xl sm:text-2xl font-light text-emerald-400 mt-1">{dayStats.pass}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('Fail')}
          className={`rounded-xl border p-3 sm:p-4 text-left transition-all active:scale-[0.99] ${
            selectedStatus === 'Fail'
              ? 'bg-rose-500/10 border-rose-500/30'
              : 'bg-white/[0.02] border-white/[0.06] hover:bg-rose-500/5'
          }`}
        >
          <p className="text-[10px] uppercase tracking-wider text-rose-500/80">Failed</p>
          <p className="text-xl sm:text-2xl font-light text-rose-400 mt-1">{dayStats.fail}</p>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 px-1">
        {([
          { value: '', label: 'All' },
          { value: 'Pass', label: 'Pass' },
          { value: 'Fail', label: 'Fail' },
        ] as const).map((chip) => (
          <button
            key={chip.value || 'all'}
            type="button"
            onClick={() => setStatusFilter(chip.value)}
            className={`h-10 px-4 rounded-full text-xs font-medium border transition-all ${
              selectedStatus === chip.value
                ? chip.value === 'Pass'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : chip.value === 'Fail'
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                  : 'bg-white/[0.06] border-white/[0.12] text-zinc-100'
                : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : (
        <div
          className={`bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden shadow-xl transition-opacity duration-200 ${
            isFetching ? 'opacity-60' : 'opacity-100'
          }`}
        >
          {entries.length > 0 ? (
            <div
              ref={listRef}
              className="divide-y divide-white/[0.04] sm:max-h-[min(32rem,60vh)] sm:overflow-y-auto sm:overscroll-contain sm:scroll-smooth"
            >
              {entries.map((entry) => {
                const isFail = entry.status === 'Fail';
                const testType = isFail ? 'Belt Test' : 'Promotion';

                return (
                  <div
                    key={entry._id}
                    className="p-4 sm:p-5 hover:bg-white/[0.01] transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                        <h3 className="text-sm font-medium text-zinc-200 break-words">
                          {entry.student?.name || 'Unknown student'}
                        </h3>
                        {entry.student?.studentId && (
                          <span className="text-[10px] font-mono text-zinc-600 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded shrink-0">
                            {entry.student.studentId}
                          </span>
                        )}
                      </div>

                      {entry.student?.dojoId && (
                        <p className="text-xs text-zinc-500 break-words">
                          {dojoName(entry.student.dojoId)}
                        </p>
                      )}

                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                        <BeltProgressionLabel
                          fromBelt={entry.fromBelt}
                          beltName={entry.beltName}
                          status={entry.status}
                        />
                        <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border bg-zinc-900 border-zinc-800 text-zinc-400">
                          {testType}
                        </span>
                        {isFail ? (
                          <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border bg-rose-950/20 border-rose-500/20 text-rose-400">
                            Fail
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border bg-emerald-950/20 border-emerald-500/20 text-emerald-400">
                            Pass
                          </span>
                        )}
                      </div>

                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
                        {entry.rank != null && <span>Rank {entry.rank}</span>}
                        {entry.examiner && (
                          <>
                            {entry.rank != null && <span className="text-zinc-700">•</span>}
                            <span>Examiner: {entry.examiner}</span>
                          </>
                        )}
                      </div>

                      {entry.notes && (
                        <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center space-y-2">
              <p className="text-xs text-zinc-600 font-mono">No tests recorded on this date.</p>
              <p className="text-xs text-zinc-500">
                Pick another day from the chips above or record a test.
              </p>
            </div>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 pt-2">
          <p className="text-[11px] text-zinc-600 font-mono">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1 || isFetching}
              className="px-3 h-10 rounded border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] disabled:opacity-20 disabled:hover:bg-transparent text-xs text-zinc-400 hover:text-white transition-all"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages || isFetching}
              className="px-3 h-10 rounded border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] disabled:opacity-20 disabled:hover:bg-transparent text-xs text-zinc-400 hover:text-white transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamDayPage() {
  return (
    <Suspense fallback={<SkeletonRows />}>
      <ExamDayContent />
    </Suspense>
  );
}
