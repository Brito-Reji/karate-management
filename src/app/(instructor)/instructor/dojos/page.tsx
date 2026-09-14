'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useInfiniteDojos } from '@/hooks/useDojos';
import useDebounce from '@/hooks/useDebounce';
import { useSearchDojos } from '@/hooks/useSearchDojos';
import { usePortalPath } from '@/hooks/usePortalRouting';
import { submitChangeRequest, fetchChangeRequests } from '@/queries/changeRequestQueries';
import type { Dojo } from '@/queries/dojoQueries';

type PendingRequest = {
  _id: string;
  type: string;
  targetDojoId?: string;
};

type PublicDojo = {
  _id: string;
  dojoId: string;
  name: string;
  location: string;
};

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-36 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
      ))}
    </div>
  );
}

function StaleIndicator({ isFetching }: { isFetching: boolean }) {
  if (!isFetching) return null;
  return (
    <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-mono animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
      <span>Syncing latest data…</span>
    </div>
  );
}

function DojoCard({
  dojo,
  pendingTypes,
  onViewStudents,
  onProposeEdit,
}: {
  dojo: Dojo;
  pendingTypes: string[];
  onViewStudents: () => void;
  onProposeEdit: () => void;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden shadow-xl flex flex-col p-4 gap-3">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-zinc-100 break-words">{dojo.name}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {pendingTypes.length > 0 && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-300">
                Pending
              </span>
            )}
            <span className="text-[10px] font-mono text-zinc-600 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded">
              {dojo.dojoId ?? '—'}
            </span>
          </div>
        </div>
        <p className="text-xs text-zinc-500 break-words">{dojo.location}</p>
      </div>

      <div className="text-xs text-zinc-400">
        <span className="font-mono text-zinc-200">{dojo.count ?? 0}</span>{' '}
        {(dojo.count ?? 0) === 1 ? 'student' : 'students'}
      </div>

      <div className="flex flex-wrap gap-2 mt-auto pt-1">
          <button
            type="button"
            onClick={onViewStudents}
            className="h-8 px-3 text-xs font-medium rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-all"
          >
            Manage students
          </button>
          <button
            type="button"
            onClick={onProposeEdit}
            className="h-8 px-3 text-xs font-medium rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300 transition-all"
          >
            Propose changes
          </button>
        </div>
    </div>
  );
}

function InstructorDojosContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const studentsPath = usePortalPath('instructor', '/students');

  const searchQuery = searchParams.get('search') || '';
  const [inputValue, setInputValue] = useState(searchQuery);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [allDojos, setAllDojos] = useState<PublicDojo[]>([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinSearch, setJoinSearch] = useState('');
  const [editingDojo, setEditingDojo] = useState<Dojo | null>(null);
  const [editForm, setEditForm] = useState({ name: '', location: '' });
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const assignedIds = new Set(dojos.map((d) => d._id));

  const loadPending = useCallback(async () => {
    try {
      const requests = await fetchChangeRequests();
      setPendingRequests(requests);
    } catch {
      setPendingRequests([]);
    }
  }, []);

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  useEffect(() => {
    if (!showJoinModal) return;
    const loadAll = async () => {
      try {
        const res = await fetch('/api/dojos');
        const data = await res.json();
        setAllDojos(Array.isArray(data) ? data : []);
      } catch {
        setAllDojos([]);
      }
    };
    void loadAll();
  }, [showJoinModal]);

  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname]
  );

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

  const getPendingForDojo = (dojoId: string) =>
    pendingRequests
      .filter((r) => String(r.targetDojoId) === dojoId)
      .map((r) => r.type);

  const openEditModal = (dojo: Dojo) => {
    setEditingDojo(dojo);
    setEditForm({ name: dojo.name, location: dojo.location });
    setModalError('');
    setModalSuccess('');
  };

  const handleProposeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDojo) return;
    setSubmitting(true);
    setModalError('');
    setModalSuccess('');

    try {
      const payload: Record<string, string | undefined> = {};
      if (editForm.name.trim() && editForm.name.trim() !== editingDojo.name) {
        payload.name = editForm.name.trim();
      }
      if (editForm.location.trim() && editForm.location.trim() !== editingDojo.location) {
        payload.location = editForm.location.trim();
      }

      if (Object.keys(payload).length === 0) {
        setModalError('No changes to submit.');
        return;
      }

      await submitChangeRequest({
        type: 'dojo_update',
        targetDojoId: editingDojo._id,
        payload,
      });

      setModalSuccess('Dojo changes sent to admin for approval.');
      await loadPending();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to submit changes');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinRequest = async (dojoId: string) => {
    setSubmitting(true);
    setModalError('');
    try {
      await submitChangeRequest({ type: 'dojo_join', targetDojoId: dojoId });
      setModalSuccess('Join request sent to admin for approval.');
      await loadPending();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const joinCandidates = allDojos.filter((dojo) => {
    if (assignedIds.has(dojo._id)) return false;
    if (pendingRequests.some((r) => r.type === 'dojo_join' && String(r.targetDojoId) === dojo._id)) {
      return false;
    }
    const q = joinSearch.trim().toLowerCase();
    if (!q) return true;
    return [dojo.name, dojo.dojoId, dojo.location].join(' ').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-xl font-light tracking-tight text-zinc-100">
            My Dojos{typeof totalDojos === 'number' ? ` (${totalDojos})` : ''}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage your assigned dojos. Profile and dojo edits need admin approval.
          </p>
          <div className="mt-1.5">
            <StaleIndicator isFetching={isFetching && !isLoading} />
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowJoinModal(true);
            setModalError('');
            setModalSuccess('');
            setJoinSearch('');
          }}
          className="h-10 px-4 text-xs font-medium rounded-lg border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40 transition-all shrink-0"
        >
          Request another dojo
        </button>
      </div>

      <div className="w-full max-w-xl relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Filter by name or location..."
          className="w-full h-10 pl-10 pr-14 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900/50 transition-all"
        />
        {inputValue && (
          <button
            onClick={() => {
              setInputValue('');
              setParams({ search: null });
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-600 hover:text-zinc-400 text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <SkeletonCards />
      ) : isError ? (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-4 py-3">
          {error?.message}
        </div>
      ) : dojos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {dojos.map((dojo) => (
              <DojoCard
                key={dojo._id}
                dojo={dojo}
                pendingTypes={getPendingForDojo(dojo._id)}
                onViewStudents={() =>
                  router.push(`${studentsPath}?dojoId=${encodeURIComponent(dojo._id)}`)
                }
                onProposeEdit={() => openEditModal(dojo)}
              />
            ))}
          </div>

          {!isSearchActive && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
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
        <div className="p-12 text-center space-y-2 bg-white/[0.02] border border-white/[0.06] rounded-xl">
          <p className="text-xs text-zinc-600 font-mono">No dojos assigned to your account yet.</p>
          <p className="text-[11px] text-zinc-600">
            Request to join a dojo or contact an admin after approval.
          </p>
        </div>
      )}

      {editingDojo && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingDojo(null)} />
          <div className="relative w-full sm:max-w-lg bg-zinc-950 border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-[0_32px_64px_rgba(0,0,0,0.8)] max-h-[90dvh] overflow-y-auto">
            <h2 className="text-sm font-medium text-zinc-100 mb-1">Propose dojo changes</h2>
            <p className="text-xs text-zinc-500 mb-4">{editingDojo.name}</p>

            {modalError && (
              <div className="mb-4 text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mb-4 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded-lg px-3 py-2">
                {modalSuccess}
              </div>
            )}

            <form onSubmit={handleProposeEdit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Name</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Location</label>
                <input
                  value={editForm.location}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDojo(null)}
                  className="h-10 px-4 text-xs font-medium text-zinc-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 px-5 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit for approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowJoinModal(false)} />
          <div className="relative w-full sm:max-w-lg bg-zinc-950 border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-[0_32px_64px_rgba(0,0,0,0.8)] max-h-[90dvh] overflow-y-auto">
            <h2 className="text-sm font-medium text-zinc-100 mb-1">Request to join a dojo</h2>
            <p className="text-xs text-zinc-500 mb-4">Admin must approve before you are assigned.</p>

            {modalError && (
              <div className="mb-4 text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mb-4 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded-lg px-3 py-2">
                {modalSuccess}
              </div>
            )}

            <input
              type="text"
              value={joinSearch}
              onChange={(e) => setJoinSearch(e.target.value)}
              placeholder="Search dojos..."
              className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 mb-4 focus:outline-none focus:border-zinc-500"
            />

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {joinCandidates.length > 0 ? (
                joinCandidates.map((dojo) => (
                  <div
                    key={dojo._id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{dojo.name}</p>
                      <p className="text-[11px] text-zinc-500 truncate">{dojo.location}</p>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => void handleJoinRequest(dojo._id)}
                      className="h-8 px-3 text-xs font-medium rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/40 disabled:opacity-50 shrink-0"
                    >
                      Request
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-600 text-center py-6">No dojos available to request.</p>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="h-10 px-4 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InstructorDojosPage() {
  return (
    <Suspense fallback={<SkeletonCards />}>
      <InstructorDojosContent />
    </Suspense>
  );
}
