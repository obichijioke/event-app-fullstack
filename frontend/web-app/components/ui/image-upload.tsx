'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Link as LinkIcon, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  maxSize?: number; // in MB
  acceptUrl?: boolean;
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  maxSize = 5,
  acceptUrl = true,
  placeholder = 'Enter image URL or upload',
}: ImageUploadProps) {
  const [mode, setMode] = useState<'upload' | 'url'>(value && value.startsWith('http') ? 'url' : 'upload');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('File must be an image');
      return;
    }

    setUploading(true);

    try {
      // Create a data URL for preview (in production, you'd upload to a server)
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onChange(dataUrl);
        setUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload image');
      setUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setError(null);
    onChange(url);
  };

  const handleClear = () => {
    onChange('');
    setError(null);
  };

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      {acceptUrl && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'upload'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'url'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            URL
          </button>
        </div>
      )}

      {/* Upload Mode */}
      {mode === 'upload' && (
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload-input"
            disabled={uploading}
          />
          <label
            htmlFor="image-upload-input"
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">
              {uploading ? 'Uploading...' : 'Click to upload image'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, GIF up to {maxSize}MB
            </p>
          </label>
        </div>
      )}

      {/* URL Mode */}
      {mode === 'url' && (
        <Input
          type="url"
          value={value || ''}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder}
          className="text-sm"
        />
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Preview */}
      {value && (
        <div className="relative rounded-lg border border-border overflow-hidden bg-muted">
          <img
            src={value}
            alt="Preview"
            className="w-full h-32 object-cover"
            onError={() => setError('Failed to load image')}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute top-2 right-2 h-7 w-7 p-0"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
