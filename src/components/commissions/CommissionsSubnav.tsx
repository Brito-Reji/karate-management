'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePortalPath } from '@/hooks/usePortalRouting';

export default function CommissionsSubnav() {
  const pathname = usePathname();
  const dashboardPath = usePortalPath('admin', '/commissions');
  const settingsPath = usePortalPath('admin', '/commissions/settings');

  const tabs = [
    { label: 'Dashboard', href: dashboardPath },
    { label: 'Fee settings', href: settingsPath },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active =
          tab.href === dashboardPath
            ? pathname === dashboardPath
            : pathname.startsWith(settingsPath);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              active
                ? 'bg-white/[0.06] border-white/[0.10] text-zinc-100'
                : 'bg-white/[0.02] border-white/[0.06] text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
