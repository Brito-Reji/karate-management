'use client';

import React, { useState, Suspense, useRef, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAllDojos, useBeltHistory, useRecentTests, usePromoteStudent, useUpdateBeltHistory, useDeleteBeltHistory } from '@/hooks/useBeltHistory';
import useDebounce from '@/hooks/useDebounce';
import { BELTS } from '@/lib/constants';
import { useQuery } from '@tanstack/react-query';
import { fetchStudents } from '@/queries/studentQueries';

function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
      ))}
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

function TestsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;
  const RECENT_TESTS_LIMIT = 10;

  const [searchInput, setSearchInput] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState<{
    beltName: string;
    awardedDate: string;
    examiner: string;
    notes: string;
    status: 'Pass' | 'Fail';
  }>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('examiner_name') || '' : '';
    return {
      beltName: '',
      awardedDate: new Date().toISOString().split('T')[0],
      examiner: saved,
      notes: '',
      status: 'Pass',
    };
  });
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const debouncedSearch = useDebounce(searchInput, 300);

  // search students
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['students', 'search-tests', debouncedSearch],
    queryFn: () => fetchStudents({ search: debouncedSearch, limit: 8 }),
    enabled: debouncedSearch.length >= 2,
  });

  const { data: dojos = [] } = useAllDojos();

  // belt history for selected student
  const { data: beltHistory = [], isLoading: isHistoryLoading } = useBeltHistory(
    selectedStudent?._id || ''
  );

  // recent tests across all students (shown when none selected)
  const {
    data: recentTestsData,
    isLoading: isRecentLoading,
    isFetching: isRecentFetching,
  } = useRecentTests(currentPage, RECENT_TESTS_LIMIT);

  const recentTests = recentTestsData?.history ?? [];
  const totalPages = recentTestsData?.totalPages ?? 1;

  const recentListRef = useRef<HTMLDivElement>(null);

  const setPage = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete('page');
    else params.set('page', String(page));
    router.push(`${pathname}?${params.toString()}`);
    recentListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, router, pathname]);

  const promote = usePromoteStudent();
  const updateEntry = useUpdateBeltHistory();
  const deleteEntry = useDeleteBeltHistory();

  // editing state for belt history
  const [editingEntry, setEditingEntry] = useState<null | {
    _id: string;
    beltName: string;
    awardedDate: string;
    examiner: string;
    notes: string;
    status: 'Pass' | 'Fail';
  }>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // get dojo name
  const dojoName = (dojoId: string) => {
    const d = dojos.find((dj) => dj._id === dojoId);
    return d ? d.name : '—';
  };

  // belts above current
  const currentBeltRank = selectedStudent
    ? (BELTS.find((b) => b.name === selectedStudent.belt)?.rank ?? 0)
    : 0;

  const availableBelts = BELTS.filter((b) => b.rank > currentBeltRank);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchInput('');
    setFormError('');
    setSuccessMsg('');
    const currentRank = BELTS.find((b) => b.name === student.belt)?.rank ?? 0;
    const nextAvailable = BELTS.filter((b) => b.rank > currentRank);
    const savedExaminer = typeof window !== 'undefined' ? localStorage.getItem('examiner_name') || '' : '';
    setFormData({
      beltName: nextAvailable[0]?.name || '',
      awardedDate: new Date().toISOString().split('T')[0],
      examiner: savedExaminer,
      notes: '',
      status: 'Pass',
    });
  };

  const handlePromote = (e) => {
    e.preventDefault();
    if (!selectedStudent || !formData.beltName) return;
    setFormError('');
    setSuccessMsg('');

    promote.mutate(
      {
        id: selectedStudent._id,
        beltName: formData.beltName,
        awardedDate: formData.awardedDate,
        examiner: formData.examiner,
        notes: formData.notes,
        status: formData.status,
      },
      {
        onSuccess: (data) => {
          if (formData.status === 'Pass') {
            setSuccessMsg(`${selectedStudent.name} passed & promoted to ${formData.beltName}!`);
            setSelectedStudent({ ...selectedStudent, belt: formData.beltName });
          } else {
            setSuccessMsg(`Recorded test result: ${selectedStudent.name} failed ${formData.beltName} test.`);
          }
          // reset form
          const updatedBelt = formData.status === 'Pass' ? formData.beltName : (selectedStudent.belt || 'White');
          const newRank = BELTS.find((b) => b.name === updatedBelt)?.rank ?? 0;
          const nextAvailable = BELTS.filter((b) => b.rank > newRank);
          const savedExaminer = typeof window !== 'undefined' ? localStorage.getItem('examiner_name') || '' : '';
          setFormData({
            beltName: nextAvailable[0]?.name || '',
            awardedDate: new Date().toISOString().split('T')[0],
            examiner: savedExaminer,
            notes: '',
            status: 'Pass',
          });
        },
        onError: (err) => setFormError(err.message),
      }
    );
  };

  // open edit form for a history entry
  const handleEditEntry = (entry) => {
    setEditingEntry({
      _id: entry._id,
      beltName: entry.beltName,
      awardedDate: new Date(entry.awardedDate).toISOString().split('T')[0],
      examiner: entry.examiner || '',
      notes: entry.notes || '',
      status: entry.status || 'Pass',
    });
  };

  // save edited entry
  const handleSaveEdit = () => {
    if (!editingEntry || !selectedStudent) return;
    updateEntry.mutate(
      {
        studentId: selectedStudent._id,
        entryId: editingEntry._id,
        beltName: editingEntry.beltName,
        awardedDate: editingEntry.awardedDate,
        examiner: editingEntry.examiner,
        notes: editingEntry.notes,
        status: editingEntry.status,
      },
      {
        onSuccess: () => setEditingEntry(null),
      }
    );
  };

  // delete a history entry
  const handleDeleteEntry = (entryId: string) => {
    if (!selectedStudent) return;
    deleteEntry.mutate(
      { studentId: selectedStudent._id, entryId },
      {
        onSuccess: () => setDeleteConfirmId(null),
      }
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* header */}
      <div className="border-b border-white/[0.04] pb-6">
        <h1 className="text-xl font-light tracking-tight text-zinc-100">Belt Tests</h1>
        <p className="text-xs text-zinc-500 mt-1">Search a student and record belt promotions.</p>
      </div>

      {/* search */}
      <div className="w-full max-w-xl relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => { setSearchInput(e.target.value); setSelectedStudent(null); }}
          placeholder="Search student by name or ID..."
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900/50 transition-all"
        />

        {/* search results dropdown */}
        {debouncedSearch.length >= 2 && !selectedStudent && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-white/[0.08] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] z-20 max-h-[min(18rem,50vh)] overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-xs text-zinc-500 text-center animate-pulse">Searching…</div>
            ) : searchResults?.students?.length > 0 ? (
              <div className="divide-y divide-white/[0.04]">
                {searchResults.students.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => handleSelectStudent(s)}
                    className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                        <span className="text-sm text-zinc-200 font-medium break-words">{s.name}</span>
                        <span className="text-[10px] font-mono text-zinc-600 shrink-0">{s.studentId}</span>
                      </div>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
                        <BeltDot belt={s.belt || 'White'} />
                        <span>{s.belt || 'White'}</span>
                        <span className="text-zinc-700">•</span>
                        <span className="break-words">{dojoName(s.dojoId || '')}</span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-xs text-zinc-600 text-center font-mono">No students found.</div>
            )}
          </div>
        )}
      </div>

      {/* selected student + promote form */}
      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* left: student card + form */}
          <div className="space-y-5">

            {/* student info card */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                    <h3 className="text-sm font-medium text-zinc-100 break-words">{selectedStudent.name}</h3>
                    <span className="text-[10px] font-mono text-zinc-600 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded shrink-0">
                      {selectedStudent.studentId}
                    </span>
                  </div>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
                    <span className="break-words">{dojoName(selectedStudent.dojoId || '')}</span>
                    {selectedStudent.phoneNumber && (
                      <>
                        <span className="text-zinc-700">•</span>
                        <span className="font-mono">{selectedStudent.phoneNumber}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0 p-1"
                  aria-label="Clear selection"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* current belt */}
              <div className="mt-4 flex items-center space-x-3 bg-white/[0.02] border border-white/[0.04] rounded-lg px-4 py-3">
                <BeltDot belt={selectedStudent.belt || 'White'} />
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Current Belt</p>
                  <p className="text-sm font-medium text-zinc-200">{selectedStudent.belt || 'White'}</p>
                </div>
              </div>
            </div>

            {/* promote form */}
            {availableBelts.length > 0 ? (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 sm:p-5">
                <h3 className="text-sm font-medium text-zinc-200 mb-4">Record Belt Test</h3>

                {formError && (
                  <div className="mb-4 text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
                    {formError}
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-3 py-2">
                    {successMsg}
                  </div>
                )}

                <form onSubmit={handlePromote} className="space-y-4">
                  {/* test result status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 tracking-wide">Test Result</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'Pass' })}
                        className={`h-9 text-xs font-medium rounded-lg border transition-all flex items-center justify-center space-x-1.5 ${
                          formData.status === 'Pass'
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-semibold'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${formData.status === 'Pass' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                        <span>Pass (Promote)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, status: 'Fail' })}
                        className={`h-9 text-xs font-medium rounded-lg border transition-all flex items-center justify-center space-x-1.5 ${
                          formData.status === 'Fail'
                            ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 font-semibold'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${formData.status === 'Fail' ? 'bg-rose-400' : 'bg-zinc-600'}`} />
                        <span>Fail</span>
                      </button>
                    </div>
                  </div>

                  {/* target belt */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 tracking-wide">
                      {formData.status === 'Pass' ? 'Promote To' : 'Tested Belt'}
                    </label>
                    <div className="relative">
                      <select
                        required
                        value={formData.beltName}
                        onChange={(e) => setFormData({ ...formData, beltName: e.target.value })}
                        className="w-full h-10 pl-10 pr-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all appearance-none"
                      >
                        {BELTS.filter((b) => b.rank > currentBeltRank).map((b) => (
                          <option key={b.name} value={b.name} className="bg-zinc-900">
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <BeltDot belt={formData.beltName} />
                      </div>
                    </div>
                  </div>

                  {/* date + examiner */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400 tracking-wide">Test Date</label>
                      <input
                        type="date"
                        required
                        value={formData.awardedDate}
                        onChange={(e) => setFormData({ ...formData, awardedDate: e.target.value })}
                        className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400 tracking-wide">Examiner</label>
                      <input
                        type="text"
                        value={formData.examiner}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, examiner: val });
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('examiner_name', val);
                          }
                        }}
                        placeholder="Sensei name"
                        className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                      />
                    </div>
                  </div>

                  {/* notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 tracking-wide">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Optional notes about the test..."
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={promote.isPending}
                    className={`w-full h-10 text-xs font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 ${
                      formData.status === 'Pass'
                        ? 'bg-zinc-200 hover:bg-white text-zinc-950'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    {promote.isPending
                      ? 'Recording…'
                      : formData.status === 'Pass'
                      ? 'Record Pass & Promote'
                      : 'Record Failed Test'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 text-center">
                <p className="text-xs text-zinc-500">This student has reached the highest belt rank.</p>
              </div>
            )}
          </div>

          {/* right: test details for selected student */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-200 px-1">Test Details</h3>

            {isHistoryLoading ? (
              <SkeletonRows />
            ) : (
              <div className={`bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden shadow-xl transition-opacity duration-200 ${
                isHistoryLoading ? 'opacity-60' : 'opacity-100'
              }`}>
                {beltHistory.length > 0 ? (
                  <div className="divide-y divide-white/[0.04] sm:max-h-[min(28rem,55vh)] sm:overflow-y-auto sm:overscroll-contain sm:scroll-smooth">
                    {beltHistory.map((entry, index) => (
                      <div
                        key={entry._id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 hover:bg-white/[0.01] transition-colors group"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                            <BeltDot belt={entry.beltName} />
                            <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                              {entry.beltName}
                            </h3>
                            {entry.status === 'Fail' ? (
                              <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border bg-rose-950/20 border-rose-500/20 text-rose-400">
                                Failed
                              </span>
                            ) : (
                              <>
                                <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border bg-emerald-950/20 border-emerald-500/20 text-emerald-400">
                                  Passed
                                </span>
                                {index === 0 && (
                                  <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border bg-zinc-900 border-zinc-800 text-zinc-400">
                                    Current
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
                            <span>
                              {new Date(entry.awardedDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {entry.examiner && (
                              <>
                                <span className="text-zinc-700">•</span>
                                <span>by {entry.examiner}</span>
                              </>
                            )}
                          </div>
                          {entry.notes && (
                            <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">{entry.notes}</p>
                          )}

                          {deleteConfirmId === entry._id && (
                            <div className="mt-2 flex items-center space-x-2 bg-rose-950/20 border border-rose-500/20 rounded-lg px-3 py-2">
                              <span className="text-[11px] text-rose-400 flex-1">Delete this entry?</span>
                              <button
                                onClick={() => handleDeleteEntry(entry._id)}
                                disabled={deleteEntry.isPending}
                                className="text-[11px] font-medium text-rose-400 hover:text-rose-300 disabled:opacity-50"
                              >
                                {deleteEntry.isPending ? 'Deleting…' : 'Yes'}
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="text-[11px] font-medium text-zinc-500 hover:text-zinc-300"
                              >
                                No
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end space-x-2 border-t border-white/[0.02] sm:border-t-0 pt-3 sm:pt-0 shrink-0">
                          <button
                            onClick={() => handleEditEntry(entry)}
                            className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] h-7 px-3 rounded-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(entry._id)}
                            className="text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors bg-white/[0.02] border border-white/[0.06] hover:bg-red-950/10 hover:border-red-500/20 h-7 px-3 rounded-md"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center space-y-2">
                    <p className="text-xs text-zinc-600 font-mono">No belt history recorded yet.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* edit history entry modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto sm:overflow-visible">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingEntry(null)} />
          <div className="relative w-full sm:max-w-md bg-zinc-950 border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-[0_32px_64px_rgba(0,0,0,0.8)] sm:max-h-[92dvh] sm:overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-2">
                <BeltDot belt={editingEntry.beltName} />
                <h2 className="text-sm font-medium text-zinc-100">Edit — {editingEntry.beltName}</h2>
              </div>
              <button onClick={() => setEditingEntry(null)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* status toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Result</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingEntry({ ...editingEntry, status: 'Pass' })}
                    className={`h-9 text-xs font-medium rounded-lg border transition-all flex items-center justify-center space-x-1.5 ${
                      editingEntry.status === 'Pass'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-semibold'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${editingEntry.status === 'Pass' ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    <span>Pass</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingEntry({ ...editingEntry, status: 'Fail' })}
                    className={`h-9 text-xs font-medium rounded-lg border transition-all flex items-center justify-center space-x-1.5 ${
                      editingEntry.status === 'Fail'
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 font-semibold'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${editingEntry.status === 'Fail' ? 'bg-rose-400' : 'bg-zinc-600'}`} />
                    <span>Fail</span>
                  </button>
                </div>
              </div>

              {/* belt */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Belt</label>
                <div className="relative">
                  <select
                    value={editingEntry.beltName}
                    onChange={(e) => setEditingEntry({ ...editingEntry, beltName: e.target.value })}
                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all appearance-none"
                  >
                    {BELTS.map((b) => (
                      <option key={b.name} value={b.name} className="bg-zinc-900">
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <BeltDot belt={editingEntry.beltName} />
                  </div>
                </div>
              </div>

              {/* date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Test Date</label>
                <input
                  type="date"
                  value={editingEntry.awardedDate}
                  onChange={(e) => setEditingEntry({ ...editingEntry, awardedDate: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                />
              </div>

              {/* examiner */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Examiner</label>
                <input
                  type="text"
                  value={editingEntry.examiner}
                  onChange={(e) => setEditingEntry({ ...editingEntry, examiner: e.target.value })}
                  placeholder="Sensei name"
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                />
              </div>

              {/* notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Notes</label>
                <textarea
                  value={editingEntry.notes}
                  onChange={(e) => setEditingEntry({ ...editingEntry, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all resize-none"
                />
              </div>

              {/* actions */}
              <div className="flex items-center justify-end space-x-3 pt-1">
                <button
                  onClick={() => setEditingEntry(null)}
                  className="h-9 px-4 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={updateEntry.isPending}
                  className="h-9 px-5 bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {updateEntry.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* test history when no student is selected */}
      {!selectedStudent && debouncedSearch.length < 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-medium text-zinc-200">
              Test History
              {typeof recentTestsData?.total === 'number' ? (
                <span className="text-zinc-500 font-normal"> ({recentTestsData.total})</span>
              ) : null}
            </h3>
            {isRecentFetching && !isRecentLoading && (
              <span className="text-[10px] text-zinc-500 font-mono animate-pulse">Syncing…</span>
            )}
          </div>

          {isRecentLoading ? (
            <SkeletonRows />
          ) : (
            <div className={`bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden shadow-xl transition-opacity duration-200 ${
              isRecentFetching ? 'opacity-60' : 'opacity-100'
            }`}>
              {recentTests.length > 0 ? (
                <div
                  ref={recentListRef}
                  className="divide-y divide-white/[0.04] sm:max-h-[min(28rem,55vh)] sm:overflow-y-auto sm:overscroll-contain sm:scroll-smooth"
                >
                  {recentTests.map((entry) => {
                    const isFail = entry.status === 'Fail';
                    const testType = isFail ? 'Belt Test' : 'Promotion';

                    return (
                      <div
                        key={entry._id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 hover:bg-white/[0.01] transition-colors"
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
                            <BeltDot belt={entry.beltName} />
                            <span className="text-sm text-zinc-300 break-words">
                              {entry.beltName}
                            </span>
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
                            <span>
                              {new Date(entry.awardedDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            {entry.rank != null && (
                              <>
                                <span className="text-zinc-700">•</span>
                                <span>Rank {entry.rank}</span>
                              </>
                            )}
                            {entry.examiner && (
                              <>
                                <span className="text-zinc-700">•</span>
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
                  <p className="text-xs text-zinc-600 font-mono">No test history recorded yet.</p>
                  <p className="text-xs text-zinc-500">Search for a student above to record the first test.</p>
                </div>
              )}
            </div>
          )}

          {totalPages > 1 && !selectedStudent && debouncedSearch.length < 2 && (
            <div className="flex items-center justify-between px-1 pt-2">
              <p className="text-[11px] text-zinc-600 font-mono">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1 || isRecentFetching}
                  className="px-3 h-8 rounded border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] disabled:opacity-20 disabled:hover:bg-transparent text-xs text-zinc-400 hover:text-white transition-all"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === totalPages || isRecentFetching}
                  className="px-3 h-8 rounded border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] disabled:opacity-20 disabled:hover:bg-transparent text-xs text-zinc-400 hover:text-white transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestsPage() {
  return (
    <Suspense fallback={<SkeletonRows />}>
      <TestsContent />
    </Suspense>
  );
}
