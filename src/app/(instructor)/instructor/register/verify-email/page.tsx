'use client';

import React, { Suspense } from 'react';
import VerifyEmailContent from './VerifyEmailContent';

function VerifyEmailFallback() {
  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full flex items-center justify-center bg-zinc-950">
      <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
