'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Escape Hatch: If the admin is logging in, don't show any sidebar at all
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Pure, stripped-down navigation matching your exact request
  const navItems = [
    { label: 'Dojos', path: '/admin/dojos', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { label: 'Students', path: '/admin/students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { label: 'Tests', path: '/admin/tests', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex antialiased">
      
      {/* 1. DESKTOP LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-950 border-r border-white/[0.06] h-screen sticky top-0 shrink-0 z-20">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
          <div className="flex flex-col">
            <span className="text-sm font-medium tracking-tight text-zinc-200">Martins Academy</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">Management Portal</span>
          </div>
        </div>

        {/* Clean, Focused Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`flex items-center space-x-3 px-4 h-11 rounded-lg text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-white/[0.04] text-white border border-white/[0.06]' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.01]'
                }`}
              >
                <svg 
                  className={`w-4 h-4 ${isActive ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-400'}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Minimalist Admin Profile Row */}
        <div className="p-4 border-t border-white/[0.06] bg-zinc-900/10">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-zinc-300">Sensei Martin</span>
              <span className="text-[10px] text-zinc-500">Administrator</span>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
              className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE LEFT SIDEBAR DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      <aside className={`fixed top-0 bottom-0 left-0 w-72 bg-zinc-950 border-r border-white/[0.06] z-50 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06]">
          <span className="text-sm font-medium tracking-tight text-zinc-200">Martins Karate</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-zinc-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 h-11 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
            >
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => { setShowLogoutConfirm(true); setIsMobileMenuOpen(false); }}
            className="flex items-center space-x-3 px-4 h-11 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-950/10 transition-all w-full"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* 3. MAIN CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="h-16 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md sticky top-0 px-4 sm:px-6 lg:px-8 flex items-center justify-between z-10">
          <button 
            onClick={() => setIsMobileMenuOpen(true)} 
            className="p-2 -ml-2 text-zinc-400 hover:text-zinc-200 lg:hidden"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>

          <div className="flex items-center space-x-2 bg-white/[0.02] border border-white/[0.06] px-3 py-1.5 rounded-full text-[11px] text-zinc-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>HQ Systems Connected</span>
          </div>
        </header>

        {/* Child Pages (Dojo lists, student grid, etc.) render here */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-zinc-950/40">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm bg-zinc-950 border border-white/[0.08] rounded-2xl p-6 shadow-[0_32px_64px_rgba(0,0,0,0.8)]">
            <h2 className="text-sm font-medium text-zinc-100">Sign out?</h2>
            <p className="text-xs text-zinc-500 mt-1 mb-6">You will be redirected to the login page.</p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="h-9 px-4 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="h-9 px-5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-all active:scale-[0.98]"
              >
                Yes, sign out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}