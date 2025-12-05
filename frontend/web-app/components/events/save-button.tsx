'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui';
import { HeartIcon } from '@/components/ui/icons';
import { useSavedEventsStore } from '@/hooks/use-saved-events';
import { useAuth } from '@/components/auth';
import toast from 'react-hot-toast';
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
  const { isSaved, toggleSave, fetchSavedIds } = useSavedEventsStore();
  const { user, initialized } = useAuth();
  const saved = isSaved(eventId);

  useEffect(() => {
    if (!initialized || !user) return;
    fetchSavedIds(); 
  }, [fetchSavedIds, initialized, user]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!initialized) return;
    if (!user) {
      toast.error('Sign in to save events');
      return;
    }
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
