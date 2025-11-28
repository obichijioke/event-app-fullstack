'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';
import { HeartIcon } from '@/components/ui/icons';
import { useSavedEventsStore } from '@/hooks/use-saved-events';
import { cn } from '@/lib/utils';

interface SaveButtonProps {
  eventId: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  className?: string;
  iconClassName?: string;
}

export function SaveButton({ 
  eventId, 
  variant = 'outline', 
  size = 'md',
  className,
  iconClassName 
}: SaveButtonProps) {
  const { isSaved, toggleSave, fetchSavedIds, savedIds } = useSavedEventsStore();
  const saved = isSaved(eventId);

  useEffect(() => {
    // Ensure we have the latest saved IDs
    // We use a simple check: if we haven't fetched yet (size is 0), we fetch.
    // This is not perfect (what if user has 0 saved?), but good enough for MVP.
    // A better way would be a 'hasFetched' flag in store.
    // For now, let's just fetch if we are not sure.
    // Actually, to avoid infinite loops or redundant fetches, let's rely on a global init 
    // or just fetch on mount of this button if we suspect we need to.
    // Let's just call fetchSavedIds() and let the store handle deduplication if we add a flag there.
    // For now, I'll update the store to have a loaded flag.
    fetchSavedIds(); 
  }, [fetchSavedIds]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(eventId);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        size === 'icon' ? "h-8 w-8 rounded-full" : "",
        className
      )}
      onClick={handleClick}
    >
      <HeartIcon 
        className={cn(
          "h-5 w-5 transition-colors", 
          saved ? "fill-red-500 text-red-500" : "text-current",
          iconClassName
        )} 
      />
      {size !== 'icon' && (
        <span className="ml-2">{saved ? 'Saved' : 'Save'}</span>
      )}
    </Button>
  );
}
