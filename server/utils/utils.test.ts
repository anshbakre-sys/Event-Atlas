import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHaversineDistanceKm, formatDistance } from './geo.ts';
import { calculateAge, isUserEligibleForEvent } from './age.ts';
import { filterAndSortEvents } from './eventFilter.ts';
import type { NormalizedEvent } from './eventFilter.ts';

test('calculateHaversineDistanceKm calculates distance between coordinates correctly', () => {
  // Mumbai (19.0760, 72.8777) to Pune (18.5204, 73.8567) is approx 120-150 km
  const dist = calculateHaversineDistanceKm(19.076, 72.8777, 18.5204, 73.8567);
  assert.ok(dist > 115 && dist < 140, `Expected distance ~120-135km, got ${dist}`);

  // Same coordinates should be 0 km
  const same = calculateHaversineDistanceKm(22.7196, 75.8577, 22.7196, 75.8577);
  assert.equal(same, 0);

  // Invalid inputs return Infinity
  assert.equal(calculateHaversineDistanceKm(NaN, 75.8, 22.7, 75.8), Infinity);
});

test('formatDistance formats meters and kilometers', () => {
  assert.equal(formatDistance(0.4), '400 m');
  assert.equal(formatDistance(12.34), '12.3 km');
  assert.equal(formatDistance(Infinity), 'Distance unknown');
});

test('calculateAge computes exact age correctly', () => {
  const refDate = new Date('2026-10-17T00:00:00Z');
  // Born 2008-10-16 -> 18 years old
  assert.equal(calculateAge('2008-10-16', refDate), 18);
  // Born 2008-10-18 -> 17 years old
  assert.equal(calculateAge('2008-10-18', refDate), 17);
  // Born 1995-05-10 -> 31 years old
  assert.equal(calculateAge('1995-05-10', refDate), 31);
  // Invalid string
  assert.equal(calculateAge('invalid-date', refDate), null);
  assert.equal(calculateAge(null, refDate), null);
});

test('isUserEligibleForEvent respects 18+ age restrictions strictly', () => {
  // All ages event
  const allAgesEvent = { minAge: 0, isAgeRestricted: false };
  assert.equal(isUserEligibleForEvent(15, allAgesEvent), true);
  assert.equal(isUserEligibleForEvent(null, allAgesEvent), true);
  assert.equal(isUserEligibleForEvent(25, allAgesEvent), true);

  // 18+ restricted event
  const adultEvent = { minAge: 18, isAgeRestricted: true };
  assert.equal(isUserEligibleForEvent(17, adultEvent), false); // Under 18 blocked!
  assert.equal(isUserEligibleForEvent(null, adultEvent), false); // Unknown age blocked!
  assert.equal(isUserEligibleForEvent(18, adultEvent), true); // 18 allowed!
  assert.equal(isUserEligibleForEvent(22, adultEvent), true); // 22 allowed!
});

test('filterAndSortEvents handles sorting and filtering', () => {
  const mockEvents: NormalizedEvent[] = [
    {
      eventId: 'evt-1',
      title: 'Rock Festival Indore',
      description: 'Live rock bands',
      category: 'Rock music events',
      categoryTags: ['Rock', 'Live Music', 'Concert'],
      source: 'District',
      sourceEventId: 'dist-1',
      imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
      startDate: '2026-11-20T19:00:00.000Z',
      venueName: 'Labh Mandapam',
      venueAddress: 'RNT Marg',
      city: 'Indore',
      coordinates: { lat: 22.7196, lng: 75.8577 },
      startingPrice: 800,
      currency: 'INR',
      bookingUrl: 'https://district.in/events/1',
      minAge: 0,
      isAgeRestricted: false,
      status: 'scheduled',
    },
    {
      eventId: 'evt-2',
      title: 'Mumbai Tech Summit',
      description: 'AI & Developer conference',
      category: 'Conferences',
      categoryTags: ['Technology', 'AI', 'Developers'],
      source: 'Luma',
      sourceEventId: 'luma-1',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
      startDate: '2026-11-15T10:00:00.000Z',
      venueName: 'Jio World Convention Centre',
      venueAddress: 'BKC',
      city: 'Mumbai',
      coordinates: { lat: 19.0657, lng: 72.8682 },
      startingPrice: 0,
      currency: 'INR',
      bookingUrl: 'https://lu.ma/mumbai-summit',
      minAge: 0,
      isAgeRestricted: false,
      status: 'scheduled',
    },
    {
      eventId: 'evt-3',
      title: 'Adult Standup Comedy Club',
      description: 'Late night uncensored comedy',
      category: 'Stand-up comedy',
      categoryTags: ['Comedy', '18+'],
      source: 'BookMyShow',
      sourceEventId: 'bms-1',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      startDate: '2026-11-10T21:00:00.000Z',
      venueName: 'The Habitat',
      venueAddress: 'Khar West',
      city: 'Mumbai',
      coordinates: { lat: 19.07, lng: 72.83 },
      startingPrice: 1200,
      currency: 'INR',
      bookingUrl: 'https://in.bookmyshow.com/events/comedy-1',
      minAge: 18,
      isAgeRestricted: true,
      status: 'scheduled',
    },
  ];

  // Test 1: Date sort (default: earlier events first)
  const sortedByDate = filterAndSortEvents(
    mockEvents,
    { userAge: 25 },
    calculateHaversineDistanceKm
  );
  assert.equal(sortedByDate[0].eventId, 'evt-3'); // Nov 10
  assert.equal(sortedByDate[1].eventId, 'evt-2'); // Nov 15
  assert.equal(sortedByDate[2].eventId, 'evt-1'); // Nov 20

  // Test 2: Age filtering for under 18 hides adult comedy
  const under18List = filterAndSortEvents(
    mockEvents,
    { userAge: 16 },
    calculateHaversineDistanceKm
  );
  assert.equal(under18List.length, 2);
  assert.ok(!under18List.some((e) => e.eventId === 'evt-3'));

  // Test 3: Budget filter <= 1000 INR
  const budgetFiltered = filterAndSortEvents(
    mockEvents,
    { budget: 1000, userAge: 25 },
    calculateHaversineDistanceKm
  );
  assert.equal(budgetFiltered.length, 2); // 800 and 0 match, 1200 excluded
  assert.ok(!budgetFiltered.some((e) => e.startingPrice > 1000));

  // Test 4: Free filter
  const freeOnly = filterAndSortEvents(
    mockEvents,
    { priceType: 'free', userAge: 25 },
    calculateHaversineDistanceKm
  );
  assert.equal(freeOnly.length, 1);
  assert.equal(freeOnly[0].eventId, 'evt-2');

  // Test 5: Distance sort from Indore coordinates (22.7196, 75.8577)
  const distSorted = filterAndSortEvents(
    mockEvents,
    { userLat: 22.7196, userLng: 75.8577, sortBy: 'distance', userAge: 25 },
    calculateHaversineDistanceKm
  );
  assert.equal(distSorted[0].eventId, 'evt-1'); // Indore event is 0 km away!
});
