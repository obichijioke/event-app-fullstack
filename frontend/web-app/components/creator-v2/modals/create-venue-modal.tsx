import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { venuesApi, type Venue } from '@/lib/api/venues-api';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { POPULAR_TIMEZONES } from '@/lib/data/timezones';
import { toast } from 'react-hot-toast';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';

const venueSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    region: z.string().min(1, 'State/Region is required'),
    postal: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
  }),
  timezone: z.string().min(1, 'Timezone is required'),
  capacity: z.number().int().nonnegative().optional(),
});

type VenueFormValues = z.infer<typeof venueSchema>;

interface CreateVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (venue: Venue) => void;
}

export function CreateVenueModal({ isOpen, onClose, onSuccess }: CreateVenueModalProps) {
  const { currentOrganization } = useOrganizerStore();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: {
      name: '',
      address: {
        line1: '',
        line2: '',
        city: '',
        region: '',
        postal: '',
        country: '',
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      capacity: undefined,
    },
  });

  const onSubmit = async (values: VenueFormValues) => {
    if (!currentOrganization) {
      toast.error('Organization context missing');
      return;
    }

    setIsLoading(true);
    try {
      const newVenue = await venuesApi.createVenueForOrg(currentOrganization.id, values);
      toast.success('Venue created successfully');
      onSuccess(newVenue);
      onClose();
      form.reset();
    } catch (error) {
      console.error('Failed to create venue:', error);
      toast.error('Failed to create venue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Create New Venue"
      maxWidth="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Venue'}
          </Button>
        </>
      }
    >
      <form className="space-y-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Venue Name</Label>
          <Input id="name" placeholder="e.g. Grand Hall" {...form.register('name')} />
          {form.formState.errors.name && (
            <p className="text-xs text-error">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
          <div className="space-y-2">
            <Label htmlFor="line1">Address Line 1</Label>
            <AddressAutocomplete
              id="line1"
              placeholder="Start typing address..."
              defaultValue={form.getValues('address.line1')}
              onAddressSelect={(place) => {
                if (place.name) {
                  form.setValue('name', place.name);
                }
                form.setValue('address.line1', place.address);
                form.setValue('address.city', place.city);
                form.setValue('address.region', place.region);
                form.setValue('address.postal', place.postal);
                form.setValue('address.country', place.country);
              }}
              onChange={(e) => form.setValue('address.line1', e.target.value)}
            />
            {form.formState.errors.address?.line1 && (
              <p className="text-xs text-error">{form.formState.errors.address.line1.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="line2">Address Line 2 (Optional)</Label>
            <Input id="line2" placeholder="Suite 100" {...form.register('address.line2')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="New York" {...form.register('address.city')} />
              {form.formState.errors.address?.city && (
                <p className="text-xs text-error">{form.formState.errors.address.city.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">State/Region</Label>
              <Input id="region" placeholder="NY" {...form.register('address.region')} />
              {form.formState.errors.address?.region && (
                <p className="text-xs text-error">{form.formState.errors.address.region.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="postal">Postal Code</Label>
              <Input id="postal" placeholder="10001" {...form.register('address.postal')} />
              {form.formState.errors.address?.postal && (
                <p className="text-xs text-error">{form.formState.errors.address.postal.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" placeholder="US" {...form.register('address.country')} />
              {form.formState.errors.address?.country && (
                <p className="text-xs text-error">{form.formState.errors.address.country.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={form.watch('timezone')}
              onChange={(e) => form.setValue('timezone', e.target.value)}
            >
              {POPULAR_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </Select>
            {form.formState.errors.timezone && (
              <p className="text-xs text-error">{form.formState.errors.timezone.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (Optional)</Label>
            <Input
              id="capacity"
              type="number"
              placeholder="500"
              {...form.register('capacity', { valueAsNumber: true })}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
