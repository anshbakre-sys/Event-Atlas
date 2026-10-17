import { EventService } from './eventService.ts';
import { SafeUser } from './authService.ts';

export interface BookingHandoffPayload {
  eventId: string;
  eventTitle: string;
  source: 'District' | 'BookMyShow' | 'Luma';
  originalUrl: string;
  redirectUrl: string;
  prefillSupported: boolean;
  handoffNotice: string;
  userFields: Array<{
    field: string;
    label: string;
    value: string;
  }>;
}

export class BookingService {
  public static async prepareHandoff(
    eventId: string,
    user?: SafeUser | null
  ): Promise<BookingHandoffPayload> {
    const event = await EventService.getEventById(eventId, user?.userAge);
    if (!event) {
      throw new Error('Event not found or not eligible for your age.');
    }

    let redirectUrl = event.bookingUrl;
    let prefillSupported = false;
    let handoffNotice = '';

    const userFields: Array<{ field: string; label: string; value: string }> = [];

    if (user) {
      if (user.name) userFields.push({ field: 'name', label: 'Full Name', value: user.name });
      if (user.email) userFields.push({ field: 'email', label: 'Email Address', value: user.email });
      if (user.phone) userFields.push({ field: 'phone', label: 'Phone Number', value: user.phone });
      if (user.dateOfBirth) userFields.push({ field: 'dob', label: 'Date of Birth', value: user.dateOfBirth });
    }

    if (event.source === 'Luma' && user) {
      // Luma supports prefilling name and email via URL parameters for fast registration
      try {
        const url = new URL(event.bookingUrl);
        if (user.name) url.searchParams.set('name', user.name);
        if (user.email) url.searchParams.set('email', user.email);
        redirectUrl = url.toString();
        prefillSupported = true;
        handoffNotice = 'Your name and email have been formatted for Luma registration.';
      } catch (e) {
        redirectUrl = event.bookingUrl;
      }
    } else {
      // District / BookMyShow external platforms require independent checkout
      prefillSupported = false;
      handoffNotice = `${event.source} requires booking directly on their platform. Use the quick copy buttons below to paste your profile details easily.`;
    }

    return {
      eventId: event.eventId,
      eventTitle: event.title,
      source: event.source,
      originalUrl: event.bookingUrl,
      redirectUrl,
      prefillSupported,
      handoffNotice,
      userFields,
    };
  }
}
