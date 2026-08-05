'use client';

import React, { useState, Suspense } from 'react';
import { useAllDojos, useBeltHistory, usePromoteStudent, useUpdateBeltHistory, useDeleteBeltHistory } from '@/hooks/useBeltHistory';
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
      <div className="w-full max-w-lg relative">
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
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-950 border border-white/[0.08] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] z-20 max-h-72 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-xs text-zinc-500 text-center animate-pulse">Searching…</div>
            ) : searchResults?.students?.length > 0 ? (
              <div className="divide-y divide-white/[0.04]">
                {searchResults.students.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => handleSelectStudent(s)}
                    className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition-colors flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-zinc-200 font-medium">{s.name}</span>
                        <span className="text-[10px] font-mono text-zinc-600">{s.studentId}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-zinc-500">
                        <BeltDot belt={s.belt || 'White'} />
                        <span>{s.belt || 'White'}</span>
                        <span>•</span>
                        <span>{dojoName(s.dojoId || '')}</span>
                      </div>
                    </div>
                    <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
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
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-sm font-medium text-zinc-100">{selectedStudent.name}</h3>
                    <span className="text-[10px] font-mono text-zinc-600 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded">
                      {selectedStudent.studentId}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-zinc-500">
                    <span>{dojoName(selectedStudent.dojoId || '')}</span>
                    {selectedStudent.phoneNumber && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{selectedStudent.phoneNumber}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors"
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
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
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
                  <div className="grid grid-cols-2 gap-3">
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

          {/* right: belt history timeline */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-medium text-zinc-200 mb-4">Belt Test History</h3>

            {isHistoryLoading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-white/[0.03]" />
                ))}
              </div>
            ) : beltHistory.length > 0 ? (
              <div className="relative">
                {/* timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.06]" />

                <div className="space-y-4">
                  {beltHistory.map((entry, index) => (
                    <div key={entry._id} className="flex items-start space-x-3 relative group">
                      {/* dot */}
                      <div className="relative z-10 mt-1">
                        <BeltDot belt={entry.beltName} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-zinc-200">{entry.beltName}</span>
                            {entry.status === 'Fail' ? (
                              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-400 uppercase tracking-wider">
                                Failed
                              </span>
                            ) : (
                              <>
                                <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                                  Passed
                                </span>
                                {index === 0 && (
                                  <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 uppercase tracking-wider">
                                    Current
                                  </span>
                                )}
                              </>
                            )}
                          </div>

                          {/* edit / delete buttons */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditEntry(entry)}
                              className="p-1 text-zinc-600 hover:text-zinc-300 transition-colors"
                              title="Edit"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(entry._id)}
                              className="p-1 text-zinc-600 hover:text-rose-400 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 text-[11px] text-zinc-500 mt-0.5">
                          <span>
                            {new Date(entry.awardedDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {entry.examiner && (
                            <>
                              <span>•</span>
                              <span>by {entry.examiner}</span>
                            </>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-[11px] text-zinc-600 mt-1">{entry.notes}</p>
                        )}

                        {/* delete confirmation */}
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
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-zinc-600 font-mono">No belt history recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* edit history entry modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingEntry(null)} />
          <div className="relative w-full max-w-md bg-zinc-950 border border-white/[0.08] rounded-2xl p-6 shadow-[0_32px_64px_rgba(0,0,0,0.8)]">
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

      {/* empty state when no student is selected */}
      {!selectedStudent && debouncedSearch.length < 2 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-12 text-center">
          <div className="flex justify-center mb-3">
            <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-xs text-zinc-500">Search for a student above to record a belt test.</p>
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
