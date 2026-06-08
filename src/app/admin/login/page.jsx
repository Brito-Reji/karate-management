'use client';

import React, { useState } from 'react';

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    identifier: '', // Handles both email or phone number dynamically
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle secure authentication logic here
    console.log('Authenticating admin...', formData);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-zinc-950 bg-radial-gradient px-4 sm:px-6 lg:px-8 select-none overflow-hidden">
      
      {/* Background Decorative Element: Subtle, non-intrusive lens flare for the glassy aesthetic */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] z-10">
        {/* Branding Area */}
        <div className="text-center mb-10">
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-zinc-500 block mb-3">
            Administrative Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-zinc-100 font-sans">
            Martins Karate Academy
          </h1>
        </div>

        {/* Premium Glassmorphism Card */}
        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-8 sm:p-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.7)] transition-all duration-500">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Field: Identifier (Email/Phone) */}
            <div className="space-y-1.5">
              <label htmlFor="identifier" className="text-xs font-medium text-zinc-400 tracking-wide">
                Email or Phone Number
              </label>
              <input
                type="text"
                id="identifier"
                name="identifier"
                required
                value={formData.identifier}
                onChange={handleChange}
                placeholder="admin@martinskarate.com"
                className="w-full h-11 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900/80 focus:ring-1 focus:ring-zinc-500/20 transition-all duration-200 ease-in-out"
              />
            </div>

            {/* Field: Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs font-medium text-zinc-400 tracking-wide">
                  Password
                </label>
                <a 
                  href="#forgot-password" 
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150 ease-in-out font-medium"
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-lg bg-zinc-900/50 border border-zinc-800 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:bg-zinc-900/80 focus:ring-1 focus:ring-zinc-500/20 transition-all duration-200 ease-in-out"
              />
            </div>

            {/* Remember Me Toggle */}
            <div className="flex items-center">
              <label className="relative flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 rounded bg-zinc-900 border border-zinc-800 peer-checked:bg-zinc-100 peer-checked:border-zinc-100 transition-all duration-150 flex items-center justify-center">
                  {rememberMe && (
                    <svg className="w-2.5 h-2.5 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="ml-2 text-xs text-zinc-400 font-medium">Keep me signed in</span>
              </label>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full h-11 bg-zinc-100 hover:bg-white active:scale-[0.99] text-zinc-950 text-sm font-medium rounded-lg shadow-sm transition-all duration-150 ease-out flex items-center justify-center mt-2"
            >
              Access Dashboard
            </button>
            
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-zinc-600 mt-8 tracking-wide">
          Authorized personnel only. Secure connection monitored.
        </p>
      </div>
    </div>
  );
}