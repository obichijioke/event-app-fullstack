'use client';

import { useState, useRef, useEffect } from 'react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { ChevronDown, Check, Building2 } from 'lucide-react';
import { OrganizationTypeBadge } from './organization-type-badge';

export function OrganizationSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { currentOrganization, organizations, setCurrentOrganization } = useOrganizerStore();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentOrganization) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted/50 transition min-w-[240px]"
      >
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-foreground truncate">
              {currentOrganization.name}
            </p>
            {currentOrganization.type && (
              <OrganizationTypeBadge type={currentOrganization.type} size="sm" showIcon={false} />
            )}
          </div>
          <p className="text-xs text-muted-foreground capitalize">{currentOrganization.role}</p>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && organizations.length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <div className="py-1">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  setCurrentOrganization(org);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted/50 transition text-left"
              >
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">{org.name}</p>
                    {org.type && (
                      <OrganizationTypeBadge type={org.type} size="sm" showIcon={false} />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{org.role}</p>
                </div>
                {org.id === currentOrganization.id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
