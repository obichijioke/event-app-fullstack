'use client';

import { useEffect, useState } from 'react';
import { useOrganizerStore } from '@/lib/stores/organizer-store';
import { organizerApi } from '@/lib/api/organizer-api';
import { TicketType, CreateTicketTypeDto, InventorySnapshot } from '@/lib/types/organizer';
import { TicketTypeCard } from './ticket-type-card';
import { TicketTypeForm } from './ticket-type-form';
import { Loader2, Plus, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatNumber } from '@/lib/utils/format';

interface TicketManagementContentProps {
  eventId: string;
}

export function TicketManagementContent({ eventId }: TicketManagementContentProps) {
  const { currentOrganization } = useOrganizerStore();
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [inventory, setInventory] = useState<InventorySnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);

  useEffect(() => {
    if (currentOrganization) {
      loadData();
    }
  }, [eventId, currentOrganization]);

  const loadData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const [typesData, inventoryData] = await Promise.all([
        organizerApi.ticketTypes.list(eventId, currentOrganization.id),
        organizerApi.inventory.getSnapshot(eventId, currentOrganization.id),
      ]);
      setTicketTypes(typesData);
      setInventory(inventoryData);
    } catch (error) {
      console.error('Failed to load ticket data:', error);
      toast.error('Failed to load ticket data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateTicketTypeDto) => {
    if (!currentOrganization) return;

    try {
      await organizerApi.ticketTypes.create(eventId, data, currentOrganization.id);
      toast.success('Ticket type created successfully');
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to create ticket type:', error);
      toast.error('Failed to create ticket type');
      throw error;
    }
  };

  const handleUpdate = async (data: CreateTicketTypeDto) => {
    if (!currentOrganization || !editingTicket) return;

    try {
      await organizerApi.ticketTypes.update(
        editingTicket.id,
        data,
        currentOrganization.id
      );
      toast.success('Ticket type updated successfully');
      setEditingTicket(null);
      loadData();
    } catch (error) {
      console.error('Failed to update ticket type:', error);
      toast.error('Failed to update ticket type');
      throw error;
    }
  };

  const handleDelete = async (ticketType: TicketType) => {
    if (!currentOrganization) return;

    if (!confirm(`Are you sure you want to delete "${ticketType.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await organizerApi.ticketTypes.delete(ticketType.id, currentOrganization.id);
      toast.success('Ticket type deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete ticket type:', error);
      toast.error('Failed to delete ticket type');
    }
  };

  const handleEdit = (ticketType: TicketType) => {
    setEditingTicket(ticketType);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading ticket types...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inventory Summary */}
      {inventory && (
        <div className="grid grid-cols-4 gap-4">
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Sold</p>
            </div>
            <p className="text-2xl font-bold">{formatNumber(inventory.totals.sold)}</p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Checked In</p>
            </div>
            <p className="text-2xl font-bold">{formatNumber(inventory.totals.checkedIn)}</p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Gross Revenue</p>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(inventory.totals.grossRevenueCents, inventory.ticketTypes[0]?.currency || 'USD')}
            </p>
          </div>

          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Fee Revenue</p>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(inventory.totals.feeRevenueCents, inventory.ticketTypes[0]?.currency || 'USD')}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ticket Types</h2>
          <p className="text-muted-foreground mt-1">
            Manage ticket types and pricing for this event
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Add Ticket Type
        </button>
      </div>

      {/* Ticket Types Grid */}
      {ticketTypes.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Ticket Types</h3>
          <p className="text-muted-foreground mb-4">
            Create your first ticket type to start selling tickets
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
          >
            Create Ticket Type
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ticketTypes.map((ticketType) => (
            <TicketTypeCard
              key={ticketType.id}
              ticketType={ticketType}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Form */}
      {(showForm || editingTicket) && (
        <TicketTypeForm
          ticketType={editingTicket || undefined}
          onSubmit={editingTicket ? handleUpdate : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditingTicket(null);
          }}
        />
      )}
    </div>
  );
}
