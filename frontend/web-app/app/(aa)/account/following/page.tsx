import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Following',
  description: 'Organizers you follow',
};

export default function FollowingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Following</h1>

      {/* Organizers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* TODO: Map through followed organizers */}
        <div className="bg-card rounded-lg shadow-card p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-muted rounded-full flex-shrink-0"></div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Organizer Name</h3>
              <p className="text-sm text-muted-foreground">5 upcoming events</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/organizers/123"
              className="flex-1 text-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm"
            >
              View Profile
            </Link>
            <button className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition text-sm">
              Unfollow
            </button>
          </div>
        </div>

        <p className="col-span-full text-center text-muted-foreground py-8">
          You&apos;re not following any organizers yet
        </p>
      </div>
    </div>
  );
}
