# Flow: Ticket Check-in

```typescript
// services/ticket.service.ts (continued)
export class TicketService {
  async checkin(
    data: {
      ticketId: string;
      occurrenceId: string;
    },
    token: string
  ): Promise<{ success: boolean; message: string }> {
    return this.apiClient.post<{ success: boolean; message: string }>(
      '/tickets/checkin',
      data,
      token
    );
  }

  async getCheckins(
    eventId: string,
    token: string
  ): Promise<any[]> {
    return this.apiClient.get<any[]>(
      `/tickets/events/${eventId}/checkins`,
      token
    );
  }
}

// QR Scanner component for check-in
const QRCheckinScanner: React.FC<{ occurrenceId: string }> = ({
  occurrenceId,
}) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleScan = async (qrCode: string) => {
    setScanning(true);

    try {
      const token = localStorage.getItem('accessToken')!;

      // Extract ticket ID from QR code
      const ticketId = extractTicketIdFromQR(qrCode);

      const response = await ticketService.checkin(
        {
          ticketId,
          occurrenceId,
        },
        token
      );

      if (response.success) {
        toast.success('Check-in successful!');
        playSuccessSound();
      } else {
        toast.error(response.message);
        playErrorSound();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.statusCode === 409) {
          toast.error('Ticket already checked in');
        } else {
          toast.error(error.message);
        }
      }
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="qr-scanner">
      <QrReader
        onResult={(result) => {
          if (result && !scanning) {
            handleScan(result.getText());
          }
        }}
        constraints={{ facingMode: 'environment' }}
      />

      {result && <p>Last scan: {result}</p>}
    </div>
  );
};
```

