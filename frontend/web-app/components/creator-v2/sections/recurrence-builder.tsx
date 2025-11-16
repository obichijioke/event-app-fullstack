'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { RRule, RRuleSet, Weekday } from 'rrule';
import { addMinutes } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

const WEEKDAYS: { key: string; label: string; value: Weekday }[] = [
  { key: 'MO', label: 'Mon', value: RRule.MO },
  { key: 'TU', label: 'Tue', value: RRule.TU },
  { key: 'WE', label: 'Wed', value: RRule.WE },
  { key: 'TH', label: 'Thu', value: RRule.TH },
  { key: 'FR', label: 'Fri', value: RRule.FR },
  { key: 'SA', label: 'Sat', value: RRule.SA },
  { key: 'SU', label: 'Sun', value: RRule.SU },
];

export interface RecurrenceConfig {
  start: string; // ISO
  end?: string; // ISO
  freq: Frequency;
  interval: number;
  byWeekday?: string[]; // ['MO','WE']
  ends?: { kind: 'never' | 'until' | 'count'; until?: string; count?: number };
  exceptions?: string[]; // ISO dates to skip
}

interface RecurrenceBuilderProps {
  config: RecurrenceConfig;
  timezone: string;
  onChange: (rrule: string, exceptions: string[], preview: { start: string; end?: string }[]) => void;
}

export function RecurrenceBuilder({ config, timezone, onChange }: RecurrenceBuilderProps) {
  const [local, setLocal] = useState<RecurrenceConfig>(config);

  useEffect(() => setLocal(config), [config.start, config.end, config.freq, config.interval, config.byWeekday, config.ends, config.exceptions]);

  const rruleString = useMemo(() => {
    try {
      const options: any = {
        freq: RRule[local.freq],
        interval: local.interval || 1,
        dtstart: new Date(local.start),
      };
      if (local.byWeekday && local.byWeekday.length && local.freq === 'WEEKLY') {
        options.byweekday = local.byWeekday.map((k) => (RRule as any)[k]);
      }
      if (local.ends?.kind === 'until' && local.ends.until) {
        options.until = new Date(local.ends.until);
      } else if (local.ends?.kind === 'count' && local.ends.count) {
        options.count = local.ends.count;
      }
      const rule = new RRule(options);
      return rule.toString();
    } catch (_) {
      return '';
    }
  }, [local]);

  const preview = useMemo(() => {
    if (!rruleString) return [] as { start: string; end?: string }[];
    const set = new RRuleSet();
    try {
      set.rrule(RRule.fromString(rruleString));
      (local.exceptions || []).forEach((ex) => set.exdate(new Date(ex)));
      const dates = set.between(new Date(local.start), addMinutes(new Date(local.start), 60 * 24 * 365), true, (d) => true).slice(0, 10);
      const duration = local.end ? (new Date(local.end).getTime() - new Date(local.start).getTime()) : 0;
      return dates.map((d) => ({ start: d.toISOString(), end: local.end ? new Date(d.getTime() + Math.max(0, duration)).toISOString() : undefined }));
    } catch (_) {
      return [];
    }
  }, [rruleString, local.start, local.end, local.exceptions]);

  useEffect(() => {
    onChange(rruleString, local.exceptions || [], preview);
  }, [rruleString, local.exceptions, preview, onChange]);

  return (
    <div className="space-y-4 rounded-2xl border border-border p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Frequency</label>
          <Select value={local.freq} onChange={(e) => setLocal({ ...local, freq: e.target.value as Frequency })}>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Interval</label>
          <Input type="number" min={1} value={local.interval} onChange={(e) => setLocal({ ...local, interval: Number(e.target.value) || 1 })} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Ends</label>
          <Select value={local.ends?.kind || 'never'} onChange={(e) => setLocal({ ...local, ends: { kind: e.target.value as any } })}>
            <option value="never">Never</option>
            <option value="until">On date</option>
            <option value="count">After count</option>
          </Select>
        </div>
        <div className="space-y-2">
          {local.ends?.kind === 'until' ? (
            <Input type="date" value={local.ends.until || ''} onChange={(e) => setLocal({ ...local, ends: { kind: 'until', until: e.target.value } })} />
          ) : local.ends?.kind === 'count' ? (
            <Input type="number" min={1} value={local.ends.count || 1} onChange={(e) => setLocal({ ...local, ends: { kind: 'count', count: Number(e.target.value) || 1 } })} />
          ) : (
            <div className="text-xs text-muted-foreground">No end</div>
          )}
        </div>
      </div>

      {local.freq === 'WEEKLY' && (
        <div className="flex flex-wrap items-center gap-2">
          {WEEKDAYS.map((wd) => {
            const active = (local.byWeekday || []).includes(wd.key);
            return (
              <Button
                key={wd.key}
                type="button"
                variant={active ? 'primary' : 'outline'}
                onClick={() => {
                  const list = new Set(local.byWeekday || []);
                  if (list.has(wd.key)) list.delete(wd.key); else list.add(wd.key);
                  setLocal({ ...local, byWeekday: Array.from(list) });
                }}
              >
                {wd.label}
              </Button>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Exceptions</label>
        <div className="flex items-center gap-2">
          <Input type="date" onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            const d = new Date(v);
            const iso = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
            const next = Array.from(new Set([...(local.exceptions || []), iso]));
            setLocal({ ...local, exceptions: next });
          }} />
        </div>
        <div className="flex flex-wrap gap-2">
          {(local.exceptions || []).map((ex) => (
            <span key={ex} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs">
              {new Date(ex).toLocaleDateString()}
              <button className="text-muted-foreground" onClick={() => setLocal({ ...local, exceptions: (local.exceptions || []).filter((e) => e !== ex) })}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Preview (next 10)</p>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {preview.length === 0 ? (
            <li>No dates – adjust settings above.</li>
          ) : (
            preview.map((p) => (
              <li key={p.start}>{new Date(p.start).toLocaleString()} {p.end ? `– ${new Date(p.end).toLocaleTimeString()}` : ''}</li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

