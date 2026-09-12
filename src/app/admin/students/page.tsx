'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useInfiniteStudents, useDeleteStudent, useActivateStudent } from '@/hooks/useStudents';
import { useAllDojos } from '@/hooks/useBeltHistory';
import { useStaffUsers } from '@/hooks/useStaffUsers';
import { meQuery } from '@/queries/authQueries';
import useDebounce from '@/hooks/useDebounce';
import { BELTS } from '@/lib/constants';
import RowIndexBadge from '@/components/RowIndexBadge';
import AddStudentModal from '@/components/AddStudentModal';

function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
      ))}
    </div>
  );
}

function StaleIndicator({ isFetching }) {
  if (!isFetching) return null;
  return (
    <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-mono animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
      <span>Syncing latest data…</span>
    </div>
  );
}

// belt color dot
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

function StudentsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get('search') || '';
  const selectedBelt = searchParams.get('belt') || '';
  const selectedDojoId = searchParams.get('dojoId') || '';
  const selectedInstructor = searchParams.get('instructor') || '';
  const selectedCreatedBy = searchParams.get('createdBy') || '';

  const { data: currentUser } = useQuery(meQuery);
  const isAdmin = currentUser?.role === 'admin';
  const { data: staffUsers = [] } = useStaffUsers(isAdmin);

  const [inputValue, setInputValue] = useState(searchQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(inputValue, 300);

  const {
    data: listData,
    isLoading,
    isError,
    error,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteStudents(debouncedSearch, {
    belt: selectedBelt,
    dojoId: selectedDojoId,
    ...(selectedInstructor ? { instructor: selectedInstructor } : {}),
    ...(isAdmin && selectedCreatedBy ? { createdBy: selectedCreatedBy } : {}),
  });

  const { data: dojos = [] } = useAllDojos();

  const students = Array.from(
    new Map(
      (listData?.pages.flatMap((page) => page.students) ?? []).map((student) => [
        student._id,
        student,
      ])
    ).values()
  );
  const totalStudents = listData?.pages[0]?.total;

  const deleteStudent = useDeleteStudent();
  const activateStudent = useActivateStudent();

  const setParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      setParams({ search: debouncedSearch || null });
    }
  }, [debouncedSearch, searchQuery, setParams]);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '240px' }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // get dojo place address from id
  const dojoName = (dojoId: string) => {
    const d = dojos.find((dj) => dj._id === dojoId);
    return d ? d.location || d.name || '—' : '—';
  };

  const staffNameById = useMemo(
    () => new Map(staffUsers.map((u) => [u._id, u.name])),
    [staffUsers]
  );

  const creatorName = (createdBy?: string) => {
    if (!createdBy) return '—';
    return staffNameById.get(createdBy) || 'Unknown';
  };

  const instructorOptions = useMemo(() => {
    const names = new Set<string>();
    for (const dojo of dojos) {
      if (dojo.instructors && dojo.instructors.length > 0) {
        dojo.instructors.forEach((name) => names.add(name));
      } else if (dojo.instructor) {
        names.add(dojo.instructor);
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [dojos]);

  const openCreateModal = () => setIsModalOpen(true);

  return (
    <div className="h-[calc(100dvh-5rem)] sm:h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-8rem)] min-h-0 flex flex-col gap-6 animate-fadeIn">

      {/* header */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-xl font-light tracking-tight text-zinc-100">
            Students{typeof totalStudents === 'number' ? ` (${totalStudents})` : ''}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage enrolled student records and belt assignments.</p>
          <div className="mt-1.5">
            <StaleIndicator isFetching={isFetching && !isLoading} />
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="h-10 w-full sm:w-auto px-4 bg-zinc-100 hover:bg-white active:scale-[0.98] text-zinc-950 text-xs font-medium rounded-lg transition-all flex items-center justify-center space-x-2 shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7-7H5.5" />
          </svg>
          <span>Add Student</span>
        </button>
      </div>

      {/* search and filters */}
      <div className="shrink-0 flex flex-col gap-3">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search by name, ID, or phone..."
            className="w-full h-10 pl-10 pr-12 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900/50 transition-all"
          />
          {inputValue && (
            <button
              onClick={() => { setInputValue(''); setParams({ search: null, page: null }); }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-600 hover:text-zinc-400 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-row gap-3">
          {/* dojo filter */}
          <div className="relative w-full md:w-48 min-w-0">
            <select
              value={selectedDojoId}
              onChange={(e) => setParams({ dojoId: e.target.value || null })}
              className="w-full h-10 px-3.5 pr-8 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all appearance-none"
            >
              <option value="" className="bg-zinc-950">All Dojos</option>
              {dojos.map((dojo) => (
                <option key={dojo._id} value={dojo._id} className="bg-zinc-950">
                  {dojo.location || dojo.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>

          {/* belt filter */}
          <div className="relative w-full md:w-48 min-w-0">
            <select
              value={selectedBelt}
              onChange={(e) => setParams({ belt: e.target.value || null })}
              className="w-full h-10 px-3.5 pr-8 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all appearance-none"
            >
              <option value="" className="bg-zinc-950">All Belts</option>
              {BELTS.map((b) => (
                <option key={b.name} value={b.name} className="bg-zinc-950">
                  {b.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>

          {/* instructor filter (from dojo list) */}
          <div className="relative w-full md:w-48 min-w-0">
            <select
              value={selectedInstructor}
              onChange={(e) => setParams({ instructor: e.target.value || null })}
              className="w-full h-10 px-3.5 pr-8 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all appearance-none"
            >
              <option value="" className="bg-zinc-950">All Instructors</option>
              {instructorOptions.map((name) => (
                <option key={name} value={name} className="bg-zinc-950">
                  {name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>

          {/* added by filter (admin only) */}
          {isAdmin && (
            <div className="relative w-full md:w-48 min-w-0">
              <select
                value={selectedCreatedBy}
                onChange={(e) => setParams({ createdBy: e.target.value || null })}
                className="w-full h-10 px-3.5 pr-8 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all appearance-none"
              >
                <option value="" className="bg-zinc-950">All Staff</option>
                {staffUsers.map((user) => (
                  <option key={user._id} value={user._id} className="bg-zinc-950">
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
            </div>
          )}

          {(inputValue || selectedDojoId || selectedBelt || selectedInstructor || selectedCreatedBy) && (
            <button
              onClick={() => {
                setInputValue('');
                setParams({
                  search: null,
                  dojoId: null,
                  belt: null,
                  instructor: null,
                  createdBy: null,
                });
              }}
              className="col-span-2 sm:col-span-1 h-10 px-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] active:scale-[0.98] text-xs text-zinc-400 hover:text-white transition-all flex items-center justify-center"
            >
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* student list */}
      <div className="flex-1 min-h-0">
        {isLoading ? (
          <SkeletonRows />
        ) : isError ? (
          <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-4 py-3">
            {error.message}
          </div>
        ) : (
          <div className={`h-full bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden shadow-xl transition-opacity duration-200 ${
            isFetching ? 'opacity-60' : 'opacity-100'
          }`}>
            <div className="h-full overflow-y-auto overscroll-contain">
              {students.length > 0 ? (
                <>
                  <div className="divide-y divide-white/[0.04]">
                    {students.map((student, index) => (
                      <div
                        key={student._id}
                        className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 hover:bg-white/[0.01] transition-colors group ${
                          student._id === '__optimistic__' ? 'opacity-50' : ''
                        }`}
                      >
                        {student._id === '__optimistic__' ? (
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <RowIndexBadge index={index} />
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                                <h3 className="text-sm font-medium text-zinc-200 break-words">{student.name}</h3>
                                <span className="text-[10px] font-mono text-zinc-600 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded shrink-0">
                                  {student.studentId ?? '—'}
                                </span>
                              </div>
                              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
                                <BeltDot belt={student.belt || 'White'} />
                                <span className="text-zinc-400 font-medium">{student.belt || 'White'}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link
                            href={`/admin/students/${student._id}`}
                            className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer"
                          >
                            <RowIndexBadge index={index} />
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                                <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors break-words">{student.name}</h3>
                                <span className="text-[10px] font-mono text-zinc-600 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded shrink-0">
                                  {student.studentId ?? '—'}
                                </span>
                              </div>
                              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
                                <BeltDot belt={student.belt || 'White'} />
                                <span className="text-zinc-400 font-medium">{student.belt || 'White'}</span>
                                <span className="text-zinc-700">•</span>
                                <span className="break-words">{dojoName(student.dojoId || '')}</span>
                                {student.phoneNumber && (
                                  <>
                                    <span className="text-zinc-700">•</span>
                                    <span className="font-mono">{student.phoneNumber}</span>
                                  </>
                                )}
                                {isAdmin && (
                                  <>
                                    <span className="text-zinc-700">•</span>
                                    <span>Added by {creatorName(student.createdBy)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </Link>
                        )}

                        <div
                          className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 border-t border-white/[0.02] sm:border-t-0 pt-3 sm:pt-0 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border ${
                            student.status === 'Active'
                              ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}>
                            {student.status ?? 'Active'}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/admin/students/${student._id}?edit=1`)}
                              disabled={student._id === '__optimistic__'}
                              className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] h-8 sm:h-7 px-3 rounded-md disabled:opacity-40"
                            >
                              Edit
                            </button>
                            {student.status === 'Active' ? (
                              <button
                                onClick={() => {
                                  if (confirm('Deactivate this student?')) deleteStudent.mutate(student._id);
                                }}
                                disabled={student._id === '__optimistic__'}
                                className="text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors bg-white/[0.02] border border-white/[0.06] hover:bg-red-950/10 hover:border-red-500/20 h-8 sm:h-7 px-3 rounded-md disabled:opacity-40"
                              >
                                <span className="sm:hidden">Off</span>
                                <span className="hidden sm:inline">Deactivate</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (confirm('Activate this student?')) activateStudent.mutate(student._id);
                                }}
                                disabled={student._id === '__optimistic__'}
                                className="text-xs font-medium text-zinc-500 hover:text-emerald-400 transition-colors bg-white/[0.02] border border-white/[0.06] hover:bg-emerald-950/10 hover:border-emerald-500/20 h-8 sm:h-7 px-3 rounded-md disabled:opacity-40"
                              >
                                <span className="sm:hidden">On</span>
                                <span className="hidden sm:inline">Activate</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div ref={loadMoreRef} className="flex justify-center px-1 py-4">
                    {hasNextPage ? (
                      <button
                        type="button"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="h-9 px-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-50 text-xs text-zinc-400 hover:text-white transition-all"
                      >
                        {isFetchingNextPage ? 'Loading more…' : 'Load more'}
                      </button>
                    ) : (
                      <p className="text-[11px] text-zinc-600 font-mono">All students loaded</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center space-y-2">
                  <p className="text-xs text-zinc-600 font-mono">No students found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AddStudentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dojos={dojos}
      />
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<SkeletonRows />}>
      <StudentsContent />
    </Suspense>
  );
}
