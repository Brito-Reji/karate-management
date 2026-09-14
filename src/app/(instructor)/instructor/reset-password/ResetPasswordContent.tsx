'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import PasswordInput from '@/components/PasswordInput';
import { usePortalHref, usePortalPath } from '@/hooks/usePortalRouting';

export default function ResetPasswordContent() {
  const router = useRouter();
  const forgotPasswordPath = usePortalPath('instructor', '/forgot-password');
  const loginHref = usePortalHref('instructor', '/login');
  const searchParams = useSearchParams();
  const email = searchParams.get('email')?.trim().toLowerCase() ?? '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpValue = otp.join('');

  useEffect(() => {
    if (!email) {
      router.replace(forgotPasswordPath);
    }
  }, [email, router, forgotPasswordPath]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otpValue.length !== 6) {
      setError('Enter the full 6-digit code');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/instructor/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp: otpValue,
          password,
          confirmPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Password reset failed');
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
      const res = await fetch('/api/instructor/forgot-password/resend', {
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
            <h1 className="text-lg font-medium text-zinc-100 mb-2">Password Reset</h1>
            <p className="text-sm text-zinc-400 leading-relaxed mb-6">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Link
              href={loginHref}
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
            Password Reset
          </span>
          <h1 className="text-xl sm:text-2xl font-light tracking-tight text-zinc-100 px-2">
            Set a new password
          </h1>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.7)]">
          <div className="text-center mb-6">
            <p className="text-sm text-zinc-400 leading-relaxed">
              Enter the 6-digit code sent to
            </p>
            <p className="text-sm font-medium text-zinc-200 mt-1 break-all">{email}</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-950/20 border border-red-500/20 text-xs text-red-400 text-center tracking-wide">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 tracking-wide block text-center">
                Reset code
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

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-medium text-zinc-400 tracking-wide">
                New Password
              </label>
              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-medium text-zinc-400 tracking-wide">
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError('');
                }}
                disabled={loading}
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpValue.length !== 6}
              className="w-full h-11 bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-medium rounded-lg transition-all active:scale-[0.99] flex items-center justify-center disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Reset Password'
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
            <Link href={forgotPasswordPath} className="text-zinc-300 hover:text-white transition-colors">
              Go back
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
