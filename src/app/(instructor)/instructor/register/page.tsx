'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PasswordInput from '@/components/PasswordInput';
import ImageUploadField from '@/components/ImageUploadField';
import { usePortalHref, usePortalPath } from '@/hooks/usePortalRouting';

type DojoOption = {
  _id: string;
  dojoId: string;
  name: string;
  location: string;
};

export default function InstructorRegisterPage() {
  const router = useRouter();
  const verifyEmailPath = usePortalPath('instructor', '/register/verify-email');
  const loginHref = usePortalHref('instructor', '/login');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedDojoIds, setSelectedDojoIds] = useState<string[]>([]);
  const [avatar, setAvatar] = useState<{ url: string; publicId?: string } | null>(null);
  const [bio, setBio] = useState('');
  const [dojoSearch, setDojoSearch] = useState('');
  const [dojos, setDojos] = useState<DojoOption[]>([]);
  const [loadingDojos, setLoadingDojos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDojos = async () => {
      try {
        const res = await fetch('/api/dojos');
        if (!res.ok) throw new Error('Failed to load dojos');
        const data = await res.json();
        setDojos(Array.isArray(data) ? data : []);
      } catch {
        setError('Could not load dojos. Please refresh and try again.');
      } finally {
        setLoadingDojos(false);
      }
    };
    loadDojos();
  }, []);

  const filteredDojos = useMemo(() => {
    const query = dojoSearch.trim().toLowerCase();
    if (!query) return dojos;

    return dojos.filter((dojo) => {
      const haystack = [dojo.name, dojo.dojoId, dojo.location]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [dojos, dojoSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const toggleDojo = (dojoId: string) => {
    setSelectedDojoIds((prev) =>
      prev.includes(dojoId)
        ? prev.filter((id) => id !== dojoId)
        : [...prev, dojoId]
    );
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (selectedDojoIds.length === 0) {
      setError('Select at least one dojo');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register/instructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          dojoIds: selectedDojoIds,
          avatarUrl: avatar?.url,
          avatarPublicId: avatar?.publicId,
          bio: bio.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success && data.requiresVerification) {
        router.push(
          `${verifyEmailPath}?email=${encodeURIComponent(data.email || formData.email)}`
        );
      } else if (data.success) {
        router.push(
          `${verifyEmailPath}?email=${encodeURIComponent(formData.email)}`
        );
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full flex items-center justify-center bg-zinc-950 px-4 py-8 sm:py-12 overflow-x-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(500px,90vw)] h-[min(500px,90vw)] bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[480px] z-10">
        <div className="text-center mb-8 sm:mb-10">
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-zinc-500 block mb-3">
            Instructor Registration
          </span>
          <h1 className="text-xl sm:text-3xl font-light tracking-tight text-zinc-100 px-2">
            Martins Karate Academy
          </h1>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.7)]">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-xs text-red-400 text-center tracking-wide">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <ImageUploadField
              label="Profile photo (optional)"
              folder="karate/instructors"
              signEndpoint="/api/register/instructor/cloudinary-sign"
              value={avatar}
              onChange={(result) =>
                setAvatar(result ? { url: result.secureUrl, publicId: result.publicId } : null)
              }
              disabled={loading}
            />

            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-medium text-zinc-400 tracking-wide">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                disabled={loading}
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full h-11 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-xs font-medium text-zinc-400 tracking-wide">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                disabled={loading}
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="w-full h-11 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-zinc-400 tracking-wide">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                disabled={loading}
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full h-11 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="bio" className="text-xs font-medium text-zinc-400 tracking-wide">
                Bio (optional)
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={loading}
                rows={3}
                maxLength={500}
                placeholder="Brief intro for admin review…"
                className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-zinc-400 tracking-wide">
                Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                required
                minLength={8}
                disabled={loading}
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-medium text-zinc-400 tracking-wide">
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={8}
                disabled={loading}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 tracking-wide">
                Dojos You Teach At
              </label>
              <p className="text-[11px] text-zinc-600">Select all dojos you belong to</p>

              {!loadingDojos && dojos.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={dojoSearch}
                    onChange={(e) => setDojoSearch(e.target.value)}
                    disabled={loading}
                    placeholder="Search by name, ID, or location..."
                    className="w-full h-9 pl-9 pr-14 rounded-lg bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50 transition-all"
                  />
                  {dojoSearch && (
                    <button
                      type="button"
                      onClick={() => setDojoSearch('')}
                      className="absolute inset-y-0 right-0 pr-3 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}

              {loadingDojos ? (
                <div className="space-y-2 animate-pulse">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-zinc-900/50 border border-zinc-800" />
                  ))}
                </div>
              ) : dojos.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3 text-center border border-zinc-800 rounded-lg">
                  No dojos available yet.
                </p>
              ) : filteredDojos.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3 text-center border border-zinc-800 rounded-lg">
                  No dojos match your search.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/30 p-2">
                  {filteredDojos.map((dojo) => {
                    const isSelected = selectedDojoIds.includes(dojo._id);
                    return (
                      <button
                        key={dojo._id}
                        type="button"
                        disabled={loading}
                        onClick={() => toggleDojo(dojo._id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-zinc-600'
                        } disabled:opacity-50`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-zinc-600'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-2.5 h-2.5 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{dojo.name}</p>
                            <p className="text-[11px] text-zinc-500 truncate">
                              {dojo.dojoId} · {dojo.location}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || loadingDojos}
              className="w-full h-11 bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-medium rounded-lg transition-all active:scale-[0.99] flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Submit Application'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-500 mt-6">
            Already have an account?{' '}
            <Link href={loginHref} className="text-zinc-300 hover:text-white transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
