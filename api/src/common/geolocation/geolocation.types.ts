export interface IPLocation {
  ip: string;
  latitude: number;
  longitude: number;
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  timezone: string | null;
}

export interface GeocodedCity {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  countryCode: string;
  region?: string;
}

export interface ReverseGeocodeResult {
  city: string | null;
  region: string | null;
  country: string | null;
  countryCode: string | null;
  formattedAddress: string | null;
}

export interface CityCoordinates {
  latitude: number;
  longitude: number;
  cityId?: string;
  cityName: string;
  country: string;
  countryCode?: string;
}

// ip-api.com response structure
export interface IpApiResponse {
  status: 'success' | 'fail';
  message?: string;
  country?: string;
  countryCode?: string;
  region?: string;
  regionName?: string;
  city?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
  query?: string;
}
