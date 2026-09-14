'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { getCroppedImageFile } from '@/lib/cropImage';

type ImageCropModalProps = {
  open: boolean;
  imageSrc: string | null;
  aspect: number;
  title?: string;
  onClose: () => void;
  onConfirm: (file: File) => void;
};

export default function ImageCropModal({
  open,
  imageSrc,
  aspect,
  title = 'Crop photo',
  onClose,
  onConfirm,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setProcessing(false);
    setError('');
  }, [open, imageSrc]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setProcessing(true);
    setError('');
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels);
      onConfirm(file);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to crop image');
    } finally {
      setProcessing(false);
    }
  };

  if (!open || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-xl bg-zinc-950 border border-white/[0.08] rounded-t-2xl sm:rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.8)] overflow-hidden pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-medium text-zinc-100">{title}</h2>
          <p className="text-xs text-zinc-500 mt-1">Drag to reposition · scroll or pinch to zoom</p>
        </div>

        <div className="relative h-[min(60dvh,420px)] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={aspect === 1 ? 'round' : 'rect'}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              Zoom
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-zinc-200"
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-400">{error}</p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="h-10 px-4 text-xs font-medium text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={processing || !croppedAreaPixels}
              className="h-10 px-5 bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
            >
              {processing ? 'Processing…' : 'Use photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
