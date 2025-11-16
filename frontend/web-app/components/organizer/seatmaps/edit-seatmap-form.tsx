'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SeatmapEditor, type SeatmapSpec } from './seatmap-editor';
import { seatmapsApi } from '@/lib/api/seatmaps-api';
import toast from 'react-hot-toast';

interface EditSeatmapFormProps {
  seatmapId: string;
}

export function EditSeatmapForm({ seatmapId }: EditSeatmapFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [initialSpec, setInitialSpec] = useState<SeatmapSpec | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSeatmap();
  }, [seatmapId]);

  const loadSeatmap = async () => {
    setLoading(true);
    try {
      const seatmap = await seatmapsApi.getSeatmap(seatmapId);
      setName(seatmap.name);
      setInitialSpec(seatmap.spec);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load seatmap');
      router.push('/organizer/seatmaps');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (spec: SeatmapSpec) => {
    setSaving(true);
    try {
      await seatmapsApi.updateSeatmap(seatmapId, {
        name,
        spec,
      });
      toast.success('Seatmap updated successfully');
      router.push('/organizer/seatmaps');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update seatmap');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure? Any unsaved changes will be lost.')) {
      router.push('/organizer/seatmaps');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading seatmap...</div>
      </div>
    );
  }

  if (!initialSpec) {
    return (
      <div className="bg-card rounded-lg shadow-card p-8 text-center">
        <p className="text-muted-foreground">Failed to load seatmap</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Name Editor */}
      <div className="bg-card rounded-lg shadow-card border border-border p-4">
        <label className="block text-sm font-medium mb-2">Seatmap Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Editor */}
      <SeatmapEditor
        initialSpec={initialSpec}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}
