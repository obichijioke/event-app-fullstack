import { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Select Seats - Event ${id}`,
    description: 'Interactive seatmap for seat selection',
  };
}

export default async function EventSeatmapPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Select Your Seats</h1>
      
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Seatmap Canvas */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg p-6 shadow-card">
            <div className="aspect-video bg-muted rounded flex items-center justify-center">
              {/* TODO: Interactive seatmap component */}
              <p className="text-muted-foreground">Interactive Seatmap (Event ID: {id})</p>
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-success rounded"></div>
                <span className="text-sm">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-warning rounded"></div>
                <span className="text-sm">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted rounded"></div>
                <span className="text-sm">Unavailable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selection Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg p-6 shadow-card sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Your Selection</h2>
            {/* TODO: Selected seats list and total */}
            <p className="text-muted-foreground text-sm mb-4">No seats selected</p>
            
            <button className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:opacity-90 transition">
              Continue to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

