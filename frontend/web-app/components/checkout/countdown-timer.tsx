'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: Date;
  onExpire?: () => void;
}

export function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft('0:00');
        clearInterval(timer);
        onExpire?.();
        return;
      }

      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-5 py-4 shadow-sm ${
        isExpired
          ? 'border-destructive/50 bg-destructive/10 text-destructive'
          : 'border-amber-200 bg-amber-50 text-amber-900'
      }`}
    >
      <Clock className="h-5 w-5" />
      <div>
        <p className="text-sm font-semibold">
          {isExpired ? 'Reservation expired' : 'Hold in progress'}
        </p>
        <p className="text-sm">
          {isExpired ? (
            'Please reselect your tickets to continue.'
          ) : (
            <>
              Your tickets are reserved for{' '}
              <span className="font-bold text-amber-900">{timeLeft}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
