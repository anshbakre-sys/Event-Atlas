import { EventModel } from '../models/Event.ts';
import { isDbConnected, getFallbackEvents, setFallbackEvents } from '../config/database.ts';
import { calculateHaversineDistanceKm } from '../utils/geo.ts';
import { filterAndSortEvents, NormalizedEvent, EventFilterCriteria } from '../utils/eventFilter.ts';
import { districtAdapter } from '../integrations/districtAdapter.ts';
import { bookmyshowAdapter } from '../integrations/bookmyshowAdapter.ts';
import { lumaAdapter } from '../integrations/lumaAdapter.ts';
import { SourceStatusModel } from '../models/SourceStatus.ts';

export class EventService {
  /**
   * Retrieve all events, applying age checks, filters, distance, and sorting.
   */
  public static async getEvents(criteria: EventFilterCriteria): Promise<{
    events: NormalizedEvent[];
    total: number;
    userAgeApplied: number | null;
  }> {
    let rawEvents: NormalizedEvent[] = [];

    if (isDbConnected()) {
      const docs = await EventModel.find({}).lean();
      rawEvents = docs.map((doc: any) => ({
        ...doc,
        _id: doc._id?.toString(),
      })) as NormalizedEvent[];
    } else {
      rawEvents = getFallbackEvents();
    }

    // Backend-enforced filtering and sorting using pure logic
    const filtered = filterAndSortEvents(rawEvents, criteria, calculateHaversineDistanceKm);

    return {
      events: filtered,
      total: filtered.length,
      userAgeApplied: criteria.userAge ?? null,
    };
  }

  /**
   * Get single event by eventId or _id. Enforce age eligibility if userAge provided.
   */
  public static async getEventById(
    eventId: string,
    userAge?: number | null,
    userLat?: number,
    userLng?: number
  ): Promise<NormalizedEvent | null> {
    let event: NormalizedEvent | null = null;

    if (isDbConnected()) {
      const doc = await EventModel.findOne({
        $or: [{ eventId }, { _id: eventId.match(/^[0-9a-fA-F]{24}$/) ? eventId : null }],
      }).lean();
      if (doc) {
        event = { ...doc, _id: doc._id?.toString() } as unknown as NormalizedEvent;
      }
    } else {
      const found = getFallbackEvents().find((e) => e.eventId === eventId || e._id === eventId);
      if (found) event = { ...found };
    }

    if (!event) return null;

    // Check age restriction
    const isRestricted = (event.minAge !== undefined && event.minAge >= 18) || !!event.isAgeRestricted;
    if (isRestricted) {
      if (userAge === null || userAge === undefined || userAge < (event.minAge ?? 18)) {
        // Underage or unverified user accessing age restricted event
        return null;
      }
    }

    // Attach distance if coordinates given
    if (userLat !== undefined && userLng !== undefined && event.coordinates?.lat && event.coordinates?.lng) {
      event.distanceKm = calculateHaversineDistanceKm(
        userLat,
        userLng,
        event.coordinates.lat,
        event.coordinates.lng
      );
    }

    return event;
  }

  /**
   * Sync from all adapters and update database and source statuses.
   */
  public static async syncAllSources(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    const adapters = [
      { name: 'District', adapter: districtAdapter },
      { name: 'BookMyShow', adapter: bookmyshowAdapter },
      { name: 'Luma', adapter: lumaAdapter },
    ];

    for (const item of adapters) {
      try {
        const res = await item.adapter.sync();
        results[item.name] = {
          status: res.status,
          configured: res.configured,
          recordsCount: res.count,
          lastSyncedAt: res.lastSyncedAt,
          errorMessage: res.errorMessage,
        };

        if (isDbConnected()) {
          // Upsert SourceStatus
          await SourceStatusModel.findOneAndUpdate(
            { source: item.name },
            {
              name: item.name === 'District' ? 'District by Zomato' : item.name === 'BookMyShow' ? 'BookMyShow' : 'Luma Events',
              isConfigured: res.configured,
              status: res.status,
              recordsCount: res.count,
              lastSyncedAt: res.lastSyncedAt,
              errorMessage: res.errorMessage,
            },
            { upsert: true }
          );

          // Deduplicate and upsert events
          for (const evt of res.events) {
            await EventModel.findOneAndUpdate(
              { source: evt.source, sourceEventId: evt.sourceEventId },
              { $set: evt },
              { upsert: true }
            );
          }
        }
      } catch (err: unknown) {
        results[item.name] = {
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Sync failure',
        };
      }
    }

    return results;
  }

  /**
   * Get safe source integration status summaries
   */
  public static async getSourceStatuses(): Promise<any[]> {
    if (isDbConnected()) {
      const statuses = await SourceStatusModel.find({}).lean();
      if (statuses.length > 0) return statuses;
    }

    return [
      {
        source: 'District',
        name: 'District by Zomato',
        isConfigured: districtAdapter.isConfigured(),
        status: 'connected',
        lastSyncedAt: new Date(),
        recordsCount: 6,
      },
      {
        source: 'BookMyShow',
        name: 'BookMyShow',
        isConfigured: bookmyshowAdapter.isConfigured(),
        status: 'connected',
        lastSyncedAt: new Date(),
        recordsCount: 7,
      },
      {
        source: 'Luma',
        name: 'Luma Events',
        isConfigured: lumaAdapter.isConfigured(),
        status: 'connected',
        lastSyncedAt: new Date(),
        recordsCount: 5,
      },
    ];
  }
}
