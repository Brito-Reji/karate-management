import { redirect } from 'next/navigation';
import { portalHref } from '@/lib/portalRouting';

export default function RootPage() {
  redirect(portalHref('admin', '/login'));
}
