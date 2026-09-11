'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useCreateDojo } from '@/hooks/useDojos';

type DojoOption = {
  value: string;
  label: string;
};

interface DojoSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: DojoOption[];
  placeholder?: string;
  label?: string;
}

export default function DojoSelect({
  value,
  onChange,
  options,
  placeholder = 'Select a dojo...',
  label,
}: DojoSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newDojo, setNewDojo] = useState({ name: '', location: '', instructor: '' });
  const [addError, setAddError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const createDojo = useCreateDojo();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setAddError('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const openAddForm = (prefillName = '') => {
    setIsAdding(true);
    setAddError('');
    setNewDojo({ name: prefillName, location: '', instructor: '' });
  };

  const handleCreateDojo = () => {
    const name = newDojo.name.trim();
    const location = newDojo.location.trim();
    const instructor = newDojo.instructor.trim();
    if (!name || !location || !instructor) return;
    setAddError('');

    createDojo.mutate(
      { name, location, instructors: [instructor] },
      {
        onSuccess: (dojo) => {
          onChange(dojo._id);
          setIsOpen(false);
          setIsAdding(false);
          setSearch('');
          setNewDojo({ name: '', location: '', instructor: '' });
        },
        onError: (err) => setAddError(err.message),
      }
    );
  };

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      {label && (
        <label className="text-xs font-medium text-zinc-400 tracking-wide block">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            setSearch('');
            setIsAdding(false);
            setAddError('');
          }}
          className="w-full h-10 px-4 flex items-center justify-between rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-all text-left"
        >
          <span className={selectedOption ? 'text-zinc-200 truncate' : 'text-zinc-500 truncate'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-zinc-950 border border-white/[0.08] rounded-lg shadow-[0_12px_24px_rgba(0,0,0,0.6)] overflow-hidden max-h-72 flex flex-col">
            {isAdding ? (
              <div className="p-3 space-y-3">
                <p className="text-xs font-medium text-zinc-300">Add new dojo</p>
                {addError && (
                  <p className="text-[10px] text-red-400 bg-red-950/30 border border-red-500/20 rounded px-2 py-1.5">
                    {addError}
                  </p>
                )}
                <input
                  type="text"
                  value={newDojo.name}
                  onChange={(e) => setNewDojo({ ...newDojo, name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateDojo();
                    }
                  }}
                  placeholder="Dojo name"
                  autoFocus
                  className="w-full h-8 px-2.5 rounded bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                />
                <input
                  type="text"
                  value={newDojo.location}
                  onChange={(e) => setNewDojo({ ...newDojo, location: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateDojo();
                    }
                  }}
                  placeholder="Location"
                  className="w-full h-8 px-2.5 rounded bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                />
                <input
                  type="text"
                  value={newDojo.instructor}
                  onChange={(e) => setNewDojo({ ...newDojo, instructor: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateDojo();
                    }
                  }}
                  placeholder="Instructor name"
                  className="w-full h-8 px-2.5 rounded bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setAddError('');
                    }}
                    className="flex-1 h-8 rounded border border-white/[0.06] text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateDojo}
                    disabled={
                      createDojo.isPending
                      || !newDojo.name.trim()
                      || !newDojo.location.trim()
                      || !newDojo.instructor.trim()
                    }
                    className="flex-1 h-8 rounded bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {createDojo.isPending ? 'Adding...' : 'Add Dojo'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-2 border-b border-white/[0.04] shrink-0">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search dojos..."
                    autoFocus
                    className="w-full h-8 px-2.5 rounded bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                  />
                </div>
                <div className="overflow-y-auto flex-1 py-1 divide-y divide-white/[0.01]">
                  {filtered.length > 0 ? (
                    filtered.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onChange(opt.value);
                          setIsOpen(false);
                        }}
                        className={`w-full h-9 px-3 flex items-center text-xs transition-colors text-left ${
                          opt.value === value
                            ? 'bg-zinc-800 text-white font-medium'
                            : 'text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center space-y-2">
                      <p className="text-[10px] text-zinc-600 font-mono">No dojos found.</p>
                      {search.trim() && (
                        <button
                          type="button"
                          onClick={() => openAddForm(search.trim())}
                          className="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
                        >
                          Add &quot;{search.trim()}&quot; as new dojo
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="border-t border-white/[0.04] p-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openAddForm(search.trim())}
                    className="w-full h-8 px-3 flex items-center justify-center gap-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.03] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7-7H5.5" />
                    </svg>
                    Add new dojo
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
