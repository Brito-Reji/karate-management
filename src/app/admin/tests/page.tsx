'use client';

import React, { useState, Suspense } from 'react';
import { useAllDojos, useBeltHistory, usePromoteStudent } from '@/hooks/useBeltHistory';
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
  const [formData, setFormData] = useState({
    beltName: '',
    awardedDate: new Date().toISOString().split('T')[0],
    examiner: '',
    notes: '',
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
    // default to next belt
    const nextBelt = availableBelts.length > 0 ? availableBelts[0] : null;
    const currentRank = BELTS.find((b) => b.name === student.belt)?.rank ?? 0;
    const nextAvailable = BELTS.filter((b) => b.rank > currentRank);
    setFormData({
      beltName: nextAvailable[0]?.name || '',
      awardedDate: new Date().toISOString().split('T')[0],
      examiner: '',
      notes: '',
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
      },
      {
        onSuccess: (data) => {
          setSuccessMsg(`${selectedStudent.name} promoted to ${formData.beltName}!`);
          // update local selected student
          setSelectedStudent({ ...selectedStudent, belt: formData.beltName });
          // reset form for next promotion
          const newRank = BELTS.find((b) => b.name === formData.beltName)?.rank ?? 0;
          const nextAvailable = BELTS.filter((b) => b.rank > newRank);
          setFormData({
            beltName: nextAvailable[0]?.name || '',
            awardedDate: new Date().toISOString().split('T')[0],
            examiner: '',
            notes: '',
          });
        },
        onError: (err) => setFormError(err.message),
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
                  {/* new belt */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 tracking-wide">Promote To</label>
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
                        onChange={(e) => setFormData({ ...formData, examiner: e.target.value })}
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
                    className="w-full h-10 bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {promote.isPending ? 'Recording…' : 'Record Promotion'}
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
            <h3 className="text-sm font-medium text-zinc-200 mb-4">Belt Progression History</h3>

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
                    <div key={entry._id} className="flex items-start space-x-3 relative">
                      {/* dot */}
                      <div className="relative z-10 mt-1">
                        <BeltDot belt={entry.beltName} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-zinc-200">{entry.beltName}</span>
                          {index === 0 && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                              Current
                            </span>
                          )}
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
