'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Search, ThumbsUp } from 'lucide-react';
import { Heading } from '@/components/ui';
import { cn } from '@/lib/utils';
import { fetchEventFAQs, EventFAQItem, searchFAQs, trackFAQView, markFAQHelpful } from '@/lib/events';

interface EventFAQProps {
  eventId: string;
  className?: string;
}

export function EventFAQ({ eventId, className }: EventFAQProps) {
  const [faqs, setFaqs] = useState<EventFAQItem[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [markedHelpful, setMarkedHelpful] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadFAQs() {
      setLoading(true);
      if (searchQuery.trim()) {
        const results = await searchFAQs(eventId, searchQuery);
        setFaqs(results);
      } else {
        const data = await fetchEventFAQs(eventId);
        setFaqs(data);
      }
      setLoading(false);
    }
    loadFAQs();
  }, [eventId, searchQuery]);

  const toggleFAQ = async (index: number, faqId: string) => {
    if (openIndex !== index) {
      // Track view when expanding
      await trackFAQView(faqId);
      setOpenIndex(index);
    } else {
      setOpenIndex(null);
    }
  };

  const handleMarkHelpful = async (faqId: string) => {
    await markFAQHelpful(faqId);
    setMarkedHelpful(prev => new Set(prev).add(faqId));
  };

  if (loading) {
    return (
      <section className={cn('rounded border border-border bg-card p-6', className)}>
        <Heading as="h2" className="text-xl font-semibold mb-6">
          Frequently Asked Questions
        </Heading>
        <p className="text-sm text-muted-foreground">Loading FAQs...</p>
      </section>
    );
  }

  if (faqs.length === 0) {
    return (
      <section className={cn('rounded border border-border bg-card p-6', className)}>
        <Heading as="h2" className="text-xl font-semibold mb-6">
          Frequently Asked Questions
        </Heading>
        <p className="text-sm text-muted-foreground">No FAQs available for this event yet.</p>
      </section>
    );
  }

  return (
    <section className={cn('rounded border border-border bg-card p-6', className)}>
      <Heading as="h2" className="text-xl font-semibold mb-6">
        Frequently Asked Questions
      </Heading>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <FAQAccordionItem
            key={faq.id}
            faq={faq}
            isOpen={openIndex === index}
            onToggle={() => toggleFAQ(index, faq.id)}
            onMarkHelpful={() => handleMarkHelpful(faq.id)}
            isMarkedHelpful={markedHelpful.has(faq.id)}
          />
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Have more questions?{' '}
          <button className="text-primary hover:underline font-medium">
            Contact the organizer
          </button>
        </p>
      </div>
    </section>
  );
}

interface FAQAccordionItemProps {
  faq: EventFAQItem;
  isOpen: boolean;
  onToggle: () => void;
  onMarkHelpful: () => void;
  isMarkedHelpful: boolean;
}

function FAQAccordionItem({ faq, isOpen, onToggle, onMarkHelpful, isMarkedHelpful }: FAQAccordionItemProps) {
  return (
    <div className="border border-border rounded overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-foreground pr-4">{faq.question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      <div className={cn('transition-all duration-200 overflow-hidden', isOpen ? 'max-h-96' : 'max-h-0')}>
        <div className="p-4 pt-0 bg-muted/30">
          <p className="text-sm text-foreground leading-relaxed mb-3">{faq.answer}</p>

          {/* Footer with stats and helpful button */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <span>{faq.viewCount || 0} views • {faq.helpfulCount || 0} found helpful</span>

            {!isMarkedHelpful && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkHelpful();
                }}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <ThumbsUp className="w-3 h-3" />
                Helpful
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
