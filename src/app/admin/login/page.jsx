'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
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
        // Drop them cleanly into the root admin path (/admin/page.js)
        router.push('/admin');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection to security protocol failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-zinc-950 px-4 select-none overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] z-10">
        <div className="text-center mb-10">
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-zinc-500 block mb-3">
            Administrative Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-100">
            Martins Karate Academy
          </h1>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 sm:p-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.7)]">
          
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
                placeholder="admin@martinskarate.com"
                className="w-full h-11 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 disabled:opacity-50 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-medium text-zinc-400 tracking-wide">
                  Password
                </label>
                <a href="#forgot" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                required
                disabled={loading}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
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
                'Access Dashboard'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}