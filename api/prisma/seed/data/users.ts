import { PlatformRole } from '@prisma/client';

export const users = [
  {
    id: 'seed-user-organizer',
    email: 'organizer@eventflow.dev',
    password: process.env.SEED_USER_PASSWORD ?? 'Password123!',
    name: 'Seed Organizer',
    phone: '+2348000000000',
    role: PlatformRole.organizer,
    status: 'active',
  },
  {
    id: 'seed-user-attendee-1',
    email: 'attendee@eventflow.dev',
    password: process.env.SEED_USER_PASSWORD ?? 'Password123!',
    name: 'Jane Doe',
    phone: '+2348011111111',
    role: PlatformRole.attendee,
    status: 'active',
  },
  {
    id: 'seed-user-attendee-2',
    email: 'john.smith@eventflow.dev',
    password: process.env.SEED_USER_PASSWORD ?? 'Password123!',
    name: 'John Smith',
    phone: '+2348022222222',
    role: PlatformRole.attendee,
    status: 'active',
  },
];
