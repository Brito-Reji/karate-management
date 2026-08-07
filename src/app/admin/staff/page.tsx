'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RowIndexBadge from '@/components/RowIndexBadge';

type StaffUser = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'instructor';
  createdAt?: string;
};

function SkeletonRows() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
      ))}
    </div>
  );
}

export default function StaffPage() {
  const router = useRouter();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'instructor' as 'admin' | 'instructor',
  });

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users');
      const json = await res.json();
      if (res.status === 403 || res.status === 401) {
        router.replace('/admin/dojos');
        return;
      }
      if (!json.success) throw new Error(json.message || 'Failed to load staff');
      setUsers(json.users);
    } catch (err) {
      setError(err.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'instructor',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.password) {
      setFormError('Name and password are required');
      return;
    }
    if (!formData.email && !formData.phone) {
      setFormError('Email or phone is required');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to create user');
      setIsModalOpen(false);
      await loadUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-xl font-light tracking-tight text-zinc-100">Staff</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage admin and instructor accounts for the portal.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="h-10 w-full sm:w-auto px-4 bg-zinc-100 hover:bg-white active:scale-[0.98] text-zinc-950 text-xs font-medium rounded-lg transition-all flex items-center justify-center space-x-2 shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7-7H5.5" />
          </svg>
          <span>Add Staff</span>
        </button>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : error ? (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden shadow-xl">
          {users.length > 0 ? (
            <div className="divide-y divide-white/[0.04]">
              {users.map((user, index) => (
                <div
                  key={user._id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 hover:bg-white/[0.01] transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <RowIndexBadge index={index} />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1">
                        <h3 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors break-words">
                          {user.name}
                        </h3>
                        <span
                          className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full tracking-wide border capitalize ${
                            user.role === 'admin'
                              ? 'bg-zinc-100/10 border-zinc-500/30 text-zinc-200'
                              : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-zinc-500">
                        {user.email && <span className="break-all">{user.email}</span>}
                        {user.email && user.phone && <span className="text-zinc-700">•</span>}
                        {user.phone && <span className="font-mono">{user.phone}</span>}
                      </div>
                    </div>
                  </div>
                  {user.createdAt && (
                    <span className="text-[11px] text-zinc-600 font-mono shrink-0">
                      Added{' '}
                      {new Date(user.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center space-y-2">
              <p className="text-xs text-zinc-600 font-mono">No staff users found.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto sm:overflow-visible">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full sm:max-w-md bg-zinc-950 border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-[0_32px_64px_rgba(0,0,0,0.8)] sm:max-h-[92dvh] sm:overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium text-zinc-100">Add Staff Member</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-3 py-2">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Phone</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 font-mono focus:outline-none focus:border-zinc-500"
                  placeholder="9876543210"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 tracking-wide">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'instructor' })}
                    className={`h-9 text-xs font-medium rounded-lg border transition-all ${
                      formData.role === 'instructor'
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Instructor
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'admin' })}
                    className={`h-9 text-xs font-medium rounded-lg border transition-all ${
                      formData.role === 'admin'
                        ? 'bg-zinc-100/10 border-zinc-500/40 text-zinc-100'
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-10 bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? 'Creating…' : 'Create Staff Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
