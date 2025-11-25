import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAnnouncementsAndFAQs() {
  console.log('🌱 Seeding announcements and FAQs...');

  // Get first event for demo
  const event = await prisma.event.findFirst({
    where: {
      status: 'live',
    },
  });

  if (!event) {
    console.log('⚠️  No live events found. Skipping announcements and FAQs seed.');
    return;
  }

  console.log(`📌 Found event: ${event.title} (${event.id})`);

  // Seed announcements
  console.log('📢 Creating announcements...');
  await prisma.eventAnnouncement.createMany({
    data: [
      {
        eventId: event.id,
        title: 'Updated Gate Opening Time',
        message: 'Gates will now open at 5:00 PM instead of 6:00 PM. Please plan your arrival accordingly to avoid crowds.',
        type: 'important',
        isActive: true,
        publishedAt: new Date(),
        viewCount: 0,
      },
      {
        eventId: event.id,
        title: 'Parking Information',
        message: 'Additional parking is available at the nearby shopping complex. A free shuttle service will run every 15 minutes.',
        type: 'info',
        isActive: true,
        publishedAt: new Date(),
        viewCount: 0,
      },
      {
        eventId: event.id,
        title: 'Weather Update',
        message: 'Please note that this is an outdoor event. In case of heavy rain, the event will be moved indoors. Check your email for updates.',
        type: 'warning',
        isActive: true,
        publishedAt: new Date(),
        viewCount: 0,
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created 3 announcements');

  // Seed FAQs
  console.log('❓ Creating FAQs...');
  await prisma.eventFAQ.createMany({
    data: [
      {
        eventId: event.id,
        question: 'What should I bring to the event?',
        answer: 'Please bring your ticket (printed or on your mobile device), a valid ID, and any personal items you may need. Bags may be subject to search upon entry.',
        sortOrder: 1,
        isActive: true,
        viewCount: 0,
        helpfulCount: 0,
        source: 'organizer',
      },
      {
        eventId: event.id,
        question: 'Is parking available at the venue?',
        answer: 'Yes, parking is available at the venue. Please arrive early as spaces are limited. Additional parking information will be sent to ticket holders closer to the event date.',
        sortOrder: 2,
        isActive: true,
        viewCount: 0,
        helpfulCount: 0,
        source: 'organizer',
      },
      {
        eventId: event.id,
        question: 'What is the refund policy?',
        answer: 'Refund policies vary by event. Please check the "Policies" section for specific refund terms. Generally, tickets are non-refundable unless the event is canceled or rescheduled.',
        sortOrder: 3,
        isActive: true,
        viewCount: 0,
        helpfulCount: 0,
        source: 'organizer',
      },
      {
        eventId: event.id,
        question: 'Can I transfer my ticket to someone else?',
        answer: 'Ticket transfer policies vary by event. Please check the "Policies" section for specific transfer terms. If transfers are allowed, you can do so through your account dashboard.',
        sortOrder: 4,
        isActive: true,
        viewCount: 0,
        helpfulCount: 0,
        source: 'organizer',
      },
      {
        eventId: event.id,
        question: 'What time should I arrive?',
        answer: 'We recommend arriving at least 30-45 minutes before the event start time to allow time for parking, entry, and finding your seat. Gates typically open 1 hour before the event.',
        sortOrder: 5,
        isActive: true,
        viewCount: 0,
        helpfulCount: 0,
        source: 'organizer',
      },
      {
        eventId: event.id,
        question: 'Are there age restrictions for this event?',
        answer: 'Age restrictions vary by event and will be clearly stated on the event page. Some events may require attendees to be 18+ or 21+. Children under a certain age may require adult supervision.',
        sortOrder: 6,
        isActive: true,
        viewCount: 0,
        helpfulCount: 0,
        source: 'organizer',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Created 6 FAQs');

  console.log('🎉 Seeding complete!');
}

seedAnnouncementsAndFAQs()
  .catch((error) => {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
