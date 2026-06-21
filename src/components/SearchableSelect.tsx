'use client';

import React, { useState, useRef, useEffect } from 'react';

type Option = {
  value: string;
  label: string;
  dotColor?: string;
};

interface SearchableSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  label,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

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
          }}
          className="w-full h-10 px-4 flex items-center justify-between rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 transition-all text-left"
        >
          <span className="flex items-center space-x-2.5 truncate">
            {selectedOption?.dotColor && (
              <span
                className="inline-block w-3 h-3 rounded-full border border-white/10 shrink-0"
                style={{ backgroundColor: selectedOption.dotColor }}
              />
            )}
            <span className={selectedOption ? 'text-zinc-200' : 'text-zinc-500'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>
          <svg
            className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-zinc-950 border border-white/[0.08] rounded-lg shadow-[0_12px_24px_rgba(0,0,0,0.6)] overflow-hidden max-h-60 flex flex-col">
            <div className="p-2 border-b border-white/[0.04] shrink-0">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
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
                    className={`w-full h-9 px-3 flex items-center space-x-2.5 text-xs transition-colors text-left ${
                      opt.value === value
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:bg-white/[0.02] hover:text-zinc-200'
                    }`}
                  >
                    {opt.dotColor && (
                      <span
                        className="inline-block w-3 h-3 rounded-full border border-white/10 shrink-0"
                        style={{ backgroundColor: opt.dotColor }}
                      />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))
              ) : (
                <div className="p-3 text-center text-[10px] text-zinc-600 font-mono">
                  No options found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
