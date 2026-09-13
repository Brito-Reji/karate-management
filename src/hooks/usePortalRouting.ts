'use client';

import { usePortalHost } from '@/components/PortalHostProvider';
import { portalHref, portalPath } from '@/lib/portalRouting';
import type { PortalId } from '@/lib/portals';

export function usePortalPath(portal: PortalId, segment: string): string {
  const host = usePortalHost();
  return portalPath(portal, segment, host);
}

export function usePortalHref(portal: PortalId, segment: string): string {
  const host = usePortalHost();
  return portalHref(portal, segment, host);
}
