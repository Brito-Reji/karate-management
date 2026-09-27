'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useInfiniteDojos, useCreateDojo, useUpdateDojo } from '@/hooks/useDojos';
import useDebounce from '@/hooks/useDebounce';
import { useSearchDojos } from '@/hooks/useSearchDojos';
import { useStaffUsers } from '@/hooks/useStaffUsers';
import RowIndexBadge from '@/components/RowIndexBadge';
import type { StaffUser } from '@/queries/staffQueries';

type RegisteredInstructor = { _id: string; name: string };

function namesFromLinkedAndLegacy(
  instructorIds: string[],
  legacyInstructors: string[],
  resolveUser: (id: string) => StaffUser | RegisteredInstructor | undefined
): string[] {
  const linkedNames = instructorIds
    .map((id) => resolveUser(id)?.name?.trim())
    .filter(Boolean) as string[];
  const legacy = legacyInstructors.map((n) => n.trim()).filter(Boolean);
  return [...new Set([...linkedNames, ...legacy])];
}

function legacyNamesFromDojo(
  instructorNames: string[],
  instructorIds: string[],
  registered: RegisteredInstructor[]
): string[] {
  const linkedNameKeys = new Set(
    instructorIds
      .map((id) => registered.find((r) => r._id === id)?.name?.trim().toLowerCase())
      .filter(Boolean)
  );
  const legacy = instructorNames
    .map((n) => n.trim())
    .filter(Boolean)
    .filter((n) => !linkedNameKeys.has(n.toLowerCase()));
  return legacy.length > 0 ? legacy : [''];
}

// skeleton shown during loading
function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
      ))}
    </div>
  );
}

// syncing indicator for background refetch
function StaleIndicator({ isFetching }) {
  if (!isFetching) return null;
  return (
    <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-mono animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
      <span>Syncing latest data…</span>
    </div>
  );
}

// inner component that reads search params — must be inside Suspense
function DojosContent() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get('search') || '';

  const [inputValue, setInputValue] = useState(searchQuery);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingDojo, setEditingDojo]   = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    legacyInstructors: [''],
    instructorIds: [] as string[],
    mainInstructor: '',
  });
  const [formError, setFormError] = useState('');
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(inputValue, 300);
  const isSearchActive = debouncedSearch.trim().length >= 2;

  const {
    data: searchData,
    isLoading: isSearchLoading,
    isError: isSearchError,
    error: searchError,
    isFetching: isSearchFetching,
  } = useSearchDojos(debouncedSearch);

  const {
    data: listData,
    isLoading: isInfiniteLoading,
    isError: isInfiniteError,
    error: infiniteError,
    isFetching: isInfiniteFetching,
    isStale: isInfiniteStale,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteDojos(searchQuery, !isSearchActive);

  const dojos = Array.from(
    new Map(
      (isSearchActive
        ? (searchData?.data ?? [])
        : (listData?.pages.flatMap((page) => page.data) ?? [])
      ).map((dojo) => [dojo._id, dojo])
    ).values()
  );
  const totalDojos = isSearchActive ? searchData?.total : listData?.pages[0]?.total;
  const isLoading = isSearchActive ? isSearchLoading : isInfiniteLoading;
  const isError = isSearchActive ? isSearchError : isInfiniteError;
  const error = isSearchActive ? searchError : infiniteError;
  const isFetching = isSearchActive ? isSearchFetching : isInfiniteFetching;
  const isStale = isSearchActive ? false : isInfiniteStale;

  const createDojo = useCreateDojo();
  const updateDojo = useUpdateDojo();
  const { data: staffUsers = [] } = useStaffUsers(isModalOpen);

  const approvedInstructors = useMemo(
    () =>
      staffUsers.filter(
        (u) =>
          u.role === 'instructor' &&
          !u.isBlocked &&
          (u.approvalStatus === 'approved' || !u.approvalStatus)
      ),
    [staffUsers]
  );

  const [modalRegistered, setModalRegistered] = useState<RegisteredInstructor[]>([]);

  const resolveInstructorUser = useCallback(
    (id: string) =>
      approvedInstructors.find((u) => u._id === id) ??
      modalRegistered.find((r) => r._id === id),
    [approvedInstructors, modalRegistered]
  );

  const mergedInstructorNames = useMemo(
    () =>
      namesFromLinkedAndLegacy(
        formData.instructorIds,
        formData.legacyInstructors,
        resolveInstructorUser
      ),
    [formData.instructorIds, formData.legacyInstructors, resolveInstructorUser]
  );

  const linkedInstructorRows = useMemo(
    () =>
      formData.instructorIds
        .map((id) => resolveInstructorUser(id))
        .filter((u): u is StaffUser | RegisteredInstructor => Boolean(u)),
    [formData.instructorIds, resolveInstructorUser]
  );

  const availableToLink = useMemo(
    () => approvedInstructors.filter((u) => !formData.instructorIds.includes(u._id)),
    [approvedInstructors, formData.instructorIds]
  );

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
    if (!loadMoreRef.current || isSearchActive || !hasNextPage) return;

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
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, isSearchActive]);

  const openCreateModal = () => {
    setEditingDojo(null);
    setModalRegistered([]);
    setFormData({
      name: '',
      location: '',
      legacyInstructors: [''],
      instructorIds: [],
      mainInstructor: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (dojo) => {
    setEditingDojo(dojo);
    const registered: RegisteredInstructor[] = dojo.registeredInstructors ?? [];
    setModalRegistered(registered);
    const parsedInstructors =
      dojo.instructors && dojo.instructors.length > 0
        ? [...dojo.instructors]
        : dojo.instructor
          ? dojo.instructor.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
    const instructorIds = dojo.instructorIds ?? [];
    const legacyInstructors = legacyNamesFromDojo(
      parsedInstructors,
      instructorIds,
      registered
    );

    setFormData({
      name: dojo.name,
      location: dojo.location,
      legacyInstructors,
      instructorIds,
      mainInstructor: dojo.mainInstructor ?? '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location) return;
    setFormError('');

    const cleanedInstructors = namesFromLinkedAndLegacy(
      formData.instructorIds,
      formData.legacyInstructors,
      resolveInstructorUser
    );
    if (cleanedInstructors.length === 0) {
      setFormError('Please add at least one instructor.');
      return;
    }

    const mainInstructor = cleanedInstructors.includes(formData.mainInstructor)
      ? formData.mainInstructor
      : cleanedInstructors.length === 1
        ? cleanedInstructors[0]
        : '';
    if (!mainInstructor) {
      setFormError('Select the main instructor who receives test commission.');
      return;
    }

    const payload = {
      name: formData.name,
      location: formData.location,
      instructors: cleanedInstructors,
      instructorIds: formData.instructorIds,
      mainInstructor,
    };

    if (editingDojo) {
      updateDojo.mutate(
        { id: editingDojo._id, ...payload },
        {
          onSuccess: () => setIsModalOpen(false),
          onError:   (err) => setFormError(err.message),
        }
      );
    } else {
      createDojo.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
        onError:   (err) => setFormError(err.message),
      });
    }
  };

  const isSubmitting = createDojo.isPending || updateDojo.isPending;

  return (
    <div className="h-[calc(100dvh-5rem)] sm:h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-8rem)] min-h-0 flex flex-col gap-6 animate-fadeIn">

      {/* SECTION: UPPER FUNCTIONAL TITLE FRAME */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-xl font-light tracking-tight text-zinc-100">
            Dojo Branches{typeof totalDojos === 'number' ? ` (${totalDojos})` : ''}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage physical instruction facilities and location rosters.</p>
          <div className="mt-1.5">
            <StaleIndicator isFetching={isFetching && !isLoading} />
            {isStale && !isFetching && (
              <span className="text-[10px] text-zinc-600 font-mono">Cached data</span>
            )}
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="h-10 w-full sm:w-auto px-4 bg-zinc-100 hover:bg-white active:scale-[0.98] text-zinc-950 text-xs font-medium rounded-lg transition-all flex items-center justify-center space-x-2 shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7-7H5.5" />
          </svg>
          <span>Add New Dojo</span>
        </button>
      </div>

      {/* SECTION: POWER FILTER SEARCH CONTROLLER INPUT BAR */}
      <div className="shrink-0 w-full max-w-xl relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Filter by name, instructor, or location..."
          className="w-full h-10 pl-10 pr-14 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900/50 transition-all"
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

      {/* SECTION: RESPONSIVE DATA REGISTRY GRID LISTING */}
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
              {dojos.length > 0 ? (
                <>
                  <div className="divide-y divide-white/[0.04]">
                    {dojos.map((dojo, index) => (
                  <div
                    key={dojo._id}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 hover:bg-white/[0.01] transition-colors group ${
                      dojo._id === '__optimistic__' ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <RowIndexBadge index={index} />
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                          <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors break-words">{dojo.name}</h3>
                          <span className="text-[10px] font-mono text-zinc-600 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded shrink-0">
                            {dojo.dojoId ?? '—'}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
                          <span className="text-zinc-400 font-medium break-words">
                            {(() => {
                              const registered = dojo.registeredInstructors ?? [];
                              const registeredNameKeys = new Set(
                                registered.map((r) => r.name.trim().toLowerCase())
                              );
                              const fromStrings =
                                dojo.instructors && dojo.instructors.length > 0
                                  ? dojo.instructors
                                  : dojo.instructor
                                    ? dojo.instructor.split(',').map((s) => s.trim()).filter(Boolean)
                                    : [];
                              const extraLinked = registered
                                .map((r) => r.name.trim())
                                .filter((name) => name && !fromStrings.some(
                                  (n) => n.trim().toLowerCase() === name.toLowerCase()
                                ));
                              const displayNames = [...fromStrings, ...extraLinked];
                              if (displayNames.length === 0) return '—';
                              return displayNames.map((name, nameIndex) => (
                                <span key={`${name}-${nameIndex}`}>
                                  {nameIndex > 0 ? ', ' : ''}
                                  <span className={name === dojo.mainInstructor ? 'text-amber-200' : undefined}>
                                    {name}
                                    {name === dojo.mainInstructor ? ' (Main)' : ''}
                                    {registeredNameKeys.has(name.trim().toLowerCase()) ? (
                                      <span className="text-sky-400/80 text-[10px] ml-0.5">· account</span>
                                    ) : null}
                                  </span>
                                </span>
                              ));
                            })()}
                          </span>
                          <span className="text-zinc-700">•</span>
                          <span className="break-words">{dojo.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 border-t border-white/[0.02] sm:border-t-0 pt-3 sm:pt-0 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-xs font-mono text-zinc-300 font-medium">{dojo.count ?? 0}</span>
                        <span className="text-[10px] text-zinc-600 ml-1">
                          {(dojo.count ?? 0) === 1 ? 'Student' : 'Students'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4">
                        <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border ${
                          dojo.status === 'Active'
                            ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}>
                          {dojo.status ?? 'Active'}
                        </span>

                        <button
                          onClick={() => openEditModal(dojo)}
                          disabled={dojo._id === '__optimistic__'}
                          className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] h-8 sm:h-7 px-3 rounded-md disabled:opacity-40"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                    ))}
                  </div>

                  {!isSearchActive && (
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
                        <p className="text-[11px] text-zinc-600 font-mono">All dojos loaded</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center space-y-2">
                  <p className="text-xs text-zinc-600 font-mono">No active dojo profiles match your search filter criteria.</p>
                  {searchQuery && (
                    <button
                      onClick={() => { setInputValue(''); setParams({ search: null, page: null }); }}
                      className="text-[11px] text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION: UNIFIED DATA MUTATION MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 w-full h-full flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn overflow-y-auto sm:overflow-visible">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />

          <div className="w-full sm:max-w-md bg-zinc-950 border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 sm:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.8)] z-10 relative sm:max-h-[92dvh] sm:overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mb-6">
              <h2 className="text-base font-medium text-zinc-100 tracking-tight">
                {editingDojo ? `Modify Branch Info: ${editingDojo.dojoId}` : 'Create New Dojo Branch'}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {editingDojo
                  ? 'Apply structural modifications to this registry location.'
                  : 'Populate parameters to initialize active infrastructure tracking.'}
              </p>
            </div>

            {formError && (
              <div className="mb-4 text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Dojo Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Coastal Combat Branch"
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Dojo Location Address</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Vytilla Bypass, Kochi"
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-medium text-zinc-400 tracking-wide">Instructors</label>
                  <div className="flex items-center gap-2">
                    {availableToLink.length > 0 && (
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const id = e.target.value;
                          if (!id) return;
                          setFormData({
                            ...formData,
                            instructorIds: [...formData.instructorIds, id],
                          });
                          e.target.value = '';
                        }}
                        className="h-8 max-w-[11rem] px-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-[11px] text-zinc-300 focus:outline-none focus:border-zinc-500"
                      >
                        <option value="">Link account…</option>
                        {availableToLink.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          legacyInstructors: [...formData.legacyInstructors, ''],
                        })
                      }
                      className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors flex items-center space-x-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7-7H5.5" />
                      </svg>
                      <span>Add name</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-600">
                  Linked accounts and any extra names without an account appear in one list.
                </p>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 border border-white/[0.06] rounded-lg p-2">
                  {linkedInstructorRows.length === 0 &&
                  formData.legacyInstructors.every((n) => !n.trim()) ? (
                    <p className="text-xs text-zinc-600 italic px-1 py-2">No instructors yet.</p>
                  ) : null}

                  {linkedInstructorRows.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-sky-950/20 border border-sky-500/10"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{user.name}</p>
                        {'email' in user && user.email ? (
                          <p className="text-[10px] text-zinc-600 truncate">{user.email}</p>
                        ) : (
                          <p className="text-[10px] text-sky-400/80">Registered account</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const removedName = user.name.trim();
                          const nextIds = formData.instructorIds.filter((id) => id !== user._id);
                          const namesAfter = namesFromLinkedAndLegacy(
                            nextIds,
                            formData.legacyInstructors,
                            resolveInstructorUser
                          );
                          const mainInstructor =
                            formData.mainInstructor === removedName && !namesAfter.includes(removedName)
                              ? namesAfter.length === 1
                                ? namesAfter[0]
                                : ''
                              : formData.mainInstructor;
                          setFormData({ ...formData, instructorIds: nextIds, mainInstructor });
                        }}
                        className="h-8 w-8 shrink-0 flex items-center justify-center rounded-md border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/20 transition-all"
                        aria-label={`Remove ${user.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {formData.legacyInstructors.map((inst, index) => (
                    <div key={`legacy-${index}`} className="flex items-center space-x-2 animate-fadeIn">
                      <input
                        type="text"
                        value={inst}
                        onChange={(e) => {
                          const updated = [...formData.legacyInstructors];
                          const previous = updated[index].trim();
                          updated[index] = e.target.value;
                          const mainInstructor =
                            formData.mainInstructor === previous
                              ? e.target.value.trim()
                              : formData.mainInstructor;
                          setFormData({ ...formData, legacyInstructors: updated, mainInstructor });
                        }}
                        placeholder="Name without account"
                        className="flex-1 h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                      />
                      {(formData.legacyInstructors.length > 1 || inst.trim()) && (
                        <button
                          type="button"
                          onClick={() => {
                            const removed = formData.legacyInstructors[index].trim();
                            const updated = formData.legacyInstructors.filter((_, idx) => idx !== index);
                            const legacy =
                              updated.length > 0 ? updated : [''];
                            const namesAfter = namesFromLinkedAndLegacy(
                              formData.instructorIds,
                              legacy,
                              resolveInstructorUser
                            );
                            const mainInstructor =
                              formData.mainInstructor === removed && !namesAfter.includes(removed)
                                ? namesAfter.length === 1
                                  ? namesAfter[0]
                                  : ''
                                : formData.mainInstructor;
                            setFormData({
                              ...formData,
                              legacyInstructors: legacy,
                              mainInstructor,
                            });
                          }}
                          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/20 hover:bg-red-950/20 hover:border-red-500/20 hover:text-red-400 text-zinc-500 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">
                  Main instructor (commission)
                </label>
                <p className="text-[11px] text-zinc-600">
                  Choose one name from this dojo&apos;s instructor list. Test commission goes to that instructor.
                </p>
                <select
                  value={formData.mainInstructor}
                  onChange={(e) => setFormData({ ...formData, mainInstructor: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                >
                  <option value="">Select main instructor</option>
                  {mergedInstructorNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 px-4 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-5 bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving…' : editingDojo ? 'Save Changes' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// page-level export wraps content in Suspense (required for useSearchParams in Next.js 16)
export default function DojosPage() {
  return (
    <Suspense fallback={<SkeletonRows />}>
      <DojosContent />
    </Suspense>
  );
}
