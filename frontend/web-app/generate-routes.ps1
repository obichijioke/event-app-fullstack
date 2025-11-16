# PowerShell script to generate all remaining Next.js route files
# Run this from the frontend/web-app directory

Write-Host "Generating Next.js App Router structure..." -ForegroundColor Green

# Function to create a basic page component
function New-PageComponent {
    param(
        [string]$Path,
        [string]$Title,
        [string]$Description,
        [string]$Content,
        [bool]$HasParams = $false,
        [string]$ParamName = "id"
    )
    
    $dir = Split-Path -Parent $Path
    if ($dir -and !(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    if ($HasParams) {
        $template = @"
import { Metadata } from 'next';

type Props = {
  params: Promise<{ $ParamName: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { $ParamName } = await params;
  return {
    title: '$Title',
    description: '$Description',
  };
}

export default async function Page({ params }: Props) {
  const { $ParamName } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">$Title</h1>
      $Content
    </div>
  );
}
"@
    } else {
        $template = @"
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '$Title',
  description: '$Description',
};

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">$Title</h1>
      $Content
    </div>
  );
}
"@
    }
    
    Set-Content -Path $Path -Value $template
    Write-Host "Created: $Path" -ForegroundColor Cyan
}

# User/Account Routes
Write-Host "`nCreating User/Account routes..." -ForegroundColor Yellow

New-PageComponent -Path "app/account/security/page.tsx" -Title "Security Settings" -Description "Manage your security settings" -Content '<p className="text-muted-foreground">Security settings page</p>'

New-PageComponent -Path "app/account/orders/page.tsx" -Title "Order History" -Description "View all your orders" -Content '<p className="text-muted-foreground">Order history page</p>'

New-PageComponent -Path "app/orders/[orderId]/page.tsx" -Title "Order Details" -Description "View order details" -Content '<p className="text-muted-foreground">Order ID: {orderId}</p>' -HasParams $true -ParamName "orderId"

New-PageComponent -Path "app/account/tickets/page.tsx" -Title "My Tickets" -Description "View all your tickets" -Content '<p className="text-muted-foreground">Tickets page</p>'

New-PageComponent -Path "app/tickets/[ticketId]/page.tsx" -Title "Ticket Details" -Description "View ticket details and QR code" -Content '<p className="text-muted-foreground">Ticket ID: {ticketId}</p>' -HasParams $true -ParamName "ticketId"

New-PageComponent -Path "app/tickets/[ticketId]/transfer/page.tsx" -Title "Transfer Ticket" -Description "Transfer ticket to another person" -Content '<p className="text-muted-foreground">Transfer ticket {ticketId}</p>' -HasParams $true -ParamName "ticketId"

New-PageComponent -Path "app/account/transfers/page.tsx" -Title "Ticket Transfers" -Description "Manage ticket transfers" -Content '<p className="text-muted-foreground">Transfers page</p>'

New-PageComponent -Path "app/account/following/page.tsx" -Title "Following" -Description "Organizers you follow" -Content '<p className="text-muted-foreground">Following page</p>'

New-PageComponent -Path "app/account/refunds/page.tsx" -Title "Refunds" -Description "View refund requests and history" -Content '<p className="text-muted-foreground">Refunds page</p>'

# Support & Legal Routes
Write-Host "`nCreating Support & Legal routes..." -ForegroundColor Yellow

New-PageComponent -Path "app/help/page.tsx" -Title "Help Center" -Description "Get help and support" -Content '<p className="text-muted-foreground">Help center page</p>'

New-PageComponent -Path "app/contact/page.tsx" -Title "Contact Us" -Description "Get in touch with us" -Content '<p className="text-muted-foreground">Contact form</p>'

New-PageComponent -Path "app/terms/page.tsx" -Title "Terms of Service" -Description "Terms and conditions" -Content '<p className="text-muted-foreground">Terms of service</p>'

New-PageComponent -Path "app/privacy/page.tsx" -Title "Privacy Policy" -Description "Privacy policy and data protection" -Content '<p className="text-muted-foreground">Privacy policy</p>'

New-PageComponent -Path "app/refund-policy/page.tsx" -Title "Refund Policy" -Description "Refund and cancellation policy" -Content '<p className="text-muted-foreground">Refund policy</p>'

New-PageComponent -Path "app/about/page.tsx" -Title "About Us" -Description "Learn more about us" -Content '<p className="text-muted-foreground">About page</p>'

Write-Host "`n✅ Route generation complete!" -ForegroundColor Green
Write-Host "Note: Organizer, Moderator, and Admin routes require manual creation due to complexity." -ForegroundColor Yellow

