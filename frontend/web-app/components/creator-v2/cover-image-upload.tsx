'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, X, Upload, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoverImageUploadProps {
  value: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
  maxSize?: number; // in MB
  disabled?: boolean;
  className?: string;
}

export function CoverImageUpload({
  value,
  onUpload,
  onRemove,
  maxSize = 5,
  disabled = false,
  className,
}: CoverImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>();

  const validateAndUpload = async (file: File) => {
    setError(undefined);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`Image must be less than ${maxSize}MB`);
      return;
    }

    // Validate dimensions (optional, could be done on server)
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    if (img.width < 800 || img.height < 400) {
      setError('Image must be at least 800x400px');
      URL.revokeObjectURL(img.src);
      return;
    }

    URL.revokeObjectURL(img.src);

    // Upload
    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await validateAndUpload(file);
      // Reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await validateAndUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all',
          isDragging && 'border-primary bg-primary/5 scale-[1.02]',
          !isDragging && !value && 'border-border hover:border-muted-foreground/30 hover:bg-muted/50',
          value && 'border-transparent p-0',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {value ? (
          // Image Preview
          <div className="relative w-full overflow-hidden rounded-xl">
            <div className="relative aspect-video w-full bg-muted">
              <img
                src={value}
                alt="Cover preview"
                className="h-full w-full object-cover"
              />
              {/* Overlay gradient for better button visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
            </div>

            {/* Actions */}
            <div className="absolute right-3 top-3 flex gap-2">
              {/* Replace Button */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  disabled={disabled || isUploading}
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-9 gap-2 shadow-lg pointer-events-none"
                  disabled={disabled || isUploading}
                >
                  <Upload className="h-4 w-4" />
                  Replace
                </Button>
              </label>

              {/* Remove Button */}
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-9 w-9 p-0 shadow-lg"
                onClick={onRemove}
                disabled={disabled || isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Upload Progress Overlay */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2 text-white">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                  <p className="text-sm font-medium">Uploading...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Upload Prompt
          <label className="cursor-pointer">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="rounded-full bg-muted p-4 transition-colors group-hover:bg-muted/80">
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  <span className="text-primary hover:underline">
                    Click to upload
                  </span>{' '}
                  or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, or WEBP (max {maxSize}MB)
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  Minimum: 800 x 400px
                </p>
              </div>

              {isUploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                  Uploading...
                </div>
              )}
            </div>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              disabled={disabled || isUploading}
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-3">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* Helper Text */}
      {!error && !value && (
        <p className="text-xs text-muted-foreground">
          Recommended: 2160 x 1080px (2:1 ratio) for best display quality
        </p>
      )}
    </div>
  );
}
