'use client';

import { useEffect, useRef, useState } from 'react';

// Declare google as a global variable for Google Maps API
declare const google: any;

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
      setMapError('No location data available');
      setIsLoading(false);
      return;
    }

    // Load Google Maps script
    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        initializeMap();
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Wait for it to load
        const checkInterval = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkInterval);
            initializeMap();
          }
        }, 100);
        return;
      }

      // Load the script
      const script = document.createElement('script');
      // Note: Replace with your actual Google Maps API key
      // For production, use environment variable
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      
      if (!apiKey) {
        setMapError('Google Maps API key not configured');
        setIsLoading(false);
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initializeMap();
      script.onerror = () => {
        setMapError('Failed to load Google Maps');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current) return;

      try {
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

          setIsLoading(false);
        } 
        // Otherwise, geocode the address
        else if (address) {
          const geocoder = new google.maps.Geocoder();

          geocoder.geocode({ address: address }, (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
              const position = results[0].geometry.location;
              
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

              setIsLoading(false);
            } else {
              setMapError('Unable to find location on map');
              setIsLoading(false);
            }
          });
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Error loading map');
        setIsLoading(false);
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

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google: typeof google;
  }
}

