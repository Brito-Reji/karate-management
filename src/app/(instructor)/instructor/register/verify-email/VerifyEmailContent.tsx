'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getGmailInboxUrl } from '@/lib/emailLinks';
import { usePortalHref, usePortalPath } from '@/hooks/usePortalRouting';

export default function VerifyEmailContent() {
  const router = useRouter();
  const registerPath = usePortalPath('instructor', '/register');
  const adminLoginHref = usePortalHref('admin', '/login');
  const searchParams = useSearchParams();
  const email = searchParams.get('email')?.trim().toLowerCase() ?? '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpValue = otp.join('');

  useEffect(() => {
    if (!email) {
      router.replace(registerPath);
    }
  }, [email, router, registerPath]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (error) setError('');

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...otp];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] ?? '';
    }
    setOtp(next);
    if (error) setError('');

    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const openGmail = useCallback(() => {
    window.open(getGmailInboxUrl(), '_blank', 'noopener,noreferrer');
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.length !== 6) {
      setError('Enter the full 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/register/instructor/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Verification failed');
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setResending(true);
    setError('');

    try {
      const res = await fetch('/api/register/instructor/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        setResendCooldown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(data.message || 'Could not resend code');
        if (data.retryAfter) {
          setResendCooldown(data.retryAfter);
        }
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  if (success) {
    return (
      <div className="relative min-h-screen min-h-[100dvh] w-full flex items-center justify-center bg-zinc-950 px-4 py-8 sm:py-12 overflow-x-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(500px,90vw)] h-[min(500px,90vw)] bg-emerald-800/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-[440px] z-10 text-center">
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.7)]">
            <div className="w-12 h-12 mx-auto mb-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-lg font-medium text-zinc-100 mb-2">Application Submitted</h1>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">
              Your email is verified and your instructor registration has been sent for admin approval.
              You will be able to log in once your account is approved.
            </p>
            <Link
              href={adminLoginHref}
              className="inline-flex h-11 items-center justify-center px-6 bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-medium rounded-lg transition-all"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full flex items-center justify-center bg-zinc-950 px-4 py-8 sm:py-12 overflow-x-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(500px,90vw)] h-[min(500px,90vw)] bg-zinc-800/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] z-10">
        <div className="text-center mb-8 sm:mb-10">
          <span className="text-[10px] font-medium tracking-[0.3em] uppercase text-zinc-500 block mb-3">
            Email Verification
          </span>
          <h1 className="text-xl sm:text-2xl font-light tracking-tight text-zinc-100 px-2">
            Check your inbox
          </h1>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.7)]">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              We sent a 6-digit code to
            </p>
            <p className="text-sm font-medium text-zinc-200 mt-1 break-all">{email}</p>
            <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
              Can&apos;t find it? Check your <span className="text-zinc-400">spam or junk folder</span> too.
            </p>
          </div>

          <button
            type="button"
            onClick={openGmail}
            className="w-full h-11 mb-6 flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-100 text-zinc-900 text-sm font-medium rounded-lg transition-all border border-zinc-200/10"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-7.545-4.91v9.273H.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.546l8.073-6.053C21.69 2.28 24 3.434 24 5.457z" />
              <path fill="#34A853" d="M12 16.64 5.455 11.73V24h13.09V11.73L12 16.64z" />
              <path fill="#4A90E2" d="M12 9.546 3.927 3.493C2.31 2.28 0 3.434 0 5.457v.09L12 16.64 24 5.547v-.09C24 3.434 21.69 2.28 20.073 3.493L12 9.546z" />
              <path fill="#FBBC05" d="M0 5.547v.09L12 16.64 24 5.637v-.09C24 3.434 21.69 2.28 20.073 3.493L12 9.546 3.927 3.493C2.31 2.28 0 3.434 0 5.547z" />
            </svg>
            Open Gmail
          </button>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-xs text-red-400 text-center tracking-wide">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 tracking-wide block text-center">
                Enter verification code
              </label>
              <div className="flex justify-center gap-2 sm:gap-2.5">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    disabled={loading}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-10 h-12 sm:w-11 sm:h-13 text-center text-lg font-mono rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-zinc-500 disabled:opacity-50 transition-all"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpValue.length !== 6}
              className="w-full h-11 bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-medium rounded-lg transition-all active:scale-[0.99] flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Verify Email'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending
                ? 'Sending...'
                : resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Didn't get the code? Resend"}
            </button>
          </div>

          <p className="text-center text-xs text-zinc-500 mt-6">
            Wrong email?{' '}
            <Link href={registerPath} className="text-zinc-300 hover:text-white transition-colors">
              Go back
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
