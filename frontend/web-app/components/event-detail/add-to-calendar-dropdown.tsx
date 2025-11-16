'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarIcon } from '@/components/ui/icons';
import { Button } from '@/components/ui';
import {
  downloadICS,
  generateGoogleCalendarURL,
  generateOutlookCalendarURL,
  generateYahooCalendarURL,
  type CalendarEventData,
} from '@/lib/calendar';

interface AddToCalendarDropdownProps {
  eventData: {
    title: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime?: string;
    url?: string;
    organizerName?: string;
    organizerEmail?: string;
  };
}

export function AddToCalendarDropdown({ eventData }: AddToCalendarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleDownloadICS = () => {
    downloadICS(eventData as CalendarEventData);
    setIsOpen(false);
  };

  const handleGoogleCalendar = () => {
    window.open(generateGoogleCalendarURL(eventData as CalendarEventData), '_blank');
    setIsOpen(false);
  };

  const handleOutlookCalendar = () => {
    window.open(generateOutlookCalendarURL(eventData as CalendarEventData), '_blank');
    setIsOpen(false);
  };

  const handleYahooCalendar = () => {
    window.open(generateYahooCalendarURL(eventData as CalendarEventData), '_blank');
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-primary hover:text-primary/80 hover:bg-primary/10 p-0 h-auto font-normal"
      >
        <CalendarIcon className="h-4 w-4 mr-1.5" />
        + Add to Calendar
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-56 rounded border border-border bg-card shadow-dropdown z-50">
          <div className="py-1">
            <button
              onClick={handleGoogleCalendar}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-3"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12c6.627 0 12-5.373 12-12S18.627 0 12 0zm.14 19.018c-3.868 0-7-3.14-7-7.018c0-3.878 3.132-7.018 7-7.018c1.89 0 3.47.697 4.682 1.829l-1.974 1.978v-.004c-.735-.702-1.667-1.062-2.708-1.062c-2.31 0-4.187 1.956-4.187 4.273c0 2.315 1.877 4.277 4.187 4.277c2.096 0 3.522-1.202 3.816-2.852H12.14v-2.737h6.585c.088.47.135.96.135 1.474c0 4.01-2.677 6.86-6.72 6.86z"/>
              </svg>
              Google Calendar
            </button>

            <button
              onClick={handleOutlookCalendar}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-3"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 7.387v9.226a.5.5 0 01-.5.5h-7.164a.5.5 0 01-.5-.5V7.387a.5.5 0 01.5-.5H23.5a.5.5 0 01.5.5zM12.751 3L.5 6.5v11L12.751 21l3.748-1.5v-15L12.751 3zm-1.25 13.5c-2.071 0-3.75-1.679-3.75-3.75S9.43 9 11.501 9s3.75 1.679 3.75 3.75-1.679 3.75-3.75 3.75z"/>
              </svg>
              Outlook Calendar
            </button>

            <button
              onClick={handleYahooCalendar}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-3"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.002 0C5.375 0 0 5.373 0 12c0 6.628 5.375 12 12.002 12C18.627 24 24 18.628 24 12c0-6.627-5.373-12-11.998-12zm6.413 14.831l-3.446 6.516h-2.311l3.446-6.516-3.179-5.909h2.311l2.089 4.093 2.089-4.093h2.311l-3.31 5.909z"/>
              </svg>
              Yahoo Calendar
            </button>

            <div className="border-t border-border my-1" />

            <button
              onClick={handleDownloadICS}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-3"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download ICS File
            </button>

            <button
              onClick={handleDownloadICS}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-3"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
              </svg>
              Apple Calendar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

