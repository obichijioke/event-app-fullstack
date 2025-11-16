import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search for events, organizers, and venues',
};

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Search</h1>

      {/* Search Input */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search for events, organizers, or venues..."
          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Filters */}
      <div className="mb-8">
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm">
            All
          </button>
          <button className="px-4 py-2 rounded-md bg-muted text-foreground text-sm hover:bg-muted/80">
            Events
          </button>
          <button className="px-4 py-2 rounded-md bg-muted text-foreground text-sm hover:bg-muted/80">
            Organizers
          </button>
          <button className="px-4 py-2 rounded-md bg-muted text-foreground text-sm hover:bg-muted/80">
            Venues
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-8">
        {/* Events Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* TODO: Map through event results */}
            <p className="text-muted-foreground">No events found</p>
          </div>
        </section>

        {/* Organizers Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Organizers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* TODO: Map through organizer results */}
            <p className="text-muted-foreground">No organizers found</p>
          </div>
        </section>

        {/* Venues Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">Venues</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* TODO: Map through venue results */}
            <p className="text-muted-foreground">No venues found</p>
          </div>
        </section>
      </div>
    </div>
  );
}

