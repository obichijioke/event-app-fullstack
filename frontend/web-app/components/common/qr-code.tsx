'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCode({ value, size = 200, className }: QRCodeProps) {
  return (
    <div className={`bg-white p-4 rounded-lg inline-block ${className}`}>
      <QRCodeSVG
        value={value}
        size={size}
        level="H" // High error correction level
        includeMargin={true}
      />
    </div>
  );
}
