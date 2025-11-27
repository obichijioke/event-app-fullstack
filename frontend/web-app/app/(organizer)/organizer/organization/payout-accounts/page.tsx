import { Metadata } from 'next';
import { OrganizerPayoutAccounts } from './client-page';

export const metadata: Metadata = {
  title: 'Payout Accounts',
  description: 'Manage payout accounts for your organization',
};

export default function PayoutAccountsPage() {
  return <OrganizerPayoutAccounts />;
}
