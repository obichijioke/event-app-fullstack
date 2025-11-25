'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { X, User, Briefcase, GripVertical } from 'lucide-react';

interface SpeakerCardProps {
  index: number;
  name: string;
  role?: string;
  photoUrl?: string;
  bio?: string;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onPhotoUrlChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onRemove: () => void;
  nameError?: string;
  photoError?: string;
}

export function SpeakerCard({
  index,
  name,
  role,
  photoUrl,
  bio,
  onNameChange,
  onRoleChange,
  onPhotoUrlChange,
  onBioChange,
  onRemove,
  nameError,
  photoError,
}: SpeakerCardProps) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 transition-all hover:border-muted-foreground/30">
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div className="mt-2 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground">
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              Speaker {index + 1}
            </span>
          </div>

          {/* Name and Role */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Name *</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder="John Doe"
                className="text-sm"
              />
              {nameError && (
                <p className="text-xs text-red-600 dark:text-red-400">{nameError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                Role / Title
              </label>
              <Input
                type="text"
                value={role || ''}
                onChange={(e) => onRoleChange(e.target.value)}
                placeholder="Keynote Speaker"
                className="text-sm"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Photo</label>
            <ImageUpload
              value={photoUrl || ''}
              onChange={onPhotoUrlChange}
              maxSize={2}
              acceptUrl={true}
              placeholder="https://example.com/photo.jpg"
            />
            {photoError && (
              <p className="text-xs text-red-600 dark:text-red-400">{photoError}</p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Bio</label>
            <Textarea
              value={bio || ''}
              onChange={(e) => onBioChange(e.target.value)}
              placeholder="Brief background about the speaker..."
              rows={3}
              className="text-sm resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio?.length || 0} / 500
            </p>
          </div>
        </div>

        {/* Remove Button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
