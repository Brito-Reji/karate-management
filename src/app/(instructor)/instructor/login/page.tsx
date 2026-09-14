'use client';

import React, { useState } from 'react';
import { usePortalHref, usePortalPath } from '@/hooks/usePortalRouting';

export default function InstructorLogin() {
  const dojosPath = usePortalPath('instructor', '/dojos');
  const adminDojosHref = usePortalHref('admin', '/dojos');
  const registerHref = usePortalHref('instructor', '/register');
  const forgotPasswordHref = usePortalHref('instructor', '/forgot-password');
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        if (data.user?.role === 'admin') {
          window.location.assign(adminDojosHref);
        } else {
          window.location.assign(dojosPath);
        }
      } else {
        setError(data.error || data.message || 'Invalid credentials');
      }
    } catch {
      setError('Connection to security protocol failed.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword((v) => !v);
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
            Martins Karate Academy
          </h1>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.7)]">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-xs text-red-400 text-center tracking-wide">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="text-xs font-medium text-zinc-400 tracking-wide">
                Email or Phone Number
              </label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                required
                disabled={loading}
                value={formData.identifier}
                onChange={handleChange}
                placeholder="instructor@martinskarate.com"
                className="w-full h-11 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-zinc-400 tracking-wide">
                Password
              </label>
              <div className="flex h-11 items-stretch rounded-lg bg-zinc-900/50 border border-zinc-800 focus-within:border-zinc-500 transition-all has-[:disabled]:opacity-50">
                <input
                  key={showPassword ? 'text' : 'password'}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  disabled={loading}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="flex-1 min-w-0 h-full px-4 bg-transparent border-0 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onPointerDown={togglePasswordVisibility}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                  className="shrink-0 w-11 flex items-center justify-center text-zinc-500 active:text-zinc-300 touch-manipulation disabled:pointer-events-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex justify-end">
                <a
                  href={forgotPasswordHref}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-medium rounded-lg transition-all active:scale-[0.99] flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-500 mt-6">
            New instructor?{' '}
            <a href={registerHref} className="text-zinc-300 hover:text-white transition-colors">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
