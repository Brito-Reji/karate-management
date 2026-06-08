'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Escape Hatch: If the current route is the login page, bypass the sidebar shell completely
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const navItems = [
    { label: 'Overview', path: '/admin', icon: 'M4 6h16M4 12h16M4 18h7' },
    { label: 'Students Roster', path: '/admin/students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { label: 'Payments', path: '/admin/payments', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1M4.44 5.44a2 2 0 012.83 0L12 10.12l4.73-4.69a2 2 0 112.83 2.83L14.83 13l4.73 4.69a2 2 0 11-2.83 2.83L12 15.88l-4.73 4.69a2 2 0 11-2.83-2.83L9.17 13 4.44 8.27a2 2 0 010-2.83z' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex antialiased">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-950 border-r border-white/[0.06] h-screen sticky top-0 shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
          <div className="flex flex-col">
            <span className="text-sm font-medium tracking-tight text-zinc-200">Martins Academy</span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">HQ Control</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <a
                key={item.label}
                href={item.path}
                className={`flex items-center space-x-3 px-4 h-11 rounded-lg text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-white/[0.04] text-white border border-white/[0.06]' 
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.01]'
                }`}
              >
                <svg className={`w-4 h-4 ${isActive ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <aside className={`fixed top-0 bottom-0 left-0 w-72 bg-zinc-950 border-r border-white/[0.06] z-50 transform transition-transform duration-300 lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/[0.06]">
          <span className="text-sm font-medium tracking-tight text-zinc-200">Martins Karate</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-400 hover:text-zinc-200">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <a key={item.label} href={item.path} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 h-11 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]">
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* WORKSPACE CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="h-16 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-md sticky top-0 px-4 sm:px-6 lg:px-8 flex items-center justify-between z-10">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-zinc-400 hover:text-zinc-200 lg:hidden">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center space-x-2 bg-white/[0.02] border border-white/[0.06] px-3 py-1.5 rounded-full text-[11px] text-zinc-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Systems Active</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-zinc-950/40">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>

    </div>
  );
}