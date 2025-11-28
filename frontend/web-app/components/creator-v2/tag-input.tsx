'use client';

import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TagInput({
  value = [],
  onChange,
  maxTags = 10,
  placeholder = 'Type and press Enter to add tags...',
  disabled = false,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string>();

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();

    if (!trimmed) {
      setError('Tag cannot be empty');
      return;
    }

    if (trimmed.length < 2) {
      setError('Tag must be at least 2 characters');
      return;
    }

    if (trimmed.length > 30) {
      setError('Tag must be less than 30 characters');
      return;
    }

    if (value.includes(trimmed)) {
      setError('Tag already exists');
      return;
    }

    if (value.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed`);
      return;
    }

    onChange([...value, trimmed]);
    setInputValue('');
    setError(undefined);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
    setError(undefined);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag on backspace if input is empty
      removeTag(value[value.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const tags = pastedText
      .split(/[,\n\t]/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length >= 2 && t.length <= 30);

    const availableSlots = maxTags - value.length;
    const tagsToAdd = tags.slice(0, availableSlots).filter((t) => !value.includes(t));

    if (tagsToAdd.length > 0) {
      onChange([...value, ...tagsToAdd]);
      setInputValue('');
      setError(undefined);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Tag Pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <div
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
            >
              <Tag className="h-3 w-3" />
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => !disabled && removeTag(tag)}
                disabled={disabled}
                className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="space-y-1.5">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={value.length >= maxTags ? `Maximum ${maxTags} tags reached` : placeholder}
          disabled={disabled || value.length >= maxTags}
          className={cn(
            'text-sm',
            error && 'border-red-600 dark:border-red-400 focus-visible:ring-red-600'
          )}
        />

        {/* Helper Text and Counter */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {error ? (
              <span className="text-red-600 dark:text-red-400">{error}</span>
            ) : (
              'Press Enter or comma to add tags'
            )}
          </span>
          <span
            className={cn(
              'font-medium',
              value.length >= maxTags
                ? 'text-red-600 dark:text-red-400'
                : 'text-muted-foreground'
            )}
          >
            {value.length} / {maxTags}
          </span>
        </div>
      </div>

      {/* Suggestions (Optional Enhancement) */}
      {value.length === 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Suggestions:</span>
          {['music', 'concert', 'conference', 'workshop', 'networking'].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => !disabled && addTag(suggestion)}
              disabled={disabled}
              className="text-xs rounded-full bg-muted hover:bg-muted/80 px-2.5 py-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
