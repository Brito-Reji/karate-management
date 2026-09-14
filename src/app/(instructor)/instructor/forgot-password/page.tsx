'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePortalHref, usePortalPath } from '@/hooks/usePortalRouting';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const loginHref = usePortalHref('instructor', '/login');
  const resetPasswordPath = usePortalPath('instructor', '/reset-password');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/instructor/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (data.success) {
        router.push(`${resetPasswordPath}?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      } else {
        setError(data.message || 'Failed to send reset code');
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

      <div className="w-full max-w-[440px] z-10">
        <div className="text-center mb-8 sm:mb-10">
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-zinc-500 block mb-3">
            Instructor Portal
          </span>
          <h1 className="text-xl sm:text-3xl font-light tracking-tight text-zinc-100 px-2">
            Forgot Password
          </h1>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.7)]">
          <p className="text-sm text-zinc-400 leading-relaxed mb-6 text-center">
            Enter your email address and we&apos;ll send you a code to reset your password.
          </p>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-xs text-red-400 text-center tracking-wide">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-zinc-400 tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="instructor@martinskarate.com"
                className="w-full h-11 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-medium rounded-lg transition-all active:scale-[0.99] flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Send Reset Code'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-500 mt-6">
            Remember your password?{' '}
            <Link href={loginHref} className="text-zinc-300 hover:text-white transition-colors">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
