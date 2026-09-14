'use client';

import React, { useEffect, useState } from 'react';
import ImageUploadField from '@/components/ImageUploadField';
import { submitChangeRequest, fetchChangeRequests } from '@/queries/changeRequestQueries';

type ProfileData = {
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
};

export default function InstructorProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bio: '',
  });
  const [avatar, setAvatar] = useState<{ url: string; publicId?: string } | null>(null);
  const [pendingProfile, setPendingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, pending] = await Promise.all([
          fetch('/api/instructor/profile'),
          fetchChangeRequests(),
        ]);

        const profileJson = await profileRes.json();
        if (!profileRes.ok || !profileJson.success) {
          throw new Error(profileJson.message || 'Failed to load profile');
        }

        const data = profileJson.profile as ProfileData;
        setProfile(data);
        setFormData({
          name: data.name ?? '',
          phone: data.phone ?? '',
          bio: data.bio ?? '',
        });
        if (data.avatarUrl) {
          setAvatar({ url: data.avatarUrl, publicId: data.avatarPublicId });
        }

        setPendingProfile(
          pending.some((request) => request.type === 'profile_update')
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload: Record<string, string | undefined> = {};

      if (formData.name.trim() && formData.name.trim() !== profile?.name) {
        payload.name = formData.name.trim();
      }
      if (formData.phone.trim() && formData.phone.trim() !== profile?.phone) {
        payload.phone = formData.phone.trim();
      }
      if (formData.bio.trim() !== (profile?.bio ?? '')) {
        payload.bio = formData.bio.trim();
      }
      if (avatar?.url && avatar.url !== profile?.avatarUrl) {
        payload.avatarUrl = avatar.url;
        payload.avatarPublicId = avatar.publicId;
      }

      if (Object.keys(payload).length === 0) {
        setError('No changes to submit for approval.');
        return;
      }

      await submitChangeRequest({ type: 'profile_update', payload });
      setPendingProfile(true);
      setSuccess('Your profile changes were sent to admin for approval.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit changes');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.03] rounded" />
        <div className="h-64 bg-white/[0.03] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <div className="border-b border-white/[0.04] pb-6">
        <h1 className="text-xl font-light tracking-tight text-zinc-100">My Profile</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Update your photo and details. Changes require admin approval before they go live.
        </p>
      </div>

      {pendingProfile && (
        <div className="text-xs text-amber-400 bg-amber-950/20 border border-amber-500/20 rounded-lg px-4 py-3">
          You have a profile update waiting for admin approval.
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {success && (
        <div className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded-lg px-4 py-3">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 sm:p-6 space-y-5 shadow-xl"
      >
        <ImageUploadField
          label="Profile photo"
          folder="karate/instructors"
          value={avatar}
          onChange={(result) =>
            setAvatar(result ? { url: result.secureUrl, publicId: result.publicId } : null)
          }
          disabled={submitting}
        />

        <div className="space-y-2">
          <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            value={profile?.email ?? ''}
            disabled
            className="w-full h-10 px-4 rounded-lg bg-zinc-900/30 border border-zinc-800 text-sm text-zinc-500 cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Full name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            className="w-full h-10 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
            rows={4}
            maxLength={500}
            placeholder="A short intro about your teaching experience…"
            className="w-full px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
          />
          <p className="text-[10px] text-zinc-600 text-right">{formData.bio.length}/500</p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="h-10 px-5 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit for approval'}
          </button>
        </div>
      </form>
    </div>
  );
}
