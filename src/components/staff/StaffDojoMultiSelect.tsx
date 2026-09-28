'use client';

import React, { useMemo, useState } from 'react';
import type { DojoDropdownOption } from '@/queries/studentQueries';

type StaffDojoMultiSelectProps = {
  dojos: DojoDropdownOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  loading?: boolean;
  disabled?: boolean;
};

export default function StaffDojoMultiSelect({
  dojos,
  selectedIds,
  onChange,
  loading = false,
  disabled = false,
}: StaffDojoMultiSelectProps) {
  const [dojoSearch, setDojoSearch] = useState('');

  const filteredDojos = useMemo(() => {
    const q = dojoSearch.trim().toLowerCase();
    if (!q) return dojos;
    return dojos.filter((dojo) => {
      const haystack = [dojo.name, dojo.dojoId, dojo.location]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [dojos, dojoSearch]);

  const selectedDojos = useMemo(
    () => dojos.filter((dojo) => selectedIds.includes(dojo._id)),
    [dojos, selectedIds]
  );

  const toggleDojo = (dojoId: string) => {
    if (disabled || loading) return;
    onChange(
      selectedIds.includes(dojoId)
        ? selectedIds.filter((id) => id !== dojoId)
        : [...selectedIds, dojoId]
    );
  };

  return (
    <div className="space-y-3">
      {dojos.length > 5 && (
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
            />
          </svg>
          <input
            type="text"
            value={dojoSearch}
            onChange={(e) => setDojoSearch(e.target.value)}
            disabled={disabled || loading}
            placeholder="Search by name, ID, or location..."
            className="w-full h-9 pl-9 pr-14 rounded-lg bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50 transition-all"
          />
          {dojoSearch && (
            <button
              type="button"
              onClick={() => setDojoSearch('')}
              className="absolute inset-y-0 right-0 pr-3 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {selectedDojos.length > 0 && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-2">
          <p className="text-[10px] text-emerald-400/70 uppercase tracking-wider mb-1.5">
            Selected ({selectedDojos.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {selectedDojos.map((dojo) => (
              <button
                key={dojo._id}
                type="button"
                disabled={disabled || loading}
                onClick={() => toggleDojo(dojo._id)}
                className="group inline-flex items-center gap-1 max-w-full px-2 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/25 text-left hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
                title={`Remove ${dojo.name}`}
              >
                <span className="text-xs font-medium text-emerald-200 truncate max-w-[200px]">
                  {dojo.name} · {dojo.location}
                </span>
                <svg
                  className="w-3 h-3 shrink-0 text-emerald-400/60 group-hover:text-emerald-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-zinc-900/50 border border-zinc-800" />
          ))}
        </div>
      ) : dojos.length === 0 ? (
        <p className="text-xs text-zinc-500 py-3 text-center border border-zinc-800 rounded-lg">
          No dojos available yet.
        </p>
      ) : filteredDojos.length === 0 ? (
        <p className="text-xs text-zinc-500 py-3 text-center border border-zinc-800 rounded-lg">
          No dojos match your search.
        </p>
      ) : (
        <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/30 p-2">
          {filteredDojos.map((dojo) => {
            const isSelected = selectedIds.includes(dojo._id);
            return (
              <button
                key={dojo._id}
                type="button"
                disabled={disabled || loading}
                onClick={() => toggleDojo(dojo._id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-zinc-600'
                } disabled:opacity-50`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="w-2.5 h-2.5 text-zinc-950"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{dojo.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {dojo.dojoId} · {dojo.location}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
