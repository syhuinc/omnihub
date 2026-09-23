export interface City {
  id: string;
  name: string;
  country: string;
  flag: string;
  timeZone: string;
}

export const CITIES: City[] = [
  { id: 'new-york', name: 'New York', country: 'USA', flag: '🇺🇸', timeZone: 'America/New_York' },
  { id: 'los-angeles', name: 'Los Angeles', country: 'USA', flag: '🇺🇸', timeZone: 'America/Los_Angeles' },
  { id: 'chicago', name: 'Chicago', country: 'USA', flag: '🇺🇸', timeZone: 'America/Chicago' },
  { id: 'toronto', name: 'Toronto', country: 'Canada', flag: '🇨🇦', timeZone: 'America/Toronto' },
  { id: 'sao-paulo', name: 'São Paulo', country: 'Brazil', flag: '🇧🇷', timeZone: 'America/Sao_Paulo' },
  { id: 'london', name: 'London', country: 'UK', flag: '🇬🇧', timeZone: 'Europe/London' },
  { id: 'paris', name: 'Paris', country: 'France', flag: '🇫🇷', timeZone: 'Europe/Paris' },
  { id: 'berlin', name: 'Berlin', country: 'Germany', flag: '🇩🇪', timeZone: 'Europe/Berlin' },
  { id: 'moscow', name: 'Moscow', country: 'Russia', flag: '🇷🇺', timeZone: 'Europe/Moscow' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', flag: '🇦🇪', timeZone: 'Asia/Dubai' },
  { id: 'mumbai', name: 'Mumbai', country: 'India', flag: '🇮🇳', timeZone: 'Asia/Kolkata' },
  { id: 'delhi', name: 'New Delhi', country: 'India', flag: '🇮🇳', timeZone: 'Asia/Kolkata' },
  { id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾', timeZone: 'Asia/Kuala_Lumpur' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', flag: '🇸🇬', timeZone: 'Asia/Singapore' },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', flag: '🇹🇭', timeZone: 'Asia/Bangkok' },
  { id: 'jakarta', name: 'Jakarta', country: 'Indonesia', flag: '🇮🇩', timeZone: 'Asia/Jakarta' },
  { id: 'hong-kong', name: 'Hong Kong', country: 'China', flag: '🇭🇰', timeZone: 'Asia/Hong_Kong' },
  { id: 'shanghai', name: 'Shanghai', country: 'China', flag: '🇨🇳', timeZone: 'Asia/Shanghai' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', flag: '🇯🇵', timeZone: 'Asia/Tokyo' },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', flag: '🇰🇷', timeZone: 'Asia/Seoul' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', flag: '🇦🇺', timeZone: 'Australia/Sydney' },
  { id: 'auckland', name: 'Auckland', country: 'New Zealand', flag: '🇳🇿', timeZone: 'Pacific/Auckland' },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', flag: '🇪🇬', timeZone: 'Africa/Cairo' },
  { id: 'johannesburg', name: 'Johannesburg', country: 'South Africa', flag: '🇿🇦', timeZone: 'Africa/Johannesburg' },
  { id: 'lagos', name: 'Lagos', country: 'Nigeria', flag: '🇳🇬', timeZone: 'Africa/Lagos' },
  { id: 'istanbul', name: 'Istanbul', country: 'Turkey', flag: '🇹🇷', timeZone: 'Europe/Istanbul' },
  { id: 'mexico-city', name: 'Mexico City', country: 'Mexico', flag: '🇲🇽', timeZone: 'America/Mexico_City' },
];

export function getCityById(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}
