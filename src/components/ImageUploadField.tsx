'use client';

import React, { useEffect, useRef, useState } from 'react';
import ImageCropModal from '@/components/ImageCropModal';
import {
  uploadImageToCloudinary,
  validateImageFile,
  type CloudinaryUploadFolder,
  type CloudinaryUploadResult,
} from '@/lib/cloudinaryUploadClient';

type ImageUploadFieldProps = {
  label: string;
  folder: CloudinaryUploadFolder;
  value?: { url: string; publicId?: string } | null;
  onChange: (value: CloudinaryUploadResult | null) => void;
  disabled?: boolean;
  aspect?: 'square' | 'wide';
  signEndpoint?: string;
};

const ASPECT_MAP = {
  square: 1,
  wide: 16 / 9,
} as const;

export default function ImageUploadField({
  label,
  folder,
  value,
  onChange,
  disabled = false,
  aspect = 'square',
  signEndpoint,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [pendingFileName, setPendingFileName] = useState('photo.jpg');

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const closeCropper = () => {
    setCropOpen(false);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const result = await uploadImageToCloudinary(file, folder, signEndpoint);
      onChange(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file || disabled) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setError('');
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    const objectUrl = URL.createObjectURL(file);
    setCropSrc(objectUrl);
    setPendingFileName(file.name);
    setCropOpen(true);
  };

  const handleCropConfirm = async (file: File) => {
    closeCropper();
    const namedFile = new File([file], pendingFileName.replace(/\.\w+$/, '.jpg'), {
      type: file.type,
    });
    await uploadFile(namedFile);
  };

  const previewClass =
    aspect === 'wide'
      ? 'w-full aspect-[16/9] rounded-lg'
      : 'w-24 h-24 rounded-full';

  return (
    <>
      <div className="space-y-2">
        <label className="block text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          {label}
        </label>
        <div className="flex items-start gap-4">
          <div
            className={`${previewClass} bg-zinc-900/50 border border-white/[0.06] overflow-hidden shrink-0 flex items-center justify-center`}
          >
            {value?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <svg
                className="w-8 h-8 text-zinc-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>
          <div className="flex flex-col gap-2 min-w-0">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              disabled={disabled || uploading}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => inputRef.current?.click()}
              className="h-9 px-4 text-xs font-medium rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300 disabled:opacity-40 transition-all"
            >
              {uploading ? 'Uploading…' : value?.url ? 'Change photo' : 'Upload photo'}
            </button>
            {value?.url && (
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => onChange(null)}
                className="text-[11px] text-zinc-500 hover:text-red-400 text-left transition-colors disabled:opacity-40"
              >
                Remove photo
              </button>
            )}
            <p className="text-[10px] text-zinc-600">
              JPEG, PNG, WebP or GIF · max 5 MB · crop before upload
            </p>
          </div>
        </div>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </div>

      <ImageCropModal
        open={cropOpen}
        imageSrc={cropSrc}
        aspect={ASPECT_MAP[aspect]}
        title={aspect === 'wide' ? 'Crop cover photo' : 'Crop profile photo'}
        onClose={closeCropper}
        onConfirm={(file) => void handleCropConfirm(file)}
      />
    </>
  );
}
