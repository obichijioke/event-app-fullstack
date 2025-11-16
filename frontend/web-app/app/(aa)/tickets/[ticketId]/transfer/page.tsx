import { Metadata } from 'next';

type Props = {
  params: Promise<{ ticketId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticketId } = await params;
  return {
    title: `Transfer Ticket #${ticketId}`,
    description: 'Transfer ticket to another person',
  };
}

export default async function TransferTicketPage({ params }: Props) {
  const { ticketId } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Transfer Ticket</h1>
        <p className="text-muted-foreground mb-8">Ticket #{ticketId}</p>

        {/* Ticket Info */}
        <div className="bg-card rounded-lg shadow-card p-6 mb-6">
          <h2 className="font-semibold mb-2">Event Name</h2>
          <p className="text-sm text-muted-foreground">Saturday, February 10, 2025 at 7:00 PM</p>
          <p className="text-sm text-muted-foreground">General Admission • Section A, Row 5, Seat 12</p>
        </div>

        {/* Transfer Form */}
        <div className="bg-card rounded-lg shadow-card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Recipient Information</h2>
          
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Recipient Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="recipient@example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                The ticket will be sent to this email address
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Recipient Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2">
                Message (Optional)
              </label>
              <textarea
                id="message"
                rows={3}
                className="w-full px-4 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Add a personal message..."
              ></textarea>
            </div>

            <div className="bg-warning/10 border border-warning rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-sm">Important</h3>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Once transferred, you will no longer have access to this ticket</li>
                <li>• The recipient must accept the transfer within 48 hours</li>
                <li>• Transfers cannot be reversed once accepted</li>
                <li>• Check the event&apos;s transfer policy before proceeding</li>
              </ul>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition font-medium"
              >
                Transfer Ticket
              </button>
              <button
                type="button"
                className="px-6 py-3 bg-muted text-foreground rounded-md hover:bg-muted/80 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Transfer History */}
        <div className="bg-card rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Transfer History</h2>
          <p className="text-sm text-muted-foreground">This ticket has not been transferred before</p>
        </div>
      </div>
    </div>
  );
}


