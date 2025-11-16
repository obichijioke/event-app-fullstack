import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appDir = join(__dirname, '..', 'app');

// Route configurations
const routes = [
  // Dashboard & Overview
  { path: 'organizer/analytics', title: 'Analytics', description: 'Sales trends and revenue analytics', type: 'static' },
  
  // Organization Management
  { path: 'organizer/organization', title: 'Organization Settings', description: 'Manage organization profile and settings', type: 'static' },
  { path: 'organizer/organization/members', title: 'Team Members', description: 'Manage organization team members', type: 'static' },
  { path: 'organizer/organization/payout-accounts', title: 'Payout Accounts', description: 'Manage payout accounts', type: 'static' },
  
  // Event Management
  { path: 'organizer/events', title: 'Events', description: 'Manage all events', type: 'static' },
  { path: 'organizer/events/create', title: 'Create Event', description: 'Create a new event', type: 'static' },
  { path: 'organizer/events/[eventId]', title: 'Event Dashboard', description: 'Event overview and analytics', type: 'dynamic', param: 'eventId' },
  { path: 'organizer/events/[eventId]/edit', title: 'Edit Event', description: 'Edit event details', type: 'dynamic', param: 'eventId' },
  { path: 'organizer/events/[eventId]/tickets', title: 'Ticket Management', description: 'Manage event tickets', type: 'dynamic', param: 'eventId' },
  { path: 'organizer/events/[eventId]/seatmap', title: 'Seatmap Configuration', description: 'Configure event seatmap', type: 'dynamic', param: 'eventId' },
  { path: 'organizer/events/[eventId]/orders', title: 'Event Orders', description: 'View and manage event orders', type: 'dynamic', param: 'eventId' },
  { path: 'organizer/events/[eventId]/attendees', title: 'Attendees', description: 'View event attendees', type: 'dynamic', param: 'eventId' },
  { path: 'organizer/events/[eventId]/check-in', title: 'Check-in', description: 'Event check-in interface', type: 'dynamic', param: 'eventId' },
  { path: 'organizer/events/[eventId]/promo-codes', title: 'Promo Codes', description: 'Manage promo codes', type: 'dynamic', param: 'eventId' },
  { path: 'organizer/events/[eventId]/holds', title: 'Inventory Holds', description: 'Manage inventory holds', type: 'dynamic', param: 'eventId' },
  { path: 'organizer/events/[eventId]/occurrences', title: 'Event Occurrences', description: 'Manage event occurrences', type: 'dynamic', param: 'eventId' },
  
  // Venue & Seatmap Management
  { path: 'organizer/venues', title: 'Venues', description: 'Manage venues', type: 'static' },
  { path: 'organizer/venues/create', title: 'Create Venue', description: 'Create a new venue', type: 'static' },
  { path: 'organizer/venues/[venueId]/edit', title: 'Edit Venue', description: 'Edit venue details', type: 'dynamic', param: 'venueId' },
  { path: 'organizer/seatmaps', title: 'Seatmaps', description: 'Manage seatmaps', type: 'static' },
  { path: 'organizer/seatmaps/create', title: 'Create Seatmap', description: 'Create a new seatmap', type: 'static' },
  { path: 'organizer/seatmaps/[seatmapId]/edit', title: 'Edit Seatmap', description: 'Edit seatmap layout', type: 'dynamic', param: 'seatmapId' },
  
  // Financial Management
  { path: 'organizer/payouts', title: 'Payouts', description: 'Manage payouts', type: 'static' },
  { path: 'organizer/payouts/[payoutId]', title: 'Payout Details', description: 'View payout details', type: 'dynamic', param: 'payoutId' },
  { path: 'organizer/refunds', title: 'Refunds', description: 'Manage refund requests', type: 'static' },
  { path: 'organizer/disputes', title: 'Disputes', description: 'Manage payment disputes', type: 'static' },
  { path: 'organizer/reports', title: 'Financial Reports', description: 'View financial reports', type: 'static' },
  
  // Settings & Integrations
  { path: 'organizer/webhooks', title: 'Webhooks', description: 'Manage webhook endpoints', type: 'static' },
  { path: 'organizer/api-keys', title: 'API Keys', description: 'Manage API keys', type: 'static' },
  { path: 'organizer/fee-overrides', title: 'Fee Schedules', description: 'View fee schedule overrides', type: 'static' },
];

// Template for static pages
function generateStaticPage(title, description) {
  return `import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '${title}',
  description: '${description}',
};

export default function ${title.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">${title}</h1>
          <p className="text-muted-foreground mt-1">${description}</p>
        </div>
        <Link
          href="/organizer"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-card p-6">
        <p className="text-muted-foreground">Content for ${title} will be implemented here.</p>
        {/* TODO: Implement ${title} functionality */}
      </div>
    </div>
  );
}
`;
}

// Template for dynamic pages
function generateDynamicPage(title, description, param) {
  const paramName = param;
  const componentName = title.replace(/[^a-zA-Z0-9]/g, '');
  
  return `import { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  params: Promise<{ ${paramName}: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ${paramName} } = await params;
  return {
    title: \`${title} - \${${paramName}}\`,
    description: '${description}',
  };
}

export default async function ${componentName}Page({ params }: Props) {
  const { ${paramName} } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">${title}</h1>
          <p className="text-muted-foreground mt-1">ID: {${paramName}}</p>
        </div>
        <Link
          href="/organizer"
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:opacity-90 transition text-sm"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-card p-6">
        <p className="text-muted-foreground">Content for ${title} will be implemented here.</p>
        {/* TODO: Implement ${title} functionality */}
      </div>
    </div>
  );
}
`;
}

// Generate all route files
console.log('🚀 Generating organizer routes...\n');

let successCount = 0;
let errorCount = 0;

routes.forEach(route => {
  try {
    const filePath = join(appDir, route.path, 'page.tsx');
    const fileDir = dirname(filePath);
    
    // Create directory if it doesn't exist
    mkdirSync(fileDir, { recursive: true });
    
    // Generate content based on type
    const content = route.type === 'static' 
      ? generateStaticPage(route.title, route.description)
      : generateDynamicPage(route.title, route.description, route.param);
    
    // Write file
    writeFileSync(filePath, content, 'utf8');
    
    console.log(`✅ Created: ${route.path}/page.tsx`);
    successCount++;
  } catch (error) {
    console.error(`❌ Error creating ${route.path}/page.tsx:`, error.message);
    errorCount++;
  }
});

console.log(`\n✨ Generation complete!`);
console.log(`   Success: ${successCount} files`);
console.log(`   Errors: ${errorCount} files`);

