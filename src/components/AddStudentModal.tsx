'use client';

import React, { useState, useEffect } from 'react';
import { useCreateStudent } from '@/hooks/useStudents';
import { BELTS } from '@/lib/constants';
import SearchableSelect from '@/components/SearchableSelect';
import DojoSelect from '@/components/DojoSelect';
import type { DojoDropdownOption, Student } from '@/queries/studentQueries';

type DojoSelectOption = { value: string; label: string };

function buildDojoOptions(dojos: DojoDropdownOption[]): DojoSelectOption[] {
  return dojos.map((dojo) => {
    const instructor =
      dojo.instructors && dojo.instructors.length > 0
        ? dojo.instructors.join(', ')
        : dojo.instructor;
    const base = dojo.location || dojo.name;
    const label = instructor ? `${base} · ${instructor}` : base;
    return { value: dojo._id, label };
  });
}

const beltOptions = BELTS.map((b) => ({
  value: b.name,
  label: b.name,
  dotColor: b.color,
}));

const emptyForm = {
  name: '',
  dojoId: '',
  belt: 'White',
  phoneNumber: '',
  gender: '',
  dob: '',
};

type AddStudentModalProps = {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  dojos: DojoDropdownOption[];
  onCreated?: (student: Student) => void;
  requireDojo?: boolean;
};

export default function AddStudentModal({
  open,
  onClose,
  initialName = '',
  dojos,
  onCreated,
  requireDojo = false,
}: AddStudentModalProps) {
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const createStudent = useCreateStudent();

  useEffect(() => {
    if (open) {
      const defaultDojoId = requireDojo && dojos.length === 1 ? dojos[0]._id : '';
      setFormData({ ...emptyForm, name: initialName, dojoId: defaultDojoId });
      setFormError('');
    }
  }, [open, initialName, requireDojo, dojos]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    if (requireDojo && !formData.dojoId) {
      setFormError('Please select a dojo for this student.');
      return;
    }
    setFormError('');

    const payload = {
      name: formData.name,
      belt: formData.belt,
      dojoId: formData.dojoId || undefined,
      phoneNumber: formData.phoneNumber.trim() || undefined,
      gender: (formData.gender as 'Male' | 'Female' | 'Other' | undefined) || undefined,
      dob: formData.dob || undefined,
    };

    createStudent.mutate(payload, {
      onSuccess: (student) => {
        onCreated?.(student);
        onClose();
      },
      onError: (err) => setFormError(err.message),
    });
  };

  if (!open) return null;

  const dojoOptions = buildDojoOptions(dojos);

  return (
    <div className="fixed inset-0 w-full h-full flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fadeIn overflow-y-auto sm:overflow-visible">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="w-full sm:max-w-md bg-zinc-950 border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 sm:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.8)] z-10 relative sm:max-h-[92dvh] sm:overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="mb-6">
          <h2 className="text-base font-medium text-zinc-100 tracking-tight">Add New Student</h2>
          <p className="text-xs text-zinc-500 mt-1">
            {requireDojo
              ? 'Enroll a new student into one of your assigned dojos.'
              : 'Enroll a new student into the academy.'}
          </p>
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
              placeholder="e.g., Arun Kumar"
              className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
            />
          </div>

          <DojoSelect
            label={requireDojo ? 'Dojo Branch (required)' : 'Dojo Branch'}
            value={formData.dojoId}
            onChange={(val) => setFormData({ ...formData, dojoId: val })}
            options={dojoOptions}
            placeholder={requireDojo ? 'Select your dojo...' : 'Select a dojo...'}
          />

          <SearchableSelect
            label="Starting Belt"
            value={formData.belt}
            onChange={(val) => setFormData({ ...formData, belt: val })}
            options={beltOptions}
            placeholder="Select a belt..."
          />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 tracking-wide">Phone Number (optional)</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="e.g., 9876543210"
              className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900 transition-all"
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
                <option value="" className="bg-zinc-900">
                  Select...
                </option>
                <option value="Male" className="bg-zinc-900">
                  Male
                </option>
                <option value="Female" className="bg-zinc-900">
                  Female
                </option>
                <option value="Other" className="bg-zinc-900">
                  Other
                </option>
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

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStudent.isPending}
              className="h-10 px-5 bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {createStudent.isPending ? 'Saving…' : 'Enroll Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
