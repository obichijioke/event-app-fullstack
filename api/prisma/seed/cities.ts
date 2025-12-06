import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Major cities data - focus on Africa, then global cities
const majorCities = [
  // Africa - Nigeria
  { name: 'Lagos', countryCode: 'NG', countryName: 'Nigeria', latitude: 6.5244, longitude: 3.3792, timezone: 'Africa/Lagos', population: 15388000, isMajor: true, aliases: ['Lagos Island', 'Eko'] },
  { name: 'Abuja', countryCode: 'NG', countryName: 'Nigeria', latitude: 9.0579, longitude: 7.4951, timezone: 'Africa/Lagos', population: 3464000, isMajor: true, aliases: ['FCT'] },
  { name: 'Kano', countryCode: 'NG', countryName: 'Nigeria', latitude: 12.0022, longitude: 8.5920, timezone: 'Africa/Lagos', population: 4103000, isMajor: true, aliases: [] },
  { name: 'Ibadan', countryCode: 'NG', countryName: 'Nigeria', latitude: 7.3775, longitude: 3.9470, timezone: 'Africa/Lagos', population: 3552000, isMajor: true, aliases: [] },
  { name: 'Port Harcourt', countryCode: 'NG', countryName: 'Nigeria', latitude: 4.8156, longitude: 7.0498, timezone: 'Africa/Lagos', population: 1865000, isMajor: true, aliases: ['PH', 'Garden City'] },

  // Africa - Kenya
  { name: 'Nairobi', countryCode: 'KE', countryName: 'Kenya', latitude: -1.2921, longitude: 36.8219, timezone: 'Africa/Nairobi', population: 4397073, isMajor: true, aliases: ['Nai'] },
  { name: 'Mombasa', countryCode: 'KE', countryName: 'Kenya', latitude: -4.0435, longitude: 39.6682, timezone: 'Africa/Nairobi', population: 1208333, isMajor: true, aliases: [] },

  // Africa - South Africa
  { name: 'Johannesburg', countryCode: 'ZA', countryName: 'South Africa', latitude: -26.2041, longitude: 28.0473, timezone: 'Africa/Johannesburg', population: 5635127, isMajor: true, aliases: ['Joburg', 'Jozi'] },
  { name: 'Cape Town', countryCode: 'ZA', countryName: 'South Africa', latitude: -33.9249, longitude: 18.4241, timezone: 'Africa/Johannesburg', population: 4618000, isMajor: true, aliases: ['Mother City'] },
  { name: 'Durban', countryCode: 'ZA', countryName: 'South Africa', latitude: -29.8587, longitude: 31.0218, timezone: 'Africa/Johannesburg', population: 3720953, isMajor: true, aliases: ['eThekwini'] },
  { name: 'Pretoria', countryCode: 'ZA', countryName: 'South Africa', latitude: -25.7479, longitude: 28.2293, timezone: 'Africa/Johannesburg', population: 2473000, isMajor: true, aliases: ['Tshwane'] },

  // Africa - Ghana
  { name: 'Accra', countryCode: 'GH', countryName: 'Ghana', latitude: 5.6037, longitude: -0.1870, timezone: 'Africa/Accra', population: 2514000, isMajor: true, aliases: [] },
  { name: 'Kumasi', countryCode: 'GH', countryName: 'Ghana', latitude: 6.6666, longitude: -1.6163, timezone: 'Africa/Accra', population: 1468609, isMajor: true, aliases: [] },

  // Africa - Egypt
  { name: 'Cairo', countryCode: 'EG', countryName: 'Egypt', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo', population: 20901000, isMajor: true, aliases: ['Al-Qahirah'] },
  { name: 'Alexandria', countryCode: 'EG', countryName: 'Egypt', latitude: 31.2001, longitude: 29.9187, timezone: 'Africa/Cairo', population: 5200000, isMajor: true, aliases: [] },

  // Africa - Morocco
  { name: 'Casablanca', countryCode: 'MA', countryName: 'Morocco', latitude: 33.5731, longitude: -7.5898, timezone: 'Africa/Casablanca', population: 3359818, isMajor: true, aliases: ['Casa'] },
  { name: 'Marrakech', countryCode: 'MA', countryName: 'Morocco', latitude: 31.6295, longitude: -7.9811, timezone: 'Africa/Casablanca', population: 928850, isMajor: true, aliases: ['Marrakesh'] },

  // Africa - Tanzania
  { name: 'Dar es Salaam', countryCode: 'TZ', countryName: 'Tanzania', latitude: -6.7924, longitude: 39.2083, timezone: 'Africa/Dar_es_Salaam', population: 6368000, isMajor: true, aliases: ['Dar'] },

  // Africa - Ethiopia
  { name: 'Addis Ababa', countryCode: 'ET', countryName: 'Ethiopia', latitude: 9.0320, longitude: 38.7469, timezone: 'Africa/Addis_Ababa', population: 3352000, isMajor: true, aliases: [] },

  // Africa - Uganda
  { name: 'Kampala', countryCode: 'UG', countryName: 'Uganda', latitude: 0.3476, longitude: 32.5825, timezone: 'Africa/Kampala', population: 1680600, isMajor: true, aliases: [] },

  // Africa - Rwanda
  { name: 'Kigali', countryCode: 'RW', countryName: 'Rwanda', latitude: -1.9403, longitude: 29.8739, timezone: 'Africa/Kigali', population: 1132686, isMajor: true, aliases: [] },

  // Africa - Senegal
  { name: 'Dakar', countryCode: 'SN', countryName: 'Senegal', latitude: 14.7167, longitude: -17.4677, timezone: 'Africa/Dakar', population: 1146053, isMajor: true, aliases: [] },

  // Africa - Côte d'Ivoire
  { name: 'Abidjan', countryCode: 'CI', countryName: "Côte d'Ivoire", latitude: 5.3600, longitude: -4.0083, timezone: 'Africa/Abidjan', population: 4980000, isMajor: true, aliases: [] },

  // North America - USA
  { name: 'New York', countryCode: 'US', countryName: 'United States', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York', population: 8336817, isMajor: true, aliases: ['NYC', 'New York City', 'Manhattan'] },
  { name: 'Los Angeles', countryCode: 'US', countryName: 'United States', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles', population: 3979576, isMajor: true, aliases: ['LA'] },
  { name: 'Chicago', countryCode: 'US', countryName: 'United States', latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago', population: 2693976, isMajor: true, aliases: ['Chi-Town', 'Windy City'] },
  { name: 'Houston', countryCode: 'US', countryName: 'United States', latitude: 29.7604, longitude: -95.3698, timezone: 'America/Chicago', population: 2320268, isMajor: true, aliases: [] },
  { name: 'Miami', countryCode: 'US', countryName: 'United States', latitude: 25.7617, longitude: -80.1918, timezone: 'America/New_York', population: 442241, isMajor: true, aliases: [] },
  { name: 'Atlanta', countryCode: 'US', countryName: 'United States', latitude: 33.7490, longitude: -84.3880, timezone: 'America/New_York', population: 498715, isMajor: true, aliases: ['ATL'] },
  { name: 'San Francisco', countryCode: 'US', countryName: 'United States', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles', population: 873965, isMajor: true, aliases: ['SF', 'San Fran'] },

  // Europe - UK
  { name: 'London', countryCode: 'GB', countryName: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London', population: 8982000, isMajor: true, aliases: [] },
  { name: 'Manchester', countryCode: 'GB', countryName: 'United Kingdom', latitude: 53.4808, longitude: -2.2426, timezone: 'Europe/London', population: 547627, isMajor: true, aliases: [] },
  { name: 'Birmingham', countryCode: 'GB', countryName: 'United Kingdom', latitude: 52.4862, longitude: -1.8904, timezone: 'Europe/London', population: 1144919, isMajor: true, aliases: [] },

  // Europe - Germany
  { name: 'Berlin', countryCode: 'DE', countryName: 'Germany', latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin', population: 3669491, isMajor: true, aliases: [] },
  { name: 'Munich', countryCode: 'DE', countryName: 'Germany', latitude: 48.1351, longitude: 11.5820, timezone: 'Europe/Berlin', population: 1484226, isMajor: true, aliases: ['München'] },
  { name: 'Frankfurt', countryCode: 'DE', countryName: 'Germany', latitude: 50.1109, longitude: 8.6821, timezone: 'Europe/Berlin', population: 753056, isMajor: true, aliases: ['Frankfurt am Main'] },

  // Europe - France
  { name: 'Paris', countryCode: 'FR', countryName: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris', population: 2161000, isMajor: true, aliases: [] },
  { name: 'Lyon', countryCode: 'FR', countryName: 'France', latitude: 45.7640, longitude: 4.8357, timezone: 'Europe/Paris', population: 516092, isMajor: true, aliases: [] },

  // Europe - Netherlands
  { name: 'Amsterdam', countryCode: 'NL', countryName: 'Netherlands', latitude: 52.3676, longitude: 4.9041, timezone: 'Europe/Amsterdam', population: 872680, isMajor: true, aliases: [] },

  // Europe - Spain
  { name: 'Madrid', countryCode: 'ES', countryName: 'Spain', latitude: 40.4168, longitude: -3.7038, timezone: 'Europe/Madrid', population: 3223334, isMajor: true, aliases: [] },
  { name: 'Barcelona', countryCode: 'ES', countryName: 'Spain', latitude: 41.3851, longitude: 2.1734, timezone: 'Europe/Madrid', population: 1620343, isMajor: true, aliases: ['Barca'] },

  // Europe - Italy
  { name: 'Rome', countryCode: 'IT', countryName: 'Italy', latitude: 41.9028, longitude: 12.4964, timezone: 'Europe/Rome', population: 2860009, isMajor: true, aliases: ['Roma'] },
  { name: 'Milan', countryCode: 'IT', countryName: 'Italy', latitude: 45.4642, longitude: 9.1900, timezone: 'Europe/Rome', population: 1396059, isMajor: true, aliases: ['Milano'] },

  // Asia - UAE
  { name: 'Dubai', countryCode: 'AE', countryName: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai', population: 3331420, isMajor: true, aliases: [] },
  { name: 'Abu Dhabi', countryCode: 'AE', countryName: 'United Arab Emirates', latitude: 24.4539, longitude: 54.3773, timezone: 'Asia/Dubai', population: 1450000, isMajor: true, aliases: [] },

  // Asia - India
  { name: 'Mumbai', countryCode: 'IN', countryName: 'India', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata', population: 20411274, isMajor: true, aliases: ['Bombay'] },
  { name: 'Delhi', countryCode: 'IN', countryName: 'India', latitude: 28.7041, longitude: 77.1025, timezone: 'Asia/Kolkata', population: 16787941, isMajor: true, aliases: ['New Delhi'] },
  { name: 'Bangalore', countryCode: 'IN', countryName: 'India', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata', population: 8443675, isMajor: true, aliases: ['Bengaluru'] },

  // Asia - Singapore
  { name: 'Singapore', countryCode: 'SG', countryName: 'Singapore', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore', population: 5850342, isMajor: true, aliases: [] },

  // Asia - Japan
  { name: 'Tokyo', countryCode: 'JP', countryName: 'Japan', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo', population: 13960000, isMajor: true, aliases: [] },
  { name: 'Osaka', countryCode: 'JP', countryName: 'Japan', latitude: 34.6937, longitude: 135.5023, timezone: 'Asia/Tokyo', population: 2691742, isMajor: true, aliases: [] },

  // Asia - China
  { name: 'Beijing', countryCode: 'CN', countryName: 'China', latitude: 39.9042, longitude: 116.4074, timezone: 'Asia/Shanghai', population: 21540000, isMajor: true, aliases: ['Peking'] },
  { name: 'Shanghai', countryCode: 'CN', countryName: 'China', latitude: 31.2304, longitude: 121.4737, timezone: 'Asia/Shanghai', population: 27058000, isMajor: true, aliases: [] },
  { name: 'Hong Kong', countryCode: 'HK', countryName: 'Hong Kong', latitude: 22.3193, longitude: 114.1694, timezone: 'Asia/Hong_Kong', population: 7500700, isMajor: true, aliases: ['HK'] },

  // Oceania - Australia
  { name: 'Sydney', countryCode: 'AU', countryName: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney', population: 5312163, isMajor: true, aliases: [] },
  { name: 'Melbourne', countryCode: 'AU', countryName: 'Australia', latitude: -37.8136, longitude: 144.9631, timezone: 'Australia/Melbourne', population: 5078193, isMajor: true, aliases: [] },

  // South America - Brazil
  { name: 'São Paulo', countryCode: 'BR', countryName: 'Brazil', latitude: -23.5505, longitude: -46.6333, timezone: 'America/Sao_Paulo', population: 12325232, isMajor: true, aliases: ['Sao Paulo', 'SP'] },
  { name: 'Rio de Janeiro', countryCode: 'BR', countryName: 'Brazil', latitude: -22.9068, longitude: -43.1729, timezone: 'America/Sao_Paulo', population: 6747815, isMajor: true, aliases: ['Rio'] },

  // Canada
  { name: 'Toronto', countryCode: 'CA', countryName: 'Canada', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto', population: 2731571, isMajor: true, aliases: ['TO', 'The 6ix'] },
  { name: 'Vancouver', countryCode: 'CA', countryName: 'Canada', latitude: 49.2827, longitude: -123.1207, timezone: 'America/Vancouver', population: 631486, isMajor: true, aliases: [] },
];

export async function seedCities() {
  console.log('Seeding cities...');

  for (const city of majorCities) {
    await prisma.city.upsert({
      where: { id: `city-${city.countryCode.toLowerCase()}-${city.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {
        name: city.name,
        countryCode: city.countryCode,
        countryName: city.countryName,
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone,
        population: city.population,
        isMajor: city.isMajor,
        aliases: city.aliases,
      },
      create: {
        id: `city-${city.countryCode.toLowerCase()}-${city.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: city.name,
        countryCode: city.countryCode,
        countryName: city.countryName,
        latitude: city.latitude,
        longitude: city.longitude,
        timezone: city.timezone,
        population: city.population,
        isMajor: city.isMajor,
        aliases: city.aliases,
      },
    });
  }

  console.log(`Seeded ${majorCities.length} cities`);
}

// Export for use in main seed file
export { majorCities };
