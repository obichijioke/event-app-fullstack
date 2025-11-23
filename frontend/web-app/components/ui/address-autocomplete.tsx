import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useGoogleMaps } from '@/hooks/use-google-maps';

interface AddressAutocompleteProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onAddressSelect: (place: {
    name?: string;
    address: string;
    city: string;
    region: string;
    postal: string;
    country: string;
    lat?: number;
    lng?: number;
  }) => void;
}

export function AddressAutocomplete({ onAddressSelect, ...props }: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    const google = (window as unknown as { google: any }).google;
    
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment', 'geocode'],
      fields: ['name', 'address_components', 'formatted_address', 'geometry'],
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      
      if (!place.address_components) return;

      let address = '';
      let city = '';
      let region = '';
      let postal = '';
      let country = '';
      let streetNumber = '';
      let route = '';

      place.address_components.forEach((component: any) => {
        const types = component.types;
        if (types.includes('street_number')) {
          streetNumber = component.long_name;
        }
        if (types.includes('route')) {
          route = component.long_name;
        }
        if (types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          region = component.short_name;
        }
        if (types.includes('postal_code')) {
          postal = component.long_name;
        }
        if (types.includes('country')) {
          country = component.short_name;
        }
      });

      address = `${streetNumber} ${route}`.trim();

      onAddressSelect({
        name: place.name,
        address,
        city,
        region,
        postal,
        country,
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
      });
    });
  }, [isLoaded, onAddressSelect]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        disabled={!isLoaded || !!loadError}
        placeholder={loadError ? 'Error loading maps' : props.placeholder || 'Start typing address...'}
        {...props}
      />
      {loadError && <p className="text-xs text-error mt-1">{loadError}</p>}
    </div>
  );
}
