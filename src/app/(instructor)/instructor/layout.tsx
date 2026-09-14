'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { meQuery } from '@/queries/authQueries';
import { matchesPortalPath } from '@/lib/portalRouting';
import { usePortalHost } from '@/components/PortalHostProvider';
import { usePortalPath } from '@/hooks/usePortalRouting';

const PUBLIC_PATHS = ['/login', '/register'];

export default function InstructorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const signingOutRef = useRef(false);
  const host = usePortalHost();
  const loginPath = usePortalPath('instructor', '/login');
  const dojosPath = usePortalPath('instructor', '/dojos');
  const studentsPath = usePortalPath('instructor', '/students');
  const profilePath = usePortalPath('instructor', '/profile');

  const isPublicPage = PUBLIC_PATHS.some((segment) =>
    matchesPortalPath(pathname, 'instructor', segment, host)
  );

  const { data: currentUser, isError: meError } = useQuery({
    ...meQuery,
    enabled: !isPublicPage,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isPublicPage || !meError || signingOutRef.current) return;
    signingOutRef.current = true;

    void (async () => {
      try {
        await fetch('/api/admin/logout', { method: 'POST' });
      } finally {
        queryClient.removeQueries({ queryKey: meQuery.queryKey });
        router.replace(loginPath);
      }
    })();
  }, [meError, isPublicPage, pathname, queryClient, router, loginPath]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    queryClient.removeQueries({ queryKey: meQuery.queryKey });
    router.push(loginPath);
  };

  if (isPublicPage) {
    return <>{children}</>;
  }

  const pageTitle =
    matchesPortalPath(pathname, 'instructor', '/students', host)
      ? 'Students'
      : matchesPortalPath(pathname, 'instructor', '/profile', host)
        ? 'Profile'
      : matchesPortalPath(pathname, 'instructor', '/dojos', host)
        ? 'My Dojos'
        : 'Portal';

  const navItems = [
    {
      label: 'My Dojos',
      path: dojosPath,
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    },
    {
      label: 'Students',
      path: studentsPath,
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      label: 'Profile',
      path: profilePath,
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
  ];

  return (
    <div className="h-screen min-h-[100dvh] bg-zinc-950 text-zinc-100 font-sans flex antialiased overflow-hidden">
      <aside className="hidden lg:flex flex-col w-64 bg-zinc-950 border-r border-white/[0.06] fixed inset-y-0 left-0 z-20 overflow-hidden">
        <div className="h-16 flex items-center px-6 border-b border-white/[0.06]">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium tracking-tight text-zinc-200 truncate">
              Martins Academy
            </span>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
              Instructor Portal
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-hidden">
          {navItems.map((item) => {
            const isActive =
              pathname === item.path || pathname.startsWith(`${item.path}/`);
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
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-200' : 'text-zinc-500 group-hover:text-zinc-400'}`}
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

        <div className="p-4 border-t border-white/[0.06] bg-zinc-900/10">
          <div className="flex items-center justify-between gap-2 px-2">
            <Link href={profilePath} className="flex items-center gap-2 min-w-0 group">
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/[0.06] overflow-hidden shrink-0 flex items-center justify-center">
                {currentUser?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-medium text-zinc-500">
                    {(currentUser?.name || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-zinc-300 truncate group-hover:text-white transition-colors">
                  {currentUser?.name || '—'}
                </span>
                <span className="text-[10px] text-zinc-500 capitalize">Instructor</span>
              </div>
            </Link>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
              className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-[min(18rem,85vw)] max-w-xs bg-zinc-950 border-r border-white/[0.06] z-50 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="h-14 sm:h-16 flex items-center justify-between px-5 border-b border-white/[0.06]">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium tracking-tight text-zinc-200 truncate">
              Martins Academy
            </span>
            <span className="text-[10px] text-zinc-500 truncate">
              {currentUser?.name || 'Instructor Portal'}
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 -mr-1 text-zinc-400 hover:text-zinc-200"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.path || pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.label}
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-4 h-11 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/[0.04] text-white border border-white/[0.06]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                }`}
              >
                <svg
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-zinc-200' : 'text-zinc-500'}`}
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
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={() => {
              setShowLogoutConfirm(true);
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center space-x-3 px-4 h-11 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-950/10 transition-all w-full"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen min-h-[100dvh] lg:ml-64 overflow-hidden">
        <header
          className="h-14 sm:h-16 border-b border-white/[0.06] bg-zinc-950/90 backdrop-blur-md sticky top-0 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 z-10"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-1 text-zinc-400 hover:text-zinc-200 lg:hidden shrink-0"
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="lg:hidden min-w-0">
              <p className="text-sm font-medium text-zinc-200 truncate">{pageTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center space-x-2 bg-white/[0.02] border border-white/[0.06] px-3 py-1.5 rounded-full text-[11px] text-zinc-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Connected</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-6 lg:p-8 bg-zinc-950/40 overflow-y-auto overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full min-w-0">{children}</div>
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="relative w-full sm:max-w-sm bg-zinc-950 border border-white/[0.08] rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-[0_32px_64px_rgba(0,0,0,0.8)] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <h2 className="text-sm font-medium text-zinc-100">Sign out?</h2>
            <p className="text-xs text-zinc-500 mt-1 mb-6">
              You will be redirected to the login page.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="h-10 px-4 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="h-10 px-5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg transition-all active:scale-[0.98]"
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
