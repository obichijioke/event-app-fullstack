'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { organizerApi } from '@/lib/api/organizer-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import toast from 'react-hot-toast';
import { Building2, Zap } from 'lucide-react';

const personalOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  country: z.string().optional(),
});

type PersonalOrgFormData = z.infer<typeof personalOrgSchema>;

interface OrganizationSetupProps {
  onSuccess?: (orgId: string) => void;
  redirectTo?: string;
}

export function OrganizationSetup({ onSuccess, redirectTo = '/organizer/events/create' }: OrganizationSetupProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalOrgFormData>({
    resolver: zodResolver(personalOrgSchema),
  });

  const buildRedirectUrl = (base: string, orgId: string) => {
    if (base.includes('org=')) return base;
    return base.includes('?') ? `${base}&org=${orgId}` : `${base}?org=${orgId}`;
  };

  const handleQuickSetup = async () => {
    setLoading(true);
    try {
      const organization = await organizerApi.organizations.getOrCreateDefault();
      toast.success('Organizer profile created!');

      if (onSuccess) {
        onSuccess(organization.id);
      } else {
        router.push(buildRedirectUrl(redirectTo, organization.id));
      }
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      toast.error(error.message || 'Failed to create organizer profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSetup = async (data: PersonalOrgFormData) => {
    setLoading(true);
    try {
      const organization = await organizerApi.organizations.createPersonal(data);
      toast.success('Organizer profile created!');

      if (onSuccess) {
        onSuccess(organization.id);
      } else {
        router.push(buildRedirectUrl(redirectTo, organization.id));
      }
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      toast.error(error.message || 'Failed to create organizer profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <Heading level={"h2"} className="mb-4">
          Set up your organizer profile
        </Heading>
        <Text className="text-gray-600">
          Choose how you&apos;d like to create your organizer profile. You can start quickly or customize your details.
        </Text>
      </div>

      {!showCustomForm ? (
        <div className="space-y-6">
          {/* Quick Setup Option */}
          <div className="border-2 border-blue-500 rounded-lg p-8 bg-blue-50">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-blue-500 text-white p-3 rounded-lg">
                <Zap size={24} />
              </div>
              <div>
                <Heading level={"h4"} className="mb-2">
                  Quick Setup (Recommended)
                </Heading>
                <Text className="text-gray-600 text-sm">
                  Start creating events immediately with an auto-generated profile name. Perfect for getting started quickly!
                </Text>
              </div>
            </div>
            <Button
              onClick={handleQuickSetup}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creating profile...' : 'Quick Setup - Start Now'}
            </Button>
          </div>

          {/* Custom Setup Option */}
          <div className="border-2 border-gray-200 rounded-lg p-8 hover:border-gray-300 transition-colors">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-gray-100 text-gray-700 p-3 rounded-lg">
                <Building2 size={24} />
              </div>
              <div>
                <Heading level={"h4"} className="mb-2">
                  Custom Setup
                </Heading>
                <Text className="text-gray-600 text-sm">
                  Choose your own organizer name and add additional details.
                </Text>
              </div>
            </div>
            <Button
              onClick={() => setShowCustomForm(true)}
              variant="outline"
              className="w-full"
            >
              Customize Your Profile
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-gray-200 rounded-lg p-8">
          <button
            onClick={() => setShowCustomForm(false)}
            className="text-blue-600 hover:text-blue-700 mb-6 flex items-center gap-2 text-sm"
          >
            ← Back to options
          </button>

          <form onSubmit={handleSubmit(handleCustomSetup)} className="space-y-6">
            <div>
              <Label htmlFor="name">
                Organizer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="e.g., John's Events, ABC Productions"
                className="mt-2"
              />
              {errors.name && (
                <Text className="text-red-600 text-sm mt-1">{errors.name.message}</Text>
              )}
              <Text className="text-gray-500 text-sm mt-2">
                This is how attendees will see your organizer profile
              </Text>
            </div>

            <div>
              <Label htmlFor="country">Country (Optional)</Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="e.g., US, UK, CA"
                className="mt-2"
              />
              <Text className="text-gray-500 text-sm mt-2">
                2-letter country code (ISO 3166-1 alpha-2)
              </Text>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Text className="text-sm text-blue-900">
                <strong>Personal organizations</strong> are automatically approved and verified. You can start creating events immediately!
              </Text>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Organizer Profile'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomForm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 text-center">
        <Text className="text-gray-500 text-sm">
          You can upgrade to a business organization later for larger events and advanced features.
        </Text>
      </div>
    </div>
  );
}
