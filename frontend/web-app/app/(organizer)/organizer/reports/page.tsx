import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FinancialReports } from '@/components/organizer/reports/financial-reports';

export const metadata: Metadata = {
  title: 'Financial Reports',
  description: 'View and export financial reports for your organization',
};

export default function FinancialReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/organizer"
          className="p-2 hover:bg-secondary rounded-md transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground mt-1">Analyze your sales and revenue performance</p>
        </div>
      </div>

      <FinancialReports />
    </div>
  );
}
