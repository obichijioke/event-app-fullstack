import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appDir = join(__dirname, '..', 'app');

// Route configurations
const routes = [
  // Platform Management
  { path: 'admin', title: 'Admin Dashboard', description: 'Platform metrics and system health', type: 'static' },
  { path: 'admin/users', title: 'User Management', description: 'Manage platform users', type: 'static' },
  { path: 'admin/users/[userId]', title: 'User Details', description: 'View user profile and activity', type: 'dynamic', param: 'userId' },
  { path: 'admin/organizations', title: 'Organization Management', description: 'Manage organizations', type: 'static' },
  { path: 'admin/organizations/[orgId]', title: 'Organization Details', description: 'View organization details', type: 'dynamic', param: 'orgId' },
  { path: 'admin/events', title: 'Event Management', description: 'Manage all platform events', type: 'static' },
  
  // Financial Management
  { path: 'admin/payments', title: 'Payment Monitoring', description: 'Monitor all payments', type: 'static' },
  { path: 'admin/payouts', title: 'Payout Management', description: 'Manage platform payouts', type: 'static' },
  { path: 'admin/refunds', title: 'Refund Oversight', description: 'Oversee refund requests', type: 'static' },
  { path: 'admin/disputes', title: 'Dispute Management', description: 'Manage payment disputes', type: 'static' },
  { path: 'admin/revenue', title: 'Revenue Analytics', description: 'Platform revenue analytics', type: 'static' },
  
  // Configuration & Settings
  { path: 'admin/categories', title: 'Category Management', description: 'Manage event categories', type: 'static' },
  { path: 'admin/tax-rates', title: 'Tax Configuration', description: 'Configure tax rates', type: 'static' },
  { path: 'admin/fee-schedules', title: 'Fee Management', description: 'Manage platform fees', type: 'static' },
  { path: 'admin/site-settings', title: 'Platform Configuration', description: 'Configure platform settings', type: 'static' },
  
  // Monitoring & Logs
  { path: 'admin/audit-logs', title: 'Audit Logs', description: 'View platform audit logs', type: 'static' },
  { path: 'admin/webhooks', title: 'Webhook Monitoring', description: 'Monitor webhook activity', type: 'static' },
  { path: 'admin/sessions', title: 'Session Monitoring', description: 'Monitor active sessions', type: 'static' },
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
          href="/admin"
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
          href="/admin"
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
console.log('🚀 Generating admin routes...\n');

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

