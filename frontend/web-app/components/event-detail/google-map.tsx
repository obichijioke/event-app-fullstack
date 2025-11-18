'use client';

import { useEffect, useRef, useState } from 'react';

// Simplified type for Google Maps - using Record<string, unknown> to avoid any types
interface GoogleMapsType {
  Map: new (element: HTMLElement, options?: Record<string, unknown>) => unknown;
  Marker: new (options?: Record<string, unknown>) => unknown;
  Geocoder: new () => {
    geocode: (request: { address: string }, callback: (results: unknown[] | null, status: string) => void) => void;
  };
}

interface GoogleMapProps {
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  venueName?: string;
  className?: string;
}

export function GoogleMap({ address, latitude, longitude, venueName, className = '' }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have coordinates or address
    if (!latitude && !longitude && !address) {
      const timer = setTimeout(() => {
        setMapError('No location data available');
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (typeof window !== 'undefined' && (window as unknown as { google?: { maps: GoogleMapsType } }).google?.maps) {
        initializeMap();
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        const checkInterval = setInterval(() => {
          if ((window as unknown as { google?: { maps: GoogleMapsType } }).google?.maps) {
            clearInterval(checkInterval);
            initializeMap();
          }
        }, 100);
        return;
      }

      // Load the script
      const script = document.createElement('script');
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      
      if (!apiKey) {
        const timer = setTimeout(() => {
          setMapError('Google Maps API key not configured');
          setIsLoading(false);
        }, 0);
        return () => clearTimeout(timer);
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initializeMap();
      script.onerror = () => {
        const timer = setTimeout(() => {
          setMapError('Failed to load Google Maps');
          setIsLoading(false);
        }, 0);
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current) return;

      try {
        const google = (window as unknown as { google?: { maps: GoogleMapsType } }).google;
        
        if (!google?.maps) {
          const timer = setTimeout(() => {
            setMapError('Google Maps not available');
            setIsLoading(false);
          }, 0);
          return () => clearTimeout(timer);
        }

        // If we have coordinates, use them directly
        if (latitude && longitude) {
          const position = { lat: Number(latitude), lng: Number(longitude) };
          
          const map = new google.maps.Map(mapRef.current, {
            center: position,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });

          new google.maps.Marker({
            position: position,
            map: map,
            title: venueName || 'Event Venue',
          });

          const timer = setTimeout(() => {
            setIsLoading(false);
          }, 0);
          return () => clearTimeout(timer);
        } 
        // Otherwise, geocode the address
        else if (address) {
          const geocoder = new google.maps.Geocoder();

          geocoder.geocode({ address: address }, (results: unknown[] | null, status: string) => {
            if (status === 'OK' && results && results[0]) {
              const position = (results[0] as { geometry: { location: { lat: () => number; lng: () => number } } }).geometry.location;
              
              const map = new google.maps.Map(mapRef.current!, {
                center: position,
                zoom: 15,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
              });

              new google.maps.Marker({
                position: position,
                map: map,
                title: venueName || 'Event Venue',
              });

              const timer = setTimeout(() => {
                setIsLoading(false);
              }, 0);
            } else {
              const timer = setTimeout(() => {
                setMapError('Unable to find location on map');
                setIsLoading(false);
              }, 0);
            }
          });
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        const timer = setTimeout(() => {
          setMapError('Error loading map');
          setIsLoading(false);
        }, 0);
      }
    };

    loadGoogleMaps();
  }, [address, latitude, longitude, venueName]);

  if (mapError) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded ${className}`}>
        <div className="text-center p-8">
          <svg className="h-12 w-12 mx-auto mb-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-muted-foreground">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded z-10">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className={`w-full h-full rounded ${className}`} />
    </div>
  );
}
