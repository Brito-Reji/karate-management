import { headers } from 'next/headers';
import { PortalHostProvider } from '@/components/PortalHostProvider';

export default async function AdminPortalGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get('host') ?? '';
  return <PortalHostProvider host={host}>{children}</PortalHostProvider>;
}
