'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent } from '@/hooks/useStudents';
import { useAllDojos } from '@/hooks/useBeltHistory';
import useDebounce from '@/hooks/useDebounce';
import { BELTS } from '@/lib/constants';
import SearchableSelect from '@/components/SearchableSelect';

function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
      ))}
    </div>
  );
}

function StaleIndicator({ isFetching }) {
  if (!isFetching) return null;
  return (
    <div className="flex items-center space-x-2 text-[10px] text-zinc-500 font-mono animate-pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
      <span>Syncing latest data…</span>
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

function StudentsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('search') || '';
  const selectedBelt = searchParams.get('belt') || '';
  const selectedDojoId = searchParams.get('dojoId') || '';

  const [inputValue, setInputValue] = useState(searchQuery);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dojoId: '',
    belt: 'White',
    phoneNumber: '',
    gender: '',
    dob: '',
  });
  const [formError, setFormError] = useState('');

  const debouncedSearch = useDebounce(inputValue, 300);

  const {
    data: listData,
    isLoading,
    isError,
    error,
    isFetching,
  } = useStudents(currentPage, debouncedSearch, { belt: selectedBelt, dojoId: selectedDojoId });

  const { data: dojos = [] } = useAllDojos();

  const students = listData?.students ?? [];
  const totalPages = listData?.totalPages ?? 1;

  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const setParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      setParams({ search: debouncedSearch || null, page: null });
    }
  }, [debouncedSearch, searchQuery, setParams]);

  // get dojo name from id
  const dojoName = (dojoId: string) => {
    const d = dojos.find((dj) => dj._id === dojoId);
    return d ? d.name : '—';
  };

  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({ name: '', dojoId: '', belt: 'White', phoneNumber: '', gender: '', dob: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      dojoId: student.dojoId || '',
      belt: student.belt || 'White',
      phoneNumber: student.phoneNumber || '',
      gender: student.gender || '',
      dob: student.dob ? student.dob.split('T')[0] : '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phoneNumber) return;
    setFormError('');

    const payload = {
      ...formData,
      gender: formData.gender as "Male" | "Female" | "Other" | undefined || undefined,
    };

    if (editingStudent) {
      updateStudent.mutate(
        { id: editingStudent._id, ...payload } as any,
        {
          onSuccess: () => setIsModalOpen(false),
          onError: (err) => setFormError(err.message),
        }
      );
    } else {
      createStudent.mutate(payload, {
        onSuccess: () => setIsModalOpen(false),
        onError: (err) => setFormError(err.message),
      });
    }
  };

  const isSubmitting = createStudent.isPending || updateStudent.isPending;

  const dojoOptions = dojos.map((dojo) => ({
    value: dojo._id,
    label: `${dojo.name} — ${dojo.location}`,
  }));

  const beltOptions = BELTS.map((b) => ({
    value: b.name,
    label: b.name,
    dotColor: b.color,
  }));

  return (
    <div className="space-y-6 animate-fadeIn">

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-xl font-light tracking-tight text-zinc-100">Students</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage enrolled student records and belt assignments.</p>
          <div className="mt-1.5">
            <StaleIndicator isFetching={isFetching && !isLoading} />
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="h-10 px-4 bg-zinc-100 hover:bg-white active:scale-[0.98] text-zinc-950 text-xs font-medium rounded-lg transition-all flex items-center justify-center space-x-2 self-start sm:self-auto shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7-7H5.5" />
          </svg>
          <span>Add Student</span>
        </button>
      </div>

      {/* search and filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Search by name, ID, or phone..."
            className="w-full h-10 pl-10 pr-12 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900/50 transition-all"
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

        {/* dojo filter */}
        <div className="relative w-full md:w-48">
          <select
            value={selectedDojoId}
            onChange={(e) => setParams({ dojoId: e.target.value || null, page: null })}
            className="w-full h-10 px-3.5 pr-8 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all appearance-none"
          >
            <option value="" className="bg-zinc-950">All Dojos</option>
            {dojos.map((dojo) => (
              <option key={dojo._id} value={dojo._id} className="bg-zinc-950">
                {dojo.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {/* belt filter */}
        <div className="relative w-full md:w-48">
          <select
            value={selectedBelt}
            onChange={(e) => setParams({ belt: e.target.value || null, page: null })}
            className="w-full h-10 px-3.5 pr-8 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all appearance-none"
          >
            <option value="" className="bg-zinc-950">All Belts</option>
            {BELTS.map((b) => (
              <option key={b.name} value={b.name} className="bg-zinc-950">
                {b.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-500">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {(inputValue || selectedDojoId || selectedBelt) && (
          <button
            onClick={() => {
              setInputValue('');
              setParams({ search: null, dojoId: null, belt: null, page: null });
            }}
            className="h-10 px-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] active:scale-[0.98] text-xs text-zinc-400 hover:text-white transition-all flex items-center justify-center"
          >
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* student list */}
      {isLoading ? (
        <SkeletonRows />
      ) : isError ? (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-4 py-3">
          {error.message}
        </div>
      ) : (
        <>
          <div className={`bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden shadow-xl transition-opacity duration-200 ${
            isFetching ? 'opacity-60' : 'opacity-100'
          }`}>
            {students.length > 0 ? (
              <div className="divide-y divide-white/[0.04]">
                {students.map((student) => (
                  <div
                    key={student._id}
                    className={`p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/[0.01] transition-colors group ${
                      student._id === '__optimistic__' ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2.5">
                        <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{student.name}</h3>
                        <span className="text-[10px] font-mono text-zinc-600 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded">
                          {student.studentId ?? '—'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-zinc-500">
                        <BeltDot belt={student.belt || 'White'} />
                        <span className="text-zinc-400 font-medium">{student.belt || 'White'}</span>
                        <span>•</span>
                        <span>{dojoName(student.dojoId || '')}</span>
                        {student.phoneNumber && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{student.phoneNumber}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4 border-t border-white/[0.02] sm:border-t-0 pt-3 sm:pt-0">
                      <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border ${
                        student.status === 'Active'
                          ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}>
                        {student.status ?? 'Active'}
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(student)}
                          disabled={student._id === '__optimistic__'}
                          className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] h-7 px-3 rounded-md disabled:opacity-40"
                        >
                          Edit
                        </button>
                        {student.status === 'Active' && (
                          <button
                            onClick={() => {
                              if (confirm('Deactivate this student?')) deleteStudent.mutate(student._id);
                            }}
                            disabled={student._id === '__optimistic__'}
                            className="text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors bg-white/[0.02] border border-white/[0.06] hover:bg-red-950/10 hover:border-red-500/20 h-7 px-3 rounded-md disabled:opacity-40"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center space-y-2">
                <p className="text-xs text-zinc-600 font-mono">No students found.</p>
              </div>
            )}
          </div>

          {/* pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1 pt-2">
              <p className="text-[11px] text-zinc-600 font-mono">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setParams({ page: String(currentPage - 1) })}
                  disabled={currentPage === 1 || isFetching}
                  className="px-3 h-8 rounded border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] disabled:opacity-20 disabled:hover:bg-transparent text-xs text-zinc-400 hover:text-white transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setParams({ page: String(currentPage + 1) })}
                  disabled={currentPage === totalPages || isFetching}
                  className="px-3 h-8 rounded border border-white/[0.06] bg-white/[0.01] hover:bg-white/[0.04] disabled:opacity-20 disabled:hover:bg-transparent text-xs text-zinc-400 hover:text-white transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* add/edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />

          <div className="w-full max-w-md bg-zinc-950 border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.8)] z-10 relative max-h-[90vh] overflow-y-auto">
            <div className="mb-6">
              <h2 className="text-base font-medium text-zinc-100 tracking-tight">
                {editingStudent ? `Edit Student: ${editingStudent.studentId}` : 'Add New Student'}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                {editingStudent ? 'Update student details.' : 'Enroll a new student into the academy.'}
              </p>
            </div>

            {formError && (
              <div className="mb-4 text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
              {/* name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Arun Kumar"
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                />
              </div>

              {/* dojo selection */}
              <SearchableSelect
                label="Dojo Branch"
                value={formData.dojoId}
                onChange={(val) => setFormData({ ...formData, dojoId: val })}
                options={dojoOptions}
                placeholder="Select a dojo..."
              />

              {/* belt selection */}
              <SearchableSelect
                label="Starting Belt"
                value={formData.belt}
                onChange={(val) => setFormData({ ...formData, belt: val })}
                options={beltOptions}
                placeholder="Select a belt..."
              />

              {/* phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="e.g., 9876543210"
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                />
              </div>

              {/* gender + dob */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 tracking-wide">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all appearance-none"
                  >
                    <option value="" className="bg-zinc-900">Select...</option>
                    <option value="Male" className="bg-zinc-900">Male</option>
                    <option value="Female" className="bg-zinc-900">Female</option>
                    <option value="Other" className="bg-zinc-900">Other</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 tracking-wide">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                  />
                </div>
              </div>

              {/* actions */}
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
                  disabled={isSubmitting}
                  className="h-10 px-5 bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving…' : editingStudent ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<SkeletonRows />}>
      <StudentsContent />
    </Suspense>
  );
}
