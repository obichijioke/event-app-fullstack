'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Trash2, Edit2, Eye, ThumbsUp, GripVertical, Save, X } from 'lucide-react';
import { Button, Heading } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
  viewCount: number;
  helpfulCount: number;
  source: string;
}

export default function FAQsManagementPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadFAQs();
  }, [eventId]);

  async function loadFAQs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/faqs?includeInactive=true`);
      if (res.ok) {
        const data = await res.json();
        setFaqs(data);
      }
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const res = await fetch(`/api/events/${eventId}/faqs/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadFAQs();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = faqs.findIndex((f) => f.id === active.id);
      const newIndex = faqs.findIndex((f) => f.id === over.id);

      const newOrder = arrayMove(faqs, oldIndex, newIndex);
      setFaqs(newOrder);

      // Save new order to backend
      try {
        await fetch(`/api/events/${eventId}/faqs/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            faqIds: newOrder.map((f) => f.id),
          }),
        });
      } catch (error) {
        console.error('Failed to reorder:', error);
        // Revert on error
        loadFAQs();
      }
    }
  }

  const totalViews = faqs.reduce((sum, faq) => sum + faq.viewCount, 0);
  const totalHelpful = faqs.reduce((sum, faq) => sum + faq.helpfulCount, 0);
  const activeFaqs = faqs.filter((f) => f.isActive).length;

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading FAQs...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Heading as="h1" className="text-3xl font-bold mb-2">
            FAQs Management
          </Heading>
          <p className="text-muted-foreground">
            Create, organize, and manage frequently asked questions
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New FAQ
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total FAQs" value={faqs.length} />
        <StatCard label="Active" value={activeFaqs} color="green" />
        <StatCard label="Total Views" value={totalViews} color="blue" />
        <StatCard label="Helpful Votes" value={totalHelpful} color="amber" />
      </div>

      {/* FAQs List */}
      {faqs.length === 0 ? (
        <div className="text-center py-12 border border-border rounded bg-card">
          <p className="text-muted-foreground mb-4">
            No FAQs yet. Create your first one!
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create FAQ
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Drag to reorder • Click to edit
            </p>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={faqs.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {faqs.map((faq) => (
                <SortableFAQCard
                  key={faq.id}
                  faq={faq}
                  isEditing={editingId === faq.id}
                  onEdit={() => setEditingId(faq.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSave={() => {
                    setEditingId(null);
                    loadFAQs();
                  }}
                  onDelete={handleDelete}
                  eventId={eventId}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateFAQModal
          eventId={eventId}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadFAQs();
          }}
        />
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color?: 'default' | 'green' | 'blue' | 'amber';
}

function StatCard({ label, value, color = 'default' }: StatCardProps) {
  const colorClasses = {
    default: 'text-foreground',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="border border-border rounded bg-card p-4">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-2xl font-bold', colorClasses[color])}>{value}</p>
    </div>
  );
}

interface SortableFAQCardProps {
  faq: FAQ;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: (id: string) => void;
  eventId: string;
}

function SortableFAQCard({
  faq,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  eventId,
}: SortableFAQCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [editData, setEditData] = useState({
    question: faq.question,
    answer: faq.answer,
    isActive: faq.isActive,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/faqs/${faq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        onSave();
      }
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border border-border rounded bg-card p-4',
        isDragging && 'opacity-50',
        !faq.isActive && 'bg-muted/30'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        {!isEditing && (
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Question</label>
                <input
                  type="text"
                  value={editData.question}
                  onChange={(e) => setEditData({ ...editData, question: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Answer</label>
                <textarea
                  value={editData.answer}
                  onChange={(e) => setEditData({ ...editData, answer: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded bg-background text-sm"
                  rows={4}
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.isActive}
                  onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Active (visible to attendees)</span>
              </label>

              <div className="flex items-center gap-2">
                <Button onClick={handleSave} disabled={saving} size="sm">
                  <Save className="w-3 h-3 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button onClick={onCancelEdit} variant="ghost" size="sm">
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2 mb-2">
                <span className="text-sm font-semibold text-primary">Q{faq.sortOrder}</span>
                {!faq.isActive && (
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    Inactive
                  </span>
                )}
              </div>

              <h3 className="font-semibold mb-2">{faq.question}</h3>
              <p className="text-sm text-muted-foreground mb-3">{faq.answer}</p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {faq.viewCount} views
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {faq.helpfulCount} helpful
                </span>
                <span>Source: {faq.source}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit} title="Edit">
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(faq.id)}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface CreateFAQModalProps {
  eventId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateFAQModal({ eventId, onClose, onSuccess }: CreateFAQModalProps) {
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/events/${eventId}/faqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSuccess();
      } else {
        alert('Failed to create FAQ');
      }
    } catch (error) {
      console.error('Failed to create FAQ:', error);
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <Heading as="h2" className="text-2xl font-bold mb-6">
          Create FAQ
        </Heading>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Question</label>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded bg-background"
              required
              placeholder="What is your refund policy?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Answer</label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded bg-background"
              rows={6}
              required
              placeholder="Provide a clear and concise answer..."
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Active (visible to attendees)</span>
          </label>

          <div className="flex items-center gap-3 pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create FAQ'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
