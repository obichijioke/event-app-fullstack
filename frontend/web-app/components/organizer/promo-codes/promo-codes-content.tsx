'use client';

import { useEffect, useState } from 'react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { PromoCode, CreatePromoCodeDto, Promotion, CreatePromotionDto } from '@/lib/types/organizer';
import { PromoCodeCard } from './promo-code-card';
import { PromoCodeForm } from './promo-code-form';
import { PromotionForm } from './promotion-form';
import { EditPromotionForm } from './edit-promotion-form';
import { CampaignDetailsModal } from './campaign-details-modal';
import { CampaignAnalyticsModal } from './campaign-analytics-modal';
import { DuplicateCampaignForm } from './duplicate-campaign-form';
import { Loader2, Plus, Tag, Percent, Edit, Trash2, Eye, TrendingUp, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

interface PromoCodesContentProps {
  eventId: string;
}

export function PromoCodesContent({ eventId }: PromoCodesContentProps) {
  const { currentOrganization } = useOrganizerStore();
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [viewingPromotion, setViewingPromotion] = useState<Promotion | null>(null);
  const [analyticsPromotion, setAnalyticsPromotion] = useState<Promotion | null>(null);
  const [duplicatingPromotion, setDuplicatingPromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    if (currentOrganization) {
      loadData();
    }
  }, [currentOrganization]);

  const loadData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const [codesData, promotionsData] = await Promise.all([
        organizerApi.promoCodes.list(currentOrganization.id),
        organizerApi.promotions.list(currentOrganization.id),
      ]);

      // Filter promo codes for this event
      const eventPromotions = promotionsData.filter(p =>
        p.eventIds && p.eventIds.includes(eventId)
      );
      const eventPromotionIds = eventPromotions.map(p => p.id);
      const eventPromoCodes = codesData.filter(c =>
        eventPromotionIds.includes(c.promotionId)
      );

      setPromoCodes(eventPromoCodes);
      setPromotions(eventPromotions);
    } catch (error) {
      console.error('Failed to load promo codes:', error);
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreatePromoCodeDto) => {
    if (!currentOrganization) return;

    try {
      const codeData: CreatePromoCodeDto = {
        ...data,
        code: data.code.toUpperCase(),
        startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : undefined,
      };

      await organizerApi.promoCodes.create(currentOrganization.id, codeData);
      toast.success('Promo code created successfully');
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to create promo code:', error);
      toast.error('Failed to create promo code');
      throw error;
    }
  };

  const handleUpdate = async (data: CreatePromoCodeDto) => {
    if (!currentOrganization || !editingPromoCode) return;

    try {
      const codeData: Partial<CreatePromoCodeDto> = {
        code: data.code.toUpperCase(),
        maxUses: data.maxUses,
        startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : undefined,
      };

      await organizerApi.promoCodes.update(
        currentOrganization.id,
        editingPromoCode.id,
        codeData
      );
      toast.success('Promo code updated successfully');
      setEditingPromoCode(null);
      loadData();
    } catch (error) {
      console.error('Failed to update promo code:', error);
      toast.error('Failed to update promo code');
      throw error;
    }
  };

  const handleDelete = async (promoCode: PromoCode) => {
    if (!currentOrganization) return;

    if (!confirm(`Are you sure you want to delete promo code "${promoCode.code}"?`)) {
      return;
    }

    try {
      await organizerApi.promoCodes.delete(currentOrganization.id, promoCode.id);
      toast.success('Promo code deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete promo code:', error);
      toast.error('Failed to delete promo code');
    }
  };

  const handleEdit = (promoCode: PromoCode) => {
    setEditingPromoCode(promoCode);
  };

  const handleCreatePromotion = async (data: CreatePromotionDto) => {
    console.log('handleCreatePromotion called with:', data);
    console.log('currentOrganization:', currentOrganization);

    if (!currentOrganization) {
      console.error('No current organization');
      toast.error('No organization selected');
      return;
    }

    try {
      const promotionData: CreatePromotionDto = {
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : undefined,
      };

      console.log('Sending promotion data to API:', promotionData);
      const result = await organizerApi.promotions.create(currentOrganization.id, promotionData);
      console.log('API response:', result);

      toast.success('Promotion campaign created successfully');
      setShowPromotionForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to create promotion:', error);
      toast.error('Failed to create promotion');
      throw error;
    }
  };

  const handleUpdatePromotion = async (data: Partial<CreatePromotionDto>) => {
    if (!currentOrganization || !editingPromotion) return;

    try {
      const promotionData: Partial<CreatePromotionDto> = {
        ...data,
        startsAt: new Date(data.startsAt!).toISOString(),
        endsAt: new Date(data.endsAt!).toISOString(),
      };

      await organizerApi.promotions.update(
        currentOrganization.id,
        editingPromotion.id,
        promotionData
      );
      toast.success('Promotion campaign updated successfully');
      setEditingPromotion(null);
      loadData();
    } catch (error) {
      console.error('Failed to update promotion:', error);
      toast.error('Failed to update promotion');
      throw error;
    }
  };

  const handleDeletePromotion = async (promotion: Promotion) => {
    if (!currentOrganization) return;

    // Count promo codes for this promotion
    const relatedCodes = promoCodes.filter(c => c.promotionId === promotion.id);
    const warningMessage = relatedCodes.length > 0
      ? `This campaign has ${relatedCodes.length} promo code${relatedCodes.length !== 1 ? 's' : ''}. Deleting it will also delete all associated promo codes. Are you sure?`
      : `Are you sure you want to delete campaign "${promotion.name}"?`;

    if (!confirm(warningMessage)) {
      return;
    }

    try {
      await organizerApi.promotions.delete(currentOrganization.id, promotion.id);
      toast.success('Promotion campaign deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete promotion:', error);
      toast.error('Failed to delete promotion');
    }
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion);
  };

  const handleDuplicatePromotion = async (data: CreatePromotionDto) => {
    if (!currentOrganization) return;

    try {
      const promotionData: CreatePromotionDto = {
        ...data,
        startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt).toISOString() : undefined,
      };

      await organizerApi.promotions.create(currentOrganization.id, promotionData);
      toast.success('Promotion campaign duplicated successfully');
      setDuplicatingPromotion(null);
      loadData();
    } catch (error) {
      console.error('Failed to duplicate promotion:', error);
      toast.error('Failed to duplicate promotion');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading promo codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Promotion Campaigns Section */}
      <div className="border border-border rounded-lg p-6 bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Promotion Campaigns
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Campaigns define the discount rules. Create promo codes under each campaign.
            </p>
          </div>
          <button
            onClick={() => setShowPromotionForm(true)}
            className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 transition"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>

        {promotions.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-sm text-yellow-900">
              <strong>Get Started:</strong> Create your first promotion campaign to start offering discounts!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {promotions.map((promo) => (
              <div key={promo.id} className="border border-border rounded-lg p-4 bg-secondary/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold">{promo.name}</h4>
                    <span className="inline-block mt-1 px-2 py-1 bg-primary/20 text-primary rounded text-xs font-medium">
                      {promo.discountType === 'percentage'
                        ? `${promo.discountValue}% off`
                        : `$${(promo.discountValue / 100).toFixed(2)} off`}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAnalyticsPromotion(promo)}
                      className="p-2 hover:bg-secondary rounded-md transition"
                      title="View analytics"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewingPromotion(promo)}
                      className="p-2 hover:bg-secondary rounded-md transition"
                      title="View details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDuplicatingPromotion(promo)}
                      className="p-2 hover:bg-secondary rounded-md transition"
                      title="Duplicate campaign"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditPromotion(promo)}
                      className="p-2 hover:bg-secondary rounded-md transition"
                      title="Edit campaign"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePromotion(promo)}
                      className="p-2 hover:bg-red-50 text-red-600 rounded-md transition"
                      title="Delete campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Max uses: {promo.maxUses && promo.maxUses > 0 ? promo.maxUses : 'Unlimited'} • Used: {promo.currentUses || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Promo Codes Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Promo Codes</h2>
          <p className="text-muted-foreground mt-1">
            Create discount codes for your promotion campaigns
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          disabled={promotions.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Promo Code
        </button>
      </div>

      {/* Promo Codes Grid */}
      {promoCodes.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Promo Codes</h3>
          <p className="text-muted-foreground mb-4">
            {promotions.length === 0
              ? 'Create a promotion campaign first, then add promo codes'
              : 'Create your first promo code to offer discounts'}
          </p>
          <button
            onClick={() => setShowForm(true)}
            disabled={promotions.length === 0}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition disabled:opacity-50"
          >
            Create Promo Code
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promoCodes.map((promoCode) => (
            <PromoCodeCard
              key={promoCode.id}
              promoCode={promoCode}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Promotion Form */}
      {showPromotionForm && (
        <PromotionForm
          eventId={eventId}
          onSubmit={handleCreatePromotion}
          onCancel={() => setShowPromotionForm(false)}
        />
      )}

      {/* Edit Promotion Form */}
      {editingPromotion && (
        <EditPromotionForm
          promotion={editingPromotion}
          onSubmit={handleUpdatePromotion}
          onCancel={() => setEditingPromotion(null)}
        />
      )}

      {/* View Campaign Details */}
      {viewingPromotion && (
        <CampaignDetailsModal
          promotion={viewingPromotion}
          promoCodes={promoCodes}
          onClose={() => setViewingPromotion(null)}
        />
      )}

      {/* Campaign Analytics */}
      {analyticsPromotion && (
        <CampaignAnalyticsModal
          promotion={analyticsPromotion}
          promoCodes={promoCodes}
          onClose={() => setAnalyticsPromotion(null)}
        />
      )}

      {/* Duplicate Campaign Form */}
      {duplicatingPromotion && (
        <DuplicateCampaignForm
          promotion={duplicatingPromotion}
          eventId={eventId}
          onSubmit={handleDuplicatePromotion}
          onCancel={() => setDuplicatingPromotion(null)}
        />
      )}

      {/* Create/Edit Promo Code Form */}
      {(showForm || editingPromoCode) && (
        <PromoCodeForm
          promoCode={editingPromoCode || undefined}
          promotions={promotions}
          onSubmit={editingPromoCode ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingPromoCode(null);
          }}
        />
      )}
    </div>
  );
}
