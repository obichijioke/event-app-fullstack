'use client';

import Link from 'next/link';
import { CreateDisputeWizard } from '@/components/buyer/disputes/create-dispute-wizard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Scale } from 'lucide-react';

export default function CreateDisputePage() {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-6 text-white flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur mb-2">
              <Scale className="h-4 w-4" />
              Disputes
            </div>
            <h1 className="text-3xl font-semibold">Create a Dispute</h1>
            <p className="text-sm text-slate-200 mt-1">
              Start a new dispute for one of your orders.
            </p>
          </div>
          <Link href="/account/disputes">
            <Button variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Disputes
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <CreateDisputeWizard />
      </Card>
    </div>
  );
}
