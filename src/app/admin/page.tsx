'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setRole(data.user.role);
      })
      .catch(() => {});
  }, []);

  const sections = [
    {
      label: 'Dojo Branches',
      desc: 'Manage physical training locations and instructors.',
      href: '/admin/dojos',
    },
    {
      label: 'Students',
      desc: 'View and manage enrolled student records.',
      href: '/admin/students',
    },
    ...(role === 'admin'
      ? [
          {
            label: 'Belt Tests',
            desc: 'Record belt promotions and view progression history.',
            href: '/admin/tests',
          },
        ]
      : []),
    ...(role === 'admin'
      ? [
          {
            label: 'Staff',
            desc: 'Add admins and instructors who can manage the portal.',
            href: '/admin/staff',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5 sm:space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-lg sm:text-xl font-light tracking-tight text-zinc-100">Academy Registries</h1>
        <p className="text-xs text-zinc-500 mt-1">Direct access control for Martins Karate Academy.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {sections.map((s) => (
          <button
            key={s.href}
            onClick={() => router.push(s.href)}
            className="text-left p-5 sm:p-6 bg-white/[0.02] border border-white/[0.06] rounded-xl hover:bg-white/[0.04] hover:border-white/[0.10] transition-all group active:scale-[0.99]"
          >
            <h2 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{s.label}</h2>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{s.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
