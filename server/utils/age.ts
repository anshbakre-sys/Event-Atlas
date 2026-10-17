/**
 * Calculate exact age from date of birth string (YYYY-MM-DD or ISO string).
 */
export function calculateAge(dobString?: string | null, referenceDate: Date = new Date()): number | null {
  if (!dobString) return null;
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;

  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Check if a user is eligible for an event based on their age and event restriction.
 * Rule:
 * 1. If event is age-restricted (minAge >= 18 or isAgeRestricted is true):
 *    - If user is under 18 -> NOT eligible (false).
 *    - If user age is unknown/unauthenticated -> conservatively NOT eligible (false) for 18+ events.
 *    - If user is 18 or older -> eligible (true).
 * 2. If event is not age-restricted (all ages / family friendly):
 *    - Everyone is eligible (true).
 */
export function isUserEligibleForEvent(
  userAge: number | null | undefined,
  event: { minAge?: number; isAgeRestricted?: boolean }
): boolean {
  const isRestricted = (event.minAge !== undefined && event.minAge >= 18) || !!event.isAgeRestricted;

  if (!isRestricted) {
    return true;
  }

  // Event IS age-restricted:
  if (userAge === null || userAge === undefined) {
    // Unknown age: conservatively hide age-restricted events
    return false;
  }

  return userAge >= (event.minAge ?? 18);
}
