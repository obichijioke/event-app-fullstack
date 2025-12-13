import { OrganizationStatus } from '@prisma/client';

export const organizations = [
  {
    id: 'seed-org-soundwave',
    ownerId: 'seed-user-organizer',
    name: 'Soundwave Collective',
    legalName: 'Soundwave Collective LTD',
    website: 'https://soundwave.example.com',
    country: 'NG',
    supportEmail: 'support@soundwave.example.com',
    status: OrganizationStatus.approved,
  },
];
