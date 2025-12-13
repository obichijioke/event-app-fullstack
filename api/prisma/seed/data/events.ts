// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { EventStatus, TicketKind, Visibility } from '@prisma/client';

const now = new Date();

function daysFromNow(days: number, hour = 18) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

export const events = [
  {
    id: 'seed-event-lagos-soundfest',
    title: 'Lagos Sound Fest',
    shortDescription: 'The ultimate Afrobeats experience in Lagos.',
    description:
      'An outdoor celebration of Afrobeats and amapiano featuring live performances, immersive art, and curated food vendors.',
    venueId: 'seed-venue-lagos',
    categoryId: 'seed-category-music',
    startAt: daysFromNow(5, 19),
    endAt: daysFromNow(5, 23),
    doorTime: daysFromNow(5, 18),
    coverImageUrl:
      'https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=1600&q=80',
    language: 'en',
    latitude: 6.5244,
    longitude: 3.3792,
    agenda: [
      {
        time: '18:00',
        title: 'Doors Open',
        description: 'Check-in and security screening.',
      },
      {
        time: '19:30',
        title: 'Opening Acts',
        description: 'Performances by emerging local artists.',
      },
      {
        time: '21:00',
        title: 'Main Show',
        description: 'Headliners take the stage.',
      },
    ],
    speakers: [
      {
        name: 'DJ Spinall',
        role: 'Headliner',
        bio: 'Top Afrobeats DJ and Producer.',
        avatarUrl:
          'https://i.scdn.co/image/ab6761610000e5ebc8b0e7e7e7e7e7e7e7e7e7e7',
      },
    ],
    tags: ['afrobeats', 'music', 'festival', 'lagos'],
    ticketTypes: [
      {
        id: 'seed-ticket-lagos-ga',
        name: 'General Admission',
        priceCents: BigInt(25000),
        feeCents: BigInt(1500),
        capacity: 3000,
        salesStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        salesEnd: daysFromNow(4, 23),
        kind: TicketKind.GA,
      },
      {
        id: 'seed-ticket-lagos-vip',
        name: 'VIP Terrace',
        priceCents: BigInt(60000),
        feeCents: BigInt(2500),
        capacity: 250,
        salesStart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        salesEnd: daysFromNow(4, 23),
        kind: TicketKind.GA,
      },
    ],
    policies: {
      refundPolicy:
        'Full refunds are available up to 72 hours before the show.',
      transferAllowed: true,
      resaleAllowed: true,
      transferCutoff: '3 hours',
    },
  },
  {
    id: 'seed-event-abuja-tech-summit',
    title: 'Abuja Future of Tech Summit',
    shortDescription: 'Innovating for the future of Africa.',
    description:
      'A two-day summit covering AI, fintech, and creative technology with hands-on labs and investor office hours.',
    venueId: 'seed-venue-abuja',
    categoryId: 'seed-category-tech',
    startAt: daysFromNow(12, 9),
    endAt: daysFromNow(13, 17),
    doorTime: daysFromNow(12, 8),
    coverImageUrl:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80',
    language: 'en',
    latitude: 9.0765,
    longitude: 7.3986,
    agenda: [
      {
        time: '09:00',
        title: 'Welcome Keynote',
        description: 'Opening remarks by the Minister of Technology.',
      },
      {
        time: '10:30',
        title: 'Panel: Fintech in 2025',
        description: 'Discussion with industry leaders.',
      },
      {
        time: '13:00',
        title: 'Networking Lunch',
        description: 'Connect with other attendees.',
      },
    ],
    speakers: [
      {
        name: 'Dr. Omobola Johnson',
        role: 'Keynote Speaker',
        bio: 'Technologist and former Minister of Communication Technology.',
      },
    ],
    tags: ['tech', 'summit', 'ai', 'fintech'],
    ticketTypes: [
      {
        id: 'seed-ticket-abuja-standard',
        name: 'Standard Pass',
        priceCents: BigInt(45000),
        feeCents: BigInt(2000),
        capacity: 1200,
        salesStart: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        salesEnd: daysFromNow(11, 18),
        kind: TicketKind.GA,
      },
      {
        id: 'seed-ticket-abuja-founder',
        name: 'Founder Track',
        priceCents: BigInt(90000),
        feeCents: BigInt(3500),
        capacity: 300,
        salesStart: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        salesEnd: daysFromNow(11, 18),
        kind: TicketKind.GA,
      },
    ],
    policies: {
      refundPolicy:
        'Tickets are refundable up to 7 days before day 1. Transfers allowed until 24 hours before check-in.',
      transferAllowed: true,
      resaleAllowed: false,
      transferCutoff: '24 hours',
    },
  },
  {
    id: 'seed-event-accra-art-night',
    title: 'Accra Night Market & Art Walk',
    shortDescription: 'Art, food, and culture under the stars.',
    description:
      'Curated evening market featuring emerging designers, live muralists, and intimate acoustic sets along Oxford Street.',
    venueId: 'seed-venue-accra',
    categoryId: 'seed-category-culture',
    startAt: daysFromNow(3, 17),
    endAt: daysFromNow(3, 22),
    doorTime: daysFromNow(3, 16),
    coverImageUrl:
      'https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=1600&q=80',
    language: 'en',
    latitude: 5.6037,
    longitude: -0.187,
    agenda: [],
    speakers: [],
    tags: ['art', 'market', 'culture', 'accra'],
    ticketTypes: [
      {
        id: 'seed-ticket-accra-market',
        name: 'Market Pass',
        priceCents: BigInt(15000),
        feeCents: BigInt(800),
        capacity: 800,
        salesStart: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        salesEnd: daysFromNow(2, 22),
        kind: TicketKind.GA,
      },
    ],
    policies: {
      refundPolicy:
        'Non-refundable, but you may transfer your pass up to 6 hours before gates open.',
      transferAllowed: true,
      resaleAllowed: false,
      transferCutoff: '6 hours',
    },
  },
  {
    id: 'seed-event-lagos-fashion-week',
    title: 'Lagos Fashion Week 2025',
    shortDescription: 'The premier fashion event in Africa.',
    description:
      'Experience the future of African fashion. Featuring runway shows from top designers, exhibitions, and exclusive after-parties.',
    venueId: 'seed-venue-lagos',
    categoryId: 'seed-category-culture',
    startAt: daysFromNow(20, 16),
    endAt: daysFromNow(22, 23),
    doorTime: daysFromNow(20, 15),
    coverImageUrl:
      'https://images.unsplash.com/photo-1537832816519-689ad163238b?auto=format&fit=crop&w=1600&q=80',
    language: 'en',
    latitude: 6.4253,
    longitude: 3.4219,
    agenda: [
      {
        time: '16:00',
        title: 'Red Carpet',
        description: 'Arrivals and photos.',
      },
      {
        time: '18:00',
        title: 'Runway Show 1',
        description: 'Emerging Designers.',
      },
      {
        time: '20:00',
        title: 'Runway Show 2',
        description: 'Established Designers.',
      },
    ],
    speakers: [],
    tags: ['fashion', 'runway', 'style', 'lagos'],
    ticketTypes: [
      {
        id: 'seed-ticket-fashion-standard',
        name: 'Standard Seat',
        priceCents: BigInt(30000),
        feeCents: BigInt(1800),
        capacity: 1000,
        salesStart: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        salesEnd: daysFromNow(19, 12),
        kind: TicketKind.SEATED,
      },
      {
        id: 'seed-ticket-fashion-vip',
        name: 'Front Row VIP',
        priceCents: BigInt(150000),
        feeCents: BigInt(5000),
        capacity: 100,
        salesStart: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        salesEnd: daysFromNow(19, 12),
        kind: TicketKind.SEATED,
      },
    ],
    policies: {
      refundPolicy: 'No refunds.',
      transferAllowed: true,
      resaleAllowed: true,
      transferCutoff: '12 hours',
    },
  },
];
