export interface City {
  id: string;
  name: string;
  country: string;
  timeZone: string;
}

export const CITIES: City[] = [
  { id: 'new-york', name: 'New York', country: 'USA', timeZone: 'America/New_York' },
  { id: 'los-angeles', name: 'Los Angeles', country: 'USA', timeZone: 'America/Los_Angeles' },
  { id: 'chicago', name: 'Chicago', country: 'USA', timeZone: 'America/Chicago' },
  { id: 'toronto', name: 'Toronto', country: 'Canada', timeZone: 'America/Toronto' },
  { id: 'sao-paulo', name: 'São Paulo', country: 'Brazil', timeZone: 'America/Sao_Paulo' },
  { id: 'london', name: 'London', country: 'UK', timeZone: 'Europe/London' },
  { id: 'paris', name: 'Paris', country: 'France', timeZone: 'Europe/Paris' },
  { id: 'berlin', name: 'Berlin', country: 'Germany', timeZone: 'Europe/Berlin' },
  { id: 'moscow', name: 'Moscow', country: 'Russia', timeZone: 'Europe/Moscow' },
  { id: 'dubai', name: 'Dubai', country: 'UAE', timeZone: 'Asia/Dubai' },
  { id: 'mumbai', name: 'Mumbai', country: 'India', timeZone: 'Asia/Kolkata' },
  { id: 'delhi', name: 'New Delhi', country: 'India', timeZone: 'Asia/Kolkata' },
  { id: 'kuala-lumpur', name: 'Kuala Lumpur', country: 'Malaysia', timeZone: 'Asia/Kuala_Lumpur' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', timeZone: 'Asia/Singapore' },
  { id: 'bangkok', name: 'Bangkok', country: 'Thailand', timeZone: 'Asia/Bangkok' },
  { id: 'jakarta', name: 'Jakarta', country: 'Indonesia', timeZone: 'Asia/Jakarta' },
  { id: 'hong-kong', name: 'Hong Kong', country: 'China', timeZone: 'Asia/Hong_Kong' },
  { id: 'shanghai', name: 'Shanghai', country: 'China', timeZone: 'Asia/Shanghai' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { id: 'seoul', name: 'Seoul', country: 'South Korea', timeZone: 'Asia/Seoul' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', timeZone: 'Australia/Sydney' },
  { id: 'auckland', name: 'Auckland', country: 'New Zealand', timeZone: 'Pacific/Auckland' },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', timeZone: 'Africa/Cairo' },
  { id: 'johannesburg', name: 'Johannesburg', country: 'South Africa', timeZone: 'Africa/Johannesburg' },
  { id: 'lagos', name: 'Lagos', country: 'Nigeria', timeZone: 'Africa/Lagos' },
  { id: 'istanbul', name: 'Istanbul', country: 'Turkey', timeZone: 'Europe/Istanbul' },
  { id: 'mexico-city', name: 'Mexico City', country: 'Mexico', timeZone: 'America/Mexico_City' },
];

export function getCityById(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}
