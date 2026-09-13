'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RowIndexBadge from '@/components/RowIndexBadge';
import {
  fetchApplications,
  reviewApplication,
  type InstructorApplication,
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

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
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
    loadApplications();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`Approve ${name} as an instructor?`)) return;

    setReviewingId(id);
    setError('');
    try {
      await reviewApplication(id, 'approve');
      setApplications((prev) => prev.filter((app) => app._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve application');
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setReviewingId(id);
    setError('');
    try {
      await reviewApplication(id, 'reject', rejectionReason);
      setApplications((prev) => prev.filter((app) => app._id !== id));
      setRejectingId(null);
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject application');
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-xl font-light tracking-tight text-zinc-100">Instructor Applications</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Review and approve new instructor registration requests.
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
              {applications.map((app, index) => (
                <div
                  key={app._id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 hover:bg-white/[0.01] transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <RowIndexBadge index={index} />
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                        <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors break-words">
                          {app.name}
                        </h3>
                        <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border bg-amber-950/20 border-amber-500/20 text-amber-400">
                          Pending
                        </span>
                      </div>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
                        {app.email && <span className="break-all">{app.email}</span>}
                        {app.email && app.phone && <span className="text-zinc-700">•</span>}
                        {app.phone && <span className="font-mono">{app.phone}</span>}
                      </div>
                      {app.dojos && app.dojos.length > 0 && (
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
                      {app.appliedAt && (
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
                    </div>
                  </div>

                  <div className="flex items-center flex-wrap gap-2 shrink-0 lg:self-center">
                    <button
                      onClick={() => handleApprove(app._id, app.name)}
                      disabled={reviewingId === app._id}
                      className="h-8 px-4 text-xs font-medium text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 hover:bg-emerald-950/40 rounded-lg transition-all disabled:opacity-40"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(app._id);
                        setRejectionReason('');
                      }}
                      disabled={reviewingId === app._id}
                      className="h-8 px-4 text-xs font-medium text-red-400 bg-red-950/20 border border-red-500/20 hover:bg-red-950/40 rounded-lg transition-all disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center space-y-2">
              <p className="text-xs text-zinc-600 font-mono">No pending applications.</p>
            </div>
          )}
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setRejectingId(null)}
          />
          <div className="relative w-full sm:max-w-md bg-zinc-950 border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-[0_32px_64px_rgba(0,0,0,0.8)]">
            <h2 className="text-sm font-medium text-zinc-100 mb-1">Reject Application</h2>
            <p className="text-xs text-zinc-500 mb-4">
              Optionally provide a reason. The applicant will not be able to log in.
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
                onClick={() => setRejectingId(null)}
                className="h-10 px-4 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectingId)}
                disabled={reviewingId === rejectingId}
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
