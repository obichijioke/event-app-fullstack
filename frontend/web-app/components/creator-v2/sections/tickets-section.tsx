'use client';

import React from 'react';
import { useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { debounce } from '@/lib/utils/debounce';
import { useEventCreatorDraft } from '@/components/creator-v2/event-creator-provider';
import type { EventCreatorDraftSection } from '@/lib/types/event-creator-v2';

const ticketSchema = z.object({
  name: z.string().min(1, 'Name required'),
  kind: z.enum(['free', 'paid', 'donation', 'hidden', 'hold']),
  priceCents: z.number().int().nonnegative().optional(),
  quantity: z.number().int().nonnegative().optional(),
  visibility: z.enum(['public', 'hidden']),
  salesStart: z.string().optional(),
  salesEnd: z.string().optional(),
});

const promoSchema = z.object({
  code: z.string().min(1, 'Code required'),
  discountType: z.enum(['percent', 'amount', 'access']),
  amountOffCents: z.number().int().nonnegative().optional(),
  percentOff: z.number().min(0).max(100).optional(),
  usageLimit: z.number().int().nonnegative().optional(),
});



const ticketsFormSchema = z.object({
  tickets: z.array(ticketSchema),
  promos: z.array(promoSchema),
});

type TicketsValues = z.infer<typeof ticketsFormSchema>;

export function TicketsSection() {
  const { draft, updateSection, isSaving } = useEventCreatorDraft();
  const tickets: EventCreatorDraftSection | undefined = draft?.sections.find(
    (s) => s.section === 'tickets'
  );

  const defaultTickets: TicketsValues = {
    tickets: Array.isArray(tickets?.payload?.ticketTypes)
      ? (tickets?.payload?.ticketTypes as any[]).map((t) => ({
          name: t.name ?? '',
          kind: (t.kind as any) ?? 'paid',
          priceCents: t.priceCents != null ? Number(t.priceCents) : undefined,
          quantity: t.quantity != null ? Number(t.quantity) : undefined,
          visibility: (t.visibility as any) ?? 'public',
          salesStart: t.salesStart ?? '',
          salesEnd: t.salesEnd ?? '',
        }))
      : [],
    promos: Array.isArray(tickets?.payload?.promoCodes)
      ? (tickets?.payload?.promoCodes as any[]).map((p) => ({
          code: p.code ?? '',
          discountType: (p.discountType as any) ?? 'percent',
          amountOffCents: p.amountOffCents != null ? Number(p.amountOffCents) : undefined,
          percentOff: p.percentOff != null ? Number(p.percentOff) : undefined,
          usageLimit: p.usageLimit != null ? Number(p.usageLimit) : undefined,
        }))
      : [],
  };

  const form = useForm<TicketsValues>({
    resolver: zodResolver(ticketsFormSchema),
    defaultValues: defaultTickets,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'tickets' });

  const debouncedSave = useMemo(
    () =>
      debounce((...args: unknown[]) => {
        const values = args[0] as TicketsValues;
        void updateSection(
          'tickets',
          {
            autosave: true,
            payload: { ticketTypes: values.tickets, promoCodes: values.promos },
            status: 'valid',
          },
          { showToast: false }
        );
      }, 600),
    [updateSection]
  );

  form.watch((values) => {
    const parsed = ticketsFormSchema.safeParse(values);
    if (parsed.success) {
      debouncedSave(parsed.data);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tickets & pricing</h2>
          <p className="text-sm text-muted-foreground">Add ticket types and pricing rules.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => append({ name: '', kind: 'paid', priceCents: 0, quantity: 0, visibility: 'public' })}>
          Add ticket
        </Button>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
            No tickets yet. Add your first ticket.
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-xl border border-border p-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-medium">Ticket name</label>
                    <Input placeholder="e.g., General Admission" {...form.register(`tickets.${index}.name` as const)} />
                    <p className="text-xs text-muted-foreground">Shown anywhere this ticket appears.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Type</label>
                    <Select
                      value={form.watch(`tickets.${index}.kind` as const) as any}
                      onChange={(e) => form.setValue(`tickets.${index}.kind` as const, e.target.value as any)}
                    >
                      <option value="paid">Paid</option>
                      <option value="free">Free</option>
                      <option value="donation">Donation</option>
                      <option value="hidden">Hidden</option>
                      <option value="hold">Hold</option>
                    </Select>
                    <p className="text-xs text-muted-foreground">Hidden and hold types stay off the public listing.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Price</label>
                    <CurrencyInput
                      value={form.watch(`tickets.${index}.priceCents` as const) || 0}
                      onChange={(cents) => form.setValue(`tickets.${index}.priceCents` as const, cents)}
                      placeholder="12.00"
                    />
                    <p className="text-xs text-muted-foreground">Leave blank for free tickets.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Quantity</label>
                    <Input type="number" placeholder="100" {...form.register(`tickets.${index}.quantity` as const, { valueAsNumber: true })} />
                    <p className="text-xs text-muted-foreground">Total inventory for this tier.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Visibility</label>
                    <Select
                      value={form.watch(`tickets.${index}.visibility` as const) as any}
                      onChange={(e) => form.setValue(`tickets.${index}.visibility` as const, e.target.value as any)}
                    >
                      <option value="public">Public</option>
                      <option value="hidden">Hidden</option>
                    </Select>
                    <p className="text-xs text-muted-foreground">Hidden tickets require a direct link or code.</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Sales start</label>
                    <Input type="datetime-local" {...form.register(`tickets.${index}.salesStart` as const)} />
                    <p className="text-xs text-muted-foreground">Leave blank to start immediately.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Sales end</label>
                    <Input type="datetime-local" {...form.register(`tickets.${index}.salesEnd` as const)} />
                    <p className="text-xs text-muted-foreground">Leave blank to keep selling until the event begins.</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button type="button" variant="outline" onClick={() => remove(index)}>Remove</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Promo codes</h3>
            <Button type="button" variant="outline" onClick={() => form.setValue('promos', [...form.getValues('promos'), { code: '', discountType: 'percent', percentOff: 10 }])}>
              Add code
            </Button>
          </div>
          {form.watch('promos').length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">No promo codes yet.</div>
          ) : (
            <div className="space-y-3">
              {form.watch('promos').map((p, i) => (
                <div key={i} className="grid gap-3 md:grid-cols-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Code</label>
                    <Input placeholder="SAVE10" value={p.code} onChange={(e) => { const arr = [...form.getValues('promos')]; arr[i].code = e.target.value; form.setValue('promos', arr); }} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Type</label>
                    <Select value={p.discountType as any} onChange={(e) => { const arr = [...form.getValues('promos')]; arr[i].discountType = e.target.value as any; form.setValue('promos', arr); }}>
                      <option value="percent">Percent</option>
                      <option value="amount">Amount</option>
                      <option value="access">Access</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">% off</label>
                    <Input type="number" placeholder="10" value={p.percentOff as any} onChange={(e) => { const arr = [...form.getValues('promos')]; arr[i].percentOff = Number(e.target.value); form.setValue('promos', arr); }} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Amount off</label>
                    <CurrencyInput
                      value={p.amountOffCents || 0}
                      onChange={(cents) => { const arr = [...form.getValues('promos')]; arr[i].amountOffCents = cents; form.setValue('promos', arr); }}
                      placeholder="5.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Usage limit</label>
                    <Input type="number" placeholder="Unlimited" value={p.usageLimit as any} onChange={(e) => { const arr = [...form.getValues('promos')]; arr[i].usageLimit = Number(e.target.value); form.setValue('promos', arr); }} />
                    <p className="text-xs text-muted-foreground">Leave blank for unlimited redemptions.</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button type="button" variant="outline" onClick={() => { const arr = [...form.getValues('promos')]; arr.splice(i,1); form.setValue('promos', arr); }}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
