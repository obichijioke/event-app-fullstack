import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FinancialSummaryWidget } from '@/components/organizer/dashboard/financial-summary-widget';
import { RevenueChart } from '@/components/organizer/dashboard/revenue-chart';

export const metadata: Metadata = {
  title: 'Finance',
  description: 'Manage your organization finances, revenue, and payouts',
};

export default function FinancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/organizer"
            className="p-2 hover:bg-secondary rounded-md transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Finance</h1>
            <p className="text-muted-foreground mt-1">Track your revenue, fees, payouts, and financial performance</p>
          </div>
        </div>
      </div>

      {/* Financial Overview Section */}
      <div className="space-y-8">
        <FinancialSummaryWidget />
        <RevenueChart />
      </div>
    </div>
  );
}
