'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useStudent, useUpdateStudent, useDeleteStudent, useActivateStudent } from '@/hooks/useStudents';
import { useAllDojos, useBeltHistory } from '@/hooks/useBeltHistory';
import { meQuery } from '@/queries/authQueries';
import { BELTS } from '@/lib/constants';
import SearchableSelect from '@/components/SearchableSelect';
import DojoSelect from '@/components/DojoSelect';
import type { DojoDropdownOption, Student } from '@/queries/studentQueries';

function SkeletonPage() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-white/[0.03]" />
      <div className="h-32 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
      <div className="h-64 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
    </div>
  );
}

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

function BeltProgressionLabel({
  fromBelt,
  beltName,
  status,
}: {
  fromBelt?: string;
  beltName: string;
  status?: 'Pass' | 'Fail';
}) {
  const from = fromBelt || 'White';
  const isFail = status === 'Fail';

  if (isFail) {
    return (
      <span className="inline-flex items-center flex-wrap gap-x-1.5 gap-y-1 text-sm font-medium text-zinc-200">
        <BeltDot belt={from} />
        <span>{from}</span>
        <span className="text-zinc-600 font-normal">· attempted</span>
        <BeltDot belt={beltName} />
        <span>{beltName}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center flex-wrap gap-x-1.5 gap-y-1 text-sm font-medium text-zinc-200">
      <BeltDot belt={from} />
      <span>{from}</span>
      <span className="text-zinc-600 font-normal">→</span>
      <BeltDot belt={beltName} />
      <span>{beltName}</span>
    </span>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-sm text-zinc-200 break-words">{value ?? '—'}</p>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function toDateInput(value?: string) {
  if (!value) return '';
  return value.split('T')[0];
}

function findDojo(dojos: DojoDropdownOption[], dojoId?: string) {
  if (!dojoId) return undefined;
  return dojos.find((dj) => dj._id === dojoId || dj.dojoId === dojoId);
}

function formatDojoInstructors(dojo?: DojoDropdownOption) {
  if (!dojo) return '—';
  if (dojo.instructors && dojo.instructors.length > 0) {
    return dojo.instructors.join(', ');
  }
  return dojo.instructor || '—';
}

type FormData = {
  name: string;
  dojoId: string;
  belt: string;
  phoneNumber: string;
  gender: string;
  dob: string;
  fatherName: string;
  motherName: string;
  admissionDate: string;
  pendingFees: string;
};

function studentToFormData(student: Student): FormData {
  return {
    name: student.name || '',
    dojoId: student.dojoId || '',
    belt: student.belt || 'White',
    phoneNumber: student.phoneNumber || '',
    gender: student.gender || '',
    dob: toDateInput(student.dob),
    fatherName: student.fatherName || '',
    motherName: student.motherName || '',
    admissionDate: toDateInput(student.admissionDate),
    pendingFees: student.pendingFees != null ? String(student.pendingFees) : '',
  };
}

function StudentDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentId = params.id as string;

  const { data: currentUser } = useQuery(meQuery);
  const isAdmin = currentUser?.role === 'admin';

  const { data: student, isLoading, isError, error } = useStudent(studentId);
  const { data: dojos = [] } = useAllDojos();
  const { data: beltHistory = [], isLoading: isHistoryLoading } = useBeltHistory(
    isAdmin ? studentId : ''
  );

  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const activateStudent = useActivateStudent();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    dojoId: '',
    belt: 'White',
    phoneNumber: '',
    gender: '',
    dob: '',
    fatherName: '',
    motherName: '',
    admissionDate: '',
    pendingFees: '',
  });
  const [formError, setFormError] = useState('');
  const editOpenedRef = useRef(false);

  const linkedDojo = useMemo(
    () => findDojo(dojos, student?.dojoId),
    [dojos, student?.dojoId]
  );

  const selectedEditDojo = useMemo(
    () => findDojo(dojos, formData.dojoId),
    [dojos, formData.dojoId]
  );

  const openEditModal = () => {
    if (!student) return;
    setFormData(studentToFormData(student));
    setFormError('');
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    if (searchParams.get('edit') === '1') {
      router.replace(`/admin/students/${studentId}`);
    }
  };

  useEffect(() => {
    editOpenedRef.current = false;
  }, [studentId]);

  useEffect(() => {
    if (searchParams.get('edit') === '1' && student && !editOpenedRef.current) {
      editOpenedRef.current = true;
      setFormData(studentToFormData(student));
      setFormError('');
      setIsEditOpen(true);
    }
  }, [searchParams, student]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !student) return;
    setFormError('');

    const pendingFees = formData.pendingFees.trim()
      ? Number(formData.pendingFees)
      : undefined;

    const payload = {
      id: student._id,
      name: formData.name,
      belt: formData.belt,
      dojoId: formData.dojoId || undefined,
      phoneNumber: formData.phoneNumber.trim() || undefined,
      gender: (formData.gender as 'Male' | 'Female' | 'Other' | undefined) || undefined,
      dob: formData.dob || undefined,
      fatherName: formData.fatherName.trim() || undefined,
      motherName: formData.motherName.trim() || undefined,
      admissionDate: formData.admissionDate || undefined,
      pendingFees: Number.isFinite(pendingFees) ? pendingFees : undefined,
    };

    updateStudent.mutate(payload, {
      onSuccess: () => closeEditModal(),
      onError: (err) => setFormError(err.message),
    });
  };

  const handleDeactivate = () => {
    if (!student || !confirm('Deactivate this student?')) return;
    deleteStudent.mutate(student._id);
  };

  const handleActivate = () => {
    if (!student || !confirm('Activate this student?')) return;
    activateStudent.mutate(student._id);
  };

  const dojoOptions = dojos.map((dojo) => {
    const instructors = formatDojoInstructors(dojo);
    const base = dojo.location || dojo.name;
    const label = instructors !== '—' ? `${base} · ${instructors}` : base;
    return { value: dojo._id, label };
  });

  const beltOptions = BELTS.map((b) => ({
    value: b.name,
    label: b.name,
    dotColor: b.color,
  }));

  if (isLoading) {
    return <SkeletonPage />;
  }

  if (isError || !student) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to Students
        </Link>
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-4 py-3">
          {error?.message || 'Student not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Students
      </Link>

      {/* header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div className="space-y-3 min-w-0">
          <div className="flex items-start flex-wrap gap-x-3 gap-y-2">
            <h1 className="text-xl font-light tracking-tight text-zinc-100 break-words">
              {student.name}
            </h1>
            <span className="text-[10px] font-mono text-zinc-600 bg-white/[0.02] border border-white/[0.04] px-1.5 py-0.5 rounded shrink-0">
              {student.studentId ?? '—'}
            </span>
            <span
              className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border shrink-0 ${
                student.status === 'Active'
                  ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
              }`}
            >
              {student.status ?? 'Active'}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
            <BeltDot belt={student.belt || 'White'} />
            <span className="text-zinc-400 font-medium">{student.belt || 'White'}</span>
            <span className="text-zinc-700">•</span>
            <span>{linkedDojo?.location || linkedDojo?.name || '—'}</span>
          </div>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
            {student.phoneNumber && (
              <>
                <span className="font-mono text-zinc-400">{student.phoneNumber}</span>
                <span className="text-zinc-700">•</span>
              </>
            )}
            {student.dob && (
              <span>DOB {formatDate(student.dob)}</span>
            )}
            {student.gender && (
              <>
                <span className="text-zinc-700">•</span>
                <span>{student.gender}</span>
              </>
            )}
            {linkedDojo && formatDojoInstructors(linkedDojo) !== '—' && (
              <>
                <span className="text-zinc-700">•</span>
                <span>Instructor: {formatDojoInstructors(linkedDojo)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            onClick={openEditModal}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-200 transition-colors bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] h-9 px-4 rounded-lg"
          >
            Edit
          </button>
          {student.status === 'Active' ? (
            <button
              onClick={handleDeactivate}
              disabled={deleteStudent.isPending}
              className="text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors bg-white/[0.02] border border-white/[0.06] hover:bg-red-950/10 hover:border-red-500/20 h-9 px-4 rounded-lg disabled:opacity-50"
            >
              Deactivate
            </button>
          ) : (
            <button
              onClick={handleActivate}
              disabled={activateStudent.isPending}
              className="text-xs font-medium text-zinc-500 hover:text-emerald-400 transition-colors bg-white/[0.02] border border-white/[0.06] hover:bg-emerald-950/10 hover:border-emerald-500/20 h-9 px-4 rounded-lg disabled:opacity-50"
            >
              Activate
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* profile */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 sm:p-6">
            <h2 className="text-sm font-medium text-zinc-200 mb-5">Student Profile</h2>

            {student.image && (
              <div className="mb-5">
                <img
                  src={student.image}
                  alt={student.name || 'Student photo'}
                  className="w-24 h-24 rounded-xl object-cover border border-white/[0.06]"
                />
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Personal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <DetailField label="Full Name" value={student.name} />
                  <DetailField label="Student ID" value={student.studentId} />
                  <DetailField label="Phone Number" value={student.phoneNumber ? <span className="font-mono">{student.phoneNumber}</span> : '—'} />
                  <DetailField label="Date of Birth" value={formatDate(student.dob)} />
                  <DetailField label="Gender" value={student.gender} />
                  <DetailField label="Status" value={student.status ?? 'Active'} />
                </div>
              </div>

              <div className="border-t border-white/[0.04] pt-6">
                <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Dojo & Training</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <DetailField label="Dojo" value={linkedDojo?.name || '—'} />
                  <DetailField label="Location" value={linkedDojo?.location || '—'} />
                  <DetailField label="Instructor(s)" value={formatDojoInstructors(linkedDojo)} />
                  <DetailField
                    label="Current Belt"
                    value={
                      <span className="inline-flex items-center gap-2">
                        <BeltDot belt={student.belt || 'White'} />
                        {student.belt || 'White'}
                      </span>
                    }
                  />
                  <DetailField label="Admission Date" value={formatDate(student.admissionDate)} />
                </div>
              </div>

              <div className="border-t border-white/[0.04] pt-6">
                <h3 className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3">Family & Fees</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <DetailField label="Father's Name" value={student.fatherName} />
                  <DetailField label="Mother's Name" value={student.motherName} />
                  <DetailField
                    label="Pending Fees"
                    value={
                      student.pendingFees != null
                        ? `₹${student.pendingFees.toLocaleString('en-IN')}`
                        : '—'
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* belt history (admin only) */}
        {isAdmin && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-zinc-200 px-1">Belt History</h2>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden shadow-xl">
              {isHistoryLoading ? (
                <div className="p-6 space-y-3 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 rounded-lg bg-white/[0.03]" />
                  ))}
                </div>
              ) : beltHistory.length > 0 ? (
                <div className="divide-y divide-white/[0.04] max-h-[min(32rem,70vh)] overflow-y-auto overscroll-contain">
                  {beltHistory.map((entry, index) => (
                    <div
                      key={entry._id}
                      className="p-4 sm:p-5 hover:bg-white/[0.01] transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                          <BeltProgressionLabel
                            fromBelt={entry.fromBelt}
                            beltName={entry.beltName}
                            status={entry.status}
                          />
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
                                  Latest
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
                          <span>{formatDate(entry.awardedDate)}</span>
                          {entry.examiner && (
                            <>
                              <span className="text-zinc-700">•</span>
                              <span>by {entry.examiner}</span>
                            </>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-zinc-600 mt-0.5">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-xs text-zinc-600 font-mono">No belt history recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* edit modal */}
      {isEditOpen && (
        <div className="fixed inset-0 w-full h-full flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn overflow-y-auto sm:overflow-visible">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={closeEditModal} />

          <div className="w-full sm:max-w-lg bg-zinc-950 border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 sm:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.8)] z-10 relative sm:max-h-[92dvh] sm:overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="mb-6">
              <h2 className="text-base font-medium text-zinc-100 tracking-tight">
                Edit Student: {student.studentId}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Update student details.</p>
            </div>

            {formError && (
              <div className="mb-4 text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                />
              </div>

              <DojoSelect
                label="Dojo Branch"
                value={formData.dojoId}
                onChange={(val) => setFormData({ ...formData, dojoId: val })}
                options={dojoOptions}
                placeholder="Select a dojo..."
              />
              {selectedEditDojo && (
                <p className="text-xs text-zinc-500 -mt-2">
                  Instructor(s): {formatDojoInstructors(selectedEditDojo)}
                </p>
              )}

              <SearchableSelect
                label="Belt"
                value={formData.belt}
                onChange={(val) => setFormData({ ...formData, belt: val })}
                options={beltOptions}
                placeholder="Select a belt..."
              />

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                />
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 tracking-wide">Father&apos;s Name</label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 tracking-wide">Mother&apos;s Name</label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 tracking-wide">Admission Date</label>
                  <input
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 tracking-wide">Pending Fees (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.pendingFees}
                    onChange={(e) => setFormData({ ...formData, pendingFees: e.target.value })}
                    className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="h-10 px-4 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateStudent.isPending}
                  className="h-10 px-5 bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {updateStudent.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDetailPage() {
  return (
    <Suspense fallback={<SkeletonPage />}>
      <StudentDetailContent />
    </Suspense>
  );
}
