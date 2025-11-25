'use client';

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui';
import {
  DollarSign,
  ArrowRightLeft,
  Repeat,
  Accessibility,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface PolicySectionProps {
  // Refund policy
  refundPolicy: string;
  onRefundPolicyChange: (value: string) => void;

  // Transfer policy
  transferEnabled: boolean;
  transferCutoff?: string;
  onTransferEnabledChange: (enabled: boolean) => void;
  onTransferCutoffChange: (cutoff: string | undefined) => void;

  // Resale policy
  resaleEnabled: boolean;
  onResaleEnabledChange: (enabled: boolean) => void;

  // Accessibility
  accessibilityNotes: string;
  onAccessibilityNotesChange: (value: string) => void;
}

const REFUND_TEMPLATES = [
  { value: 'no_refunds', label: 'No refunds', text: 'All sales are final. No refunds.' },
  { value: '24h', label: 'Full refund up to 24 hours before', text: 'Full refund available up to 24 hours before the event.' },
  { value: '48h', label: 'Full refund up to 48 hours before', text: 'Full refund available up to 48 hours before the event.' },
  { value: '7d', label: 'Full refund up to 7 days before', text: 'Full refund available up to 7 days before the event.' },
  { value: 'flexible', label: 'Flexible (subject to approval)', text: 'Refunds subject to approval. Requests must include order number and reason.' },
];

export function PolicySection({
  refundPolicy,
  onRefundPolicyChange,
  transferEnabled,
  transferCutoff,
  onTransferEnabledChange,
  onTransferCutoffChange,
  resaleEnabled,
  onResaleEnabledChange,
  accessibilityNotes,
  onAccessibilityNotesChange,
}: PolicySectionProps) {
  const [refundMode, setRefundMode] = useState<'template' | 'custom'>(
    refundPolicy && !REFUND_TEMPLATES.some(t => t.text === refundPolicy) ? 'custom' : 'template'
  );

  const handleTemplateSelect = (templateValue: string) => {
    const template = REFUND_TEMPLATES.find(t => t.value === templateValue);
    if (template) {
      onRefundPolicyChange(template.text);
    }
  };

  const selectedTemplate = REFUND_TEMPLATES.find(t => t.text === refundPolicy);

  return (
    <div className="space-y-6">
      {/* Ticketing Policies Card */}
      <div className="rounded-xl border-2 border-primary/20 bg-card p-6 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Ticketing Policies</h3>
        </div>

        {/* Refund Policy */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Refund Policy
          </label>

          {/* Template/Custom Toggle */}
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setRefundMode('template')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                refundMode === 'template'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Use template
            </button>
            <button
              type="button"
              onClick={() => setRefundMode('custom')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                refundMode === 'custom'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Custom policy
            </button>
          </div>

          {refundMode === 'template' ? (
            <div className="space-y-2">
              {REFUND_TEMPLATES.map((template) => (
                <label
                  key={template.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedTemplate?.value === template.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="refund-template"
                    value={template.value}
                    checked={selectedTemplate?.value === template.value}
                    onChange={() => handleTemplateSelect(template.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{template.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{template.text}</p>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <Textarea
              value={refundPolicy}
              onChange={(e) => onRefundPolicyChange(e.target.value)}
              placeholder="Describe your refund policy..."
              rows={3}
              className="text-sm"
            />
          )}
        </div>

        {/* Transfer Policy */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
              Ticket Transfers
            </label>
            <Switch
              checked={transferEnabled}
              onCheckedChange={onTransferEnabledChange}
              label=""
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {transferEnabled ? 'Attendees can transfer tickets to others' : 'Ticket transfers are disabled'}
          </p>

          {transferEnabled && (
            <div className="space-y-2 pl-6">
              <label className="text-xs font-medium">Transfer cutoff</label>
              <Select
                value={transferCutoff || ''}
                onChange={(e) => onTransferCutoffChange(e.target.value || undefined)}
                className="text-sm"
              >
                <option value="">Select cutoff time...</option>
                <option value="2h">Up to 2 hours before start</option>
                <option value="24h">Up to 24 hours before start</option>
                <option value="48h">Up to 48 hours before start</option>
                <option value="72h">Up to 72 hours before start</option>
                <option value="7d">Up to 7 days before start</option>
                <option value="at_start">Until the event starts</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                Attendees can transfer tickets until this time
              </p>
            </div>
          )}
        </div>

        {/* Resale Policy */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              Ticket Resale
            </label>
            <Switch
              checked={resaleEnabled}
              onCheckedChange={onResaleEnabledChange}
              label=""
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {resaleEnabled
              ? 'Attendees can list tickets for resale through your platform'
              : 'Ticket resale is disabled'}
          </p>

          {resaleEnabled && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              When enabled, attendees may list tickets for resale. Organizer fees and payout timelines apply.
            </div>
          )}
        </div>
      </div>

      {/* Accessibility Card */}
      <div className="rounded-xl border-2 border-blue-500/20 bg-card p-6 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Accessibility className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold">Accessibility Information</h3>
        </div>

        <Textarea
          value={accessibilityNotes}
          onChange={(e) => onAccessibilityNotesChange(e.target.value)}
          placeholder="Wheelchair access, parking information, ASL interpretation, sensory accommodations, etc."
          rows={4}
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Provide details about accessibility features, parking, and special accommodations
        </p>
      </div>
    </div>
  );
}
