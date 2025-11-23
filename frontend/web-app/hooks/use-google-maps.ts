import { useState, useEffect } from 'react';

interface GoogleMapsType {
  Map: new (element: HTMLElement, options?: Record<string, unknown>) => unknown;
  Marker: new (options?: Record<string, unknown>) => unknown;
  places: {
    Autocomplete: new (
      input: HTMLInputElement,
      options?: { types?: string[]; fields?: string[] }
    ) => {
      addListener: (eventName: string, handler: () => void) => void;
      getPlace: () => {
        address_components?: Array<{
          long_name: string;
          short_name: string;
          types: string[];
        }>;
        formatted_address?: string;
        geometry?: {
          location: {
            lat: () => number;
            lng: () => number;
          };
        };
        name?: string;
      };
    };
  };
  Geocoder: new () => {
    geocode: (
      request: { address: string },
      callback: (results: unknown[] | null, status: string) => void
    ) => void;
  };
}

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  loadError: string | null;
}

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [isLoaded, setIsLoaded] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!(window as unknown as { google?: { maps: GoogleMapsType } }).google?.maps;
  });
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) return;

    const checkLoaded = () => {
      return (
        typeof window !== 'undefined' &&
        (window as unknown as { google?: { maps: GoogleMapsType } }).google?.maps
      );
    };

    if (checkLoaded()) {
      // Avoid synchronous setState in effect
      const timer = setTimeout(() => setIsLoaded(true), 0);
      return () => clearTimeout(timer);
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkInterval = setInterval(() => {
        if (checkLoaded()) {
          clearInterval(checkInterval);
          setIsLoaded(true);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }

    // Load the script
    const script = document.createElement('script');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    if (!apiKey) {
      const timer = setTimeout(() => setLoadError('Google Maps API key not configured'), 0);
      return () => clearTimeout(timer);
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => setLoadError('Failed to load Google Maps');

    document.head.appendChild(script);
  }, [isLoaded]);

  return { isLoaded, loadError };
}
