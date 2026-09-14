'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RowIndexBadge from '@/components/RowIndexBadge';
import {
  fetchApplications,
  reviewApplication,
  type ApplicationItem,
} from '@/queries/applicationQueries';

function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
      ))}
    </div>
  );
}

function typeBadge(item: ApplicationItem) {
  if (item.kind === 'registration') {
    return { label: 'Registration', className: 'bg-amber-950/20 border-amber-500/20 text-amber-400' };
  }
  switch (item.type) {
    case 'profile_update':
      return { label: 'Profile update', className: 'bg-sky-950/20 border-sky-500/20 text-sky-400' };
    case 'dojo_update':
      return { label: 'Dojo edit', className: 'bg-violet-950/20 border-violet-500/20 text-violet-400' };
    case 'dojo_join':
      return { label: 'Join dojo', className: 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' };
    default:
      return { label: 'Change', className: 'bg-zinc-900 border-zinc-700 text-zinc-400' };
  }
}

function DiffRow({ label, current, proposed }: { label: string; current?: string; proposed?: string }) {
  if (!proposed || proposed === current) return null;
  return (
    <div className="text-[11px] space-y-0.5">
      <span className="text-zinc-600 uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-x-2 gap-y-1">
        {current ? (
          <span className="text-zinc-500 line-through break-all">{current}</span>
        ) : (
          <span className="text-zinc-600 italic">empty</span>
        )}
        <span className="text-zinc-700">→</span>
        <span className="text-zinc-200 break-all">{proposed}</span>
      </div>
    </div>
  );
}

function ChangeDiff({ item }: { item: Extract<ApplicationItem, { kind: 'change' }> }) {
  const current = item.currentSnapshot ?? {};
  const payload = item.payload ?? {};

  if (item.type === 'profile_update') {
    return (
      <div className="space-y-2 pt-2">
        <DiffRow label="Name" current={String(current.name ?? '')} proposed={String(payload.name ?? '')} />
        <DiffRow label="Phone" current={String(current.phone ?? '')} proposed={String(payload.phone ?? '')} />
        <DiffRow label="Bio" current={String(current.bio ?? '')} proposed={String(payload.bio ?? '')} />
        {payload.avatarUrl && payload.avatarUrl !== current.avatarUrl && (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-[11px] text-zinc-600 uppercase tracking-wider">Photo</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={String(payload.avatarUrl)}
              alt=""
              className="w-12 h-12 rounded-full object-cover border border-white/[0.08]"
            />
          </div>
        )}
      </div>
    );
  }

  if (item.type === 'dojo_update') {
    return (
      <div className="space-y-2 pt-2">
        {item.targetDojo && (
          <p className="text-[11px] text-zinc-500">
            Dojo: <span className="text-zinc-300">{item.targetDojo.name}</span>
          </p>
        )}
        <DiffRow label="Name" current={String(current.name ?? '')} proposed={String(payload.name ?? '')} />
        <DiffRow label="Location" current={String(current.location ?? '')} proposed={String(payload.location ?? '')} />
      </div>
    );
  }

  if (item.type === 'dojo_join') {
    return (
      <div className="pt-2 space-y-1">
        <p className="text-[11px] text-zinc-500">
          Wants to join{' '}
          <span className="text-zinc-200">
            {item.targetDojo?.name || String(payload.dojoName || 'Unknown dojo')}
          </span>
        </p>
        {(item.targetDojo?.location || payload.dojoLocation) && (
          <p className="text-[11px] text-zinc-600">{item.targetDojo?.location || String(payload.dojoLocation)}</p>
        )}
      </div>
    );
  }

  return null;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectingItem, setRejectingItem] = useState<ApplicationItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchApplications();
      setApplications(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Failed to load')) {
        router.replace('/admin/dojos');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  const handleApprove = async (item: ApplicationItem) => {
    const label =
      item.kind === 'registration'
        ? item.name
        : item.submittedBy.name;

    if (!confirm(`Approve this ${item.kind === 'registration' ? 'registration' : 'change request'} for ${label}?`)) {
      return;
    }

    setReviewingId(item._id);
    setError('');
    try {
      await reviewApplication(item._id, 'approve', {
        kind: item.kind === 'registration' ? 'registration' : 'change',
      });
      setApplications((prev) => prev.filter((app) => app._id !== item._id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (item: ApplicationItem) => {
    setReviewingId(item._id);
    setError('');
    try {
      await reviewApplication(item._id, 'reject', {
        rejectionReason,
        kind: item.kind === 'registration' ? 'registration' : 'change',
      });
      setApplications((prev) => prev.filter((app) => app._id !== item._id));
      setRejectingItem(null);
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-xl font-light tracking-tight text-zinc-100">Applications</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review instructor registrations, profile updates, dojo edits, and join requests.
          </p>
        </div>
        {applications.length > 0 && (
          <span className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-amber-950/20 border border-amber-500/20 text-amber-400">
            {applications.length} pending
          </span>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonRows />
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden shadow-xl">
          {applications.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {applications.map((app, index) => {
                const badge = typeBadge(app);
                const displayName =
                  app.kind === 'registration' ? app.name : app.submittedBy.name;
                const displayEmail =
                  app.kind === 'registration' ? app.email : app.submittedBy.email;
                const displayPhone =
                  app.kind === 'registration' ? app.phone : app.submittedBy.phone;
                const avatarUrl =
                  app.kind === 'registration'
                    ? app.avatarUrl
                    : app.submittedBy.avatarUrl || (app.payload.avatarUrl as string | undefined);

                return (
                  <div
                    key={`${app.kind}-${app._id}`}
                    className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 hover:bg-white/[0.01] transition-colors group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <RowIndexBadge index={index} />
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={avatarUrl}
                              alt=""
                              className="w-11 h-11 rounded-full object-cover border border-white/[0.08] shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-zinc-900 border border-white/[0.06] flex items-center justify-center shrink-0">
                              <span className="text-xs text-zinc-500">
                                {displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0 space-y-2 flex-1">
                            <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                              <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors break-words">
                                {displayName}
                              </h3>
                              <span
                                className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
                              {displayEmail && <span className="break-all">{displayEmail}</span>}
                              {displayEmail && displayPhone && <span className="text-zinc-700">•</span>}
                              {displayPhone && <span className="font-mono">{displayPhone}</span>}
                            </div>
                          </div>
                        </div>

                        {app.kind === 'registration' && app.dojos && app.dojos.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {app.dojos.map((dojo) => (
                              <span
                                key={dojo._id}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950/20 border border-emerald-500/20 text-emerald-400"
                              >
                                {dojo.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {app.kind === 'registration' && app.bio && (
                          <p className="text-[11px] text-zinc-500 break-words">{app.bio}</p>
                        )}

                        {app.kind === 'change' && <ChangeDiff item={app} />}

                        {'appliedAt' in app && app.appliedAt && (
                          <p className="text-[11px] text-zinc-600 font-mono">
                            Applied{' '}
                            {new Date(app.appliedAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                        {'createdAt' in app && app.createdAt && app.kind === 'change' && (
                          <p className="text-[11px] text-zinc-600 font-mono">
                            Submitted{' '}
                            {new Date(app.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2 shrink-0 lg:self-center">
                      <button
                        onClick={() => void handleApprove(app)}
                        disabled={reviewingId === app._id}
                        className="h-8 px-4 text-xs font-medium text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 hover:bg-emerald-950/40 rounded-lg transition-all disabled:opacity-40"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setRejectingItem(app);
                          setRejectionReason('');
                        }}
                        disabled={reviewingId === app._id}
                        className="h-8 px-4 text-xs font-medium text-red-400 bg-red-950/20 border border-red-500/20 hover:bg-red-950/40 rounded-lg transition-all disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center space-y-2">
              <p className="text-xs text-zinc-600 font-mono">No pending applications.</p>
            </div>
          )}
        </div>
      )}

      {rejectingItem && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setRejectingItem(null)}
          />
          <div className="relative w-full sm:max-w-md bg-zinc-950 border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-[0_32px_64px_rgba(0,0,0,0.8)]">
            <h2 className="text-sm font-medium text-zinc-100 mb-1">Reject request</h2>
            <p className="text-xs text-zinc-500 mb-4">
              Optionally provide a reason. Live data stays unchanged for change requests.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none mb-4"
            />
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectingItem(null)}
                className="h-10 px-4 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleReject(rejectingItem)}
                disabled={reviewingId === rejectingItem._id}
                className="h-10 px-5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-all disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
