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
  startDate: string; // ISO date string e.g. "2026-11-15T18:30:00.000Z"
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
  startingPrice: number; // 0 for free
  fullPriceRange?: string; // e.g. "₹499 - ₹1,499"
  currency: string; // "INR"
  bookingUrl: string;
  minAge?: number;
  isAgeRestricted?: boolean;
  organizer?: string;
  status: 'scheduled' | 'cancelled' | 'sold_out';
  lastSyncedAt?: string;
  distanceKm?: number;
}

export interface EventFilterCriteria {
  searchQuery?: string;
  platforms?: string[];
  categories?: string[];
  cities?: string[];
  priceType?: 'all' | 'free' | 'paid';
  minPrice?: number;
  maxPrice?: number;
  budget?: number;
  startDate?: string;
  endDate?: string;
  userAge?: number | null;
  userLat?: number;
  userLng?: number;
  sortBy?: 'date' | 'distance';
}

/**
 * Filter and sort events cleanly in pure logic.
 */
export function filterAndSortEvents(
  events: NormalizedEvent[],
  criteria: EventFilterCriteria,
  calculateDistanceFn?: (lat1: number, lon1: number, lat2: number, lon2: number) => number
): NormalizedEvent[] {
  // Step 1: calculate distances if user coordinates are provided
  const hasUserCoords =
    typeof criteria.userLat === 'number' &&
    typeof criteria.userLng === 'number' &&
    !isNaN(criteria.userLat) &&
    !isNaN(criteria.userLng);

  let list = events.map((event) => {
    let distanceKm: number | undefined;
    if (hasUserCoords && event.coordinates?.lat && event.coordinates?.lng && calculateDistanceFn) {
      distanceKm = calculateDistanceFn(
        criteria.userLat!,
        criteria.userLng!,
        event.coordinates.lat,
        event.coordinates.lng
      );
    }
    return { ...event, distanceKm };
  });

  // Step 2: Age eligibility check (defense in depth)
  list = list.filter((event) => {
    const isRestricted = (event.minAge !== undefined && event.minAge >= 18) || !!event.isAgeRestricted;
    if (!isRestricted) return true;
    if (criteria.userAge === null || criteria.userAge === undefined) return false;
    return criteria.userAge >= (event.minAge ?? 18);
  });

  // Step 3: Platform filter
  if (criteria.platforms && criteria.platforms.length > 0) {
    const platformSet = new Set(criteria.platforms.map((p) => p.toLowerCase()));
    list = list.filter((e) => platformSet.has(e.source.toLowerCase()));
  }

  // Step 4: Category filter
  if (criteria.categories && criteria.categories.length > 0) {
    const filterCats = criteria.categories.map((c) => c.toLowerCase());
    list = list.filter((e) => {
      const eCat = (e.category || '').toLowerCase();
      const eTags = (e.categoryTags || []).map((t) => t.toLowerCase());
      return filterCats.some(
        (fc) => eCat.includes(fc) || fc.includes(eCat) || eTags.some((t) => t.includes(fc) || fc.includes(t))
      );
    });
  }

  // Step 5: City filter
  if (criteria.cities && criteria.cities.length > 0) {
    const citySet = new Set(criteria.cities.map((c) => c.toLowerCase().trim()));
    list = list.filter((e) => citySet.has((e.city || '').toLowerCase().trim()));
  }

  // Step 6: Price filters & budget
  if (criteria.priceType === 'free') {
    list = list.filter((e) => e.startingPrice === 0);
  } else if (criteria.priceType === 'paid') {
    list = list.filter((e) => e.startingPrice > 0);
  }

  if (typeof criteria.minPrice === 'number' && !isNaN(criteria.minPrice)) {
    list = list.filter((e) => e.startingPrice >= criteria.minPrice!);
  }

  if (typeof criteria.maxPrice === 'number' && !isNaN(criteria.maxPrice)) {
    list = list.filter((e) => e.startingPrice <= criteria.maxPrice!);
  }

  if (typeof criteria.budget === 'number' && !isNaN(criteria.budget)) {
    list = list.filter((e) => e.startingPrice <= criteria.budget!);
  }

  // Step 7: Date filters
  if (criteria.startDate) {
    const startLimit = new Date(criteria.startDate).getTime();
    if (!isNaN(startLimit)) {
      list = list.filter((e) => new Date(e.startDate).getTime() >= startLimit);
    }
  }

  if (criteria.endDate) {
    const endLimit = new Date(criteria.endDate).getTime();
    if (!isNaN(endLimit)) {
      list = list.filter((e) => new Date(e.startDate).getTime() <= endLimit);
    }
  }

  // Step 8: Keyword search query
  if (criteria.searchQuery && criteria.searchQuery.trim().length > 0) {
    const q = criteria.searchQuery.toLowerCase().trim();
    list = list.filter((e) => {
      return (
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.venueName && e.venueName.toLowerCase().includes(q)) ||
        (e.city && e.city.toLowerCase().includes(q)) ||
        (e.organizer && e.organizer.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        (e.categoryTags && e.categoryTags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }

  // Step 9: Sorting
  // Default: Upcoming date ascending. If same date, tie-breaker: increasing distance, then start time.
  // If sortBy === 'distance': Distance primary criterion, event date secondary criterion.
  const sortBy = criteria.sortBy || 'date';

  list.sort((a, b) => {
    const timeA = new Date(a.startDate).getTime();
    const timeB = new Date(b.startDate).getTime();
    const distA = a.distanceKm !== undefined ? a.distanceKm : Infinity;
    const distB = b.distanceKm !== undefined ? b.distanceKm : Infinity;

    if (sortBy === 'distance') {
      if (distA !== distB) {
        return distA - distB;
      }
      return timeA - timeB;
    } else {
      // Date primary
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      // Same date/time -> tie-breaker by distance
      if (distA !== distB) {
        return distA - distB;
      }
      return a.title.localeCompare(b.title);
    }
  });

  return list;
}
