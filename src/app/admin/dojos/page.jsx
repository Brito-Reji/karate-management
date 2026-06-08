'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function DojosPage() {
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  // read from URL
  const currentPage   = Number(searchParams.get('page'))   || 1;
  const searchQuery   = searchParams.get('search') || '';

  const [dojos, setDojos]         = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  // local input value — decoupled from URL until debounce fires
  const [inputValue, setInputValue] = useState(searchQuery);

  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingDojo, setEditingDojo]   = useState(null);
  const [formData, setFormData] = useState({ name: '', location: '', instructor: '' });

  // update URL helper
  const setParams = useCallback((updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  // fetch from API using URL params
  const fetchDojos = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch(`/api/admin/dojos?page=${currentPage}&search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setDojos(data.data);
        setTotalPages(data.totalPages);
      } else {
        setError('Failed to load dojos.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    (async () => { await fetchDojos(); })();
  }, [fetchDojos]);

  // debounce: wait 1000ms after typing before pushing to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      // only push if changed
      if (inputValue !== searchQuery) {
        setParams({ search: inputValue, page: null });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSearchChange = (e) => setInputValue(e.target.value);

  const openCreateModal = () => {
    setEditingDojo(null);
    setFormData({ name: '', location: '', instructor: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (dojo) => {
    setEditingDojo(dojo);
    setFormData({ name: dojo.name, location: dojo.location, instructor: dojo.instructor });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location) return;
    setSubmitting(true);
    setError('');

    if (editingDojo) {
      try {
        const res  = await fetch(`/api/admin/dojos/${editingDojo._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) { await fetchDojos(); setIsModalOpen(false); }
        else setError(data.message || 'Failed to update dojo.');
      } catch { setError('Network error.'); }
      finally  { setSubmitting(false); }
    } else {
      try {
        const res  = await fetch('/api/admin/dojos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) { await fetchDojos(); setIsModalOpen(false); }
        else setError(data.message || 'Failed to create dojo.');
      } catch { setError('Network error.'); }
      finally  { setSubmitting(false); }
    }
  };


  if (loading) return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {error && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}
      
      {/* SECTION: UPPER FUNCTIONAL TITLE FRAME */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-xl font-light tracking-tight text-zinc-100">Dojo Branches</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage physical instruction facilities and location rosters.</p>
        </div>
        
        <button
          onClick={openCreateModal}
          className="h-10 px-4 bg-zinc-100 hover:bg-white active:scale-[0.98] text-zinc-950 text-xs font-medium rounded-lg transition-all flex items-center justify-center space-x-2 self-start sm:self-auto shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7-7H5.5" />
          </svg>
          <span>Add New Dojo</span>
        </button>
      </div>

      {/* SECTION: POWER FILTER SEARCH CONTROLLER INPUT BAR */}
      <div className="w-full max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={inputValue}
          onChange={handleSearchChange}
          placeholder="Filter by branch title, instructor name, or region..."
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900/50 transition-all"
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
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden shadow-xl">
        {dojos.length > 0 ? (
          <div className="divide-y divide-white/[0.04]">
            {dojos.map((dojo) => (
              // dojo._id from MongoDB
              <div key={dojo._id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/[0.01] transition-colors group">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{dojo.name}</h3>
                    <span className="text-[10px] font-mono text-zinc-600 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded">
                      {dojo.dojoId}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-zinc-500">
                    <span className="text-zinc-400 font-medium">{dojo.instructor}</span>
                    <span>•</span>
                    <span className="truncate max-w-[200px] sm:max-w-none">{dojo.location}</span>
                  </div>
                </div>

                {/* Right Area Controls */}
                <div className="flex items-center justify-between sm:justify-end space-x-6 border-t border-white/[0.02] sm:border-t-0 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right hidden xs:block">
                    <span className="text-xs font-mono text-zinc-300 font-medium">{dojo.count}</span>
                    <span className="text-[10px] text-zinc-600 block sm:inline sm:ml-1">Students</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 ml-auto sm:ml-0">
                    <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border ${
                      dojo.status === 'Active' 
                        ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}>
                      {dojo.status}
                    </span>

                    {/* Highly Professional, Clean Edit Trigger */}
                    <button
                      onClick={() => openEditModal(dojo)}
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] h-7 px-3 rounded-md"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-zinc-600 font-mono">
            No active dojo profiles match your search filter criteria.
          </div>
        )}
      </div>

      {/* SECTION: MINIMALIST PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1 pt-2">
          <p className="text-[11px] text-zinc-600 font-mono">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setParams({ page: String(currentPage - 1) })}
              disabled={currentPage === 1}
              className="px-3 h-8 rounded border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] disabled:opacity-20 disabled:hover:bg-transparent text-xs text-zinc-400 hover:text-white transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setParams({ page: String(currentPage + 1) })}
              disabled={currentPage === totalPages}
              className="px-3 h-8 rounded border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] disabled:opacity-20 disabled:hover:bg-transparent text-xs text-zinc-400 hover:text-white transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* SECTION: UNIFIED DATA MUTATION MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />

          <div className="w-full max-w-md bg-zinc-950 border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.8)] z-10 relative">
            <div className="mb-6">
              <h2 className="text-base font-medium text-zinc-100 tracking-tight">
                {editingDojo ? `Modify Branch Info: ${editingDojo.dojoId}` : 'Create New Dojo Branch'}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {editingDojo ? 'Apply structural modifications to this registry location.' : 'Populate parameters to initialize active infrastructure tracking.'}
              </p>
            </div>

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

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Assigned Chief Instructor</label>
                <input
                  type="text"
                  required
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                  placeholder="Sensei Martin"
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                />
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
                  disabled={submitting}
                  className="h-10 px-5 bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingDojo ? 'Save Changes' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}