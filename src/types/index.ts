export interface NormalizedEvent {
  _id?: string;
  eventId: string;
  title: string;
  description: string;
  category: string;
  categoryTags: string[];
  source: 'District' | 'BookMyShow' | 'Luma';
  sourceEventId: string;
  imageUrl: string;
  startDate: string;
  endDate?: string;
  timezone?: string;
  venueName: string;
  venueAddress: string;
  city: string;
  state?: string;
  country?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  startingPrice: number;
  fullPriceRange?: string;
  currency: string;
  bookingUrl: string;
  minAge?: number;
  isAgeRestricted?: boolean;
  organizer?: string;
  status: 'scheduled' | 'cancelled' | 'sold_out';
  lastSyncedAt?: string;
  distanceKm?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  userAge: number | null;
  phone?: string;
  preferredCity?: string;
  preferences?: {
    favoriteCategories?: string[];
    maxBudget?: number;
  };
}

export interface EventFilterState {
  searchQuery: string;
  platforms: string[];
  categories: string[];
  cities: string[];
  priceType: 'all' | 'free' | 'paid';
  minPrice?: number;
  maxPrice?: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
  sortBy: 'date' | 'distance';
}

export interface CityOption {
  name: string;
  state: string;
  lat: number;
  lng: number;
}

export const KNOWN_CITIES: CityOption[] = [
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577 },
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
];

export const CATEGORY_LIST = [
  'Music concerts',
  'Rock music events',
  'Live music',
  'Stand-up comedy',
  'Cultural events',
  'Theatre and performances',
  'Festivals',
  'Hackathons',
  'Technology meetups',
  'Workshops',
  'Conferences',
  'Networking events',
  'Other events',
];
