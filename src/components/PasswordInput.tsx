'use client';

import React, { useState } from 'react';

type PasswordInputProps = {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  minLength?: number;
};

export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = '••••••••',
  disabled = false,
  required = false,
  minLength,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword((v) => !v);
  };

  return (
    <div className="flex h-11 items-stretch rounded-lg bg-zinc-900/50 border border-zinc-800 focus-within:border-zinc-500 transition-all has-[:disabled]:opacity-50">
      <input
        key={showPassword ? 'text' : 'password'}
        type={showPassword ? 'text' : 'password'}
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        minLength={minLength}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 min-w-0 h-full px-4 bg-transparent border-0 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none disabled:cursor-not-allowed"
      />
      <button
        type="button"
        onPointerDown={togglePasswordVisibility}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        disabled={disabled}
        className="shrink-0 w-11 flex items-center justify-center text-zinc-500 active:text-zinc-300 touch-manipulation disabled:pointer-events-none"
      >
        {showPassword ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}
