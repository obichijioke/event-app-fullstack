'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Heading } from '@/components/ui';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

interface EventFAQProps {
  className?: string;
}

// Default FAQs - these should ideally come from the event data
const defaultFAQs: FAQItem[] = [
  {
    question: 'What should I bring to the event?',
    answer: 'Please bring your ticket (printed or on your mobile device), a valid ID, and any personal items you may need. Bags may be subject to search upon entry.',
  },
  {
    question: 'Is parking available at the venue?',
    answer: 'Yes, parking is available at the venue. Please arrive early as spaces are limited. Additional parking information will be sent to ticket holders closer to the event date.',
  },
  {
    question: 'What is the refund policy?',
    answer: 'Refund policies vary by event. Please check the "Policies" section for specific refund terms. Generally, tickets are non-refundable unless the event is canceled or rescheduled.',
  },
  {
    question: 'Can I transfer my ticket to someone else?',
    answer: 'Ticket transfer policies vary by event. Please check the "Policies" section for specific transfer terms. If transfers are allowed, you can do so through your account dashboard.',
  },
  {
    question: 'What time should I arrive?',
    answer: 'We recommend arriving at least 30-45 minutes before the event start time to allow time for parking, entry, and finding your seat. Gates typically open 1 hour before the event.',
  },
  {
    question: 'Are there age restrictions for this event?',
    answer: 'Age restrictions vary by event and will be clearly stated on the event page. Some events may require attendees to be 18+ or 21+. Children under a certain age may require adult supervision.',
  },
  {
    question: 'What items are prohibited at the venue?',
    answer: 'Prohibited items typically include weapons, outside food and beverages, professional cameras, recording devices, and illegal substances. Check the venue\'s policy for a complete list.',
  },
  {
    question: 'Is the venue wheelchair accessible?',
    answer: 'Most venues offer wheelchair accessibility. Please check the "Venue" tab for specific accessibility information or contact the organizer directly for assistance.',
  },
];

export function EventFAQ({ className }: EventFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={cn('rounded border border-border bg-card p-6', className)}>
      <Heading as="h2" className="text-xl font-semibold mb-6">
        Frequently Asked Questions
      </Heading>

      <div className="space-y-3">
        {defaultFAQs.map((faq, index) => (
          <FAQAccordionItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() => toggleFAQ(index)}
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
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQAccordionItem({ question, answer, isOpen, onToggle }: FAQAccordionItemProps) {
  return (
    <div className="border border-border rounded overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-muted/50 transition-colors text-left"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-foreground pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      <div
        className={cn(
          'transition-all duration-200 overflow-hidden',
          isOpen ? 'max-h-96' : 'max-h-0'
        )}
      >
        <div className="p-4 pt-0 bg-muted/30">
          <p className="text-sm text-foreground leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  );
}
