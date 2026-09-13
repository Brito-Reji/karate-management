'use client';

import { createContext, useContext } from 'react';

const PortalHostContext = createContext<string | undefined>(undefined);

export function PortalHostProvider({
  host,
  children,
}: {
  host: string;
  children: React.ReactNode;
}) {
  return (
    <PortalHostContext.Provider value={host}>{children}</PortalHostContext.Provider>
  );
}

export function usePortalHost(): string | undefined {
  return useContext(PortalHostContext);
}
