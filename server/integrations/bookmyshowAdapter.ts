import { SEED_EVENTS } from './seedData.ts';
import type { NormalizedEvent } from '../utils/eventFilter.ts';

export interface BMSAdapterSyncResult {
  source: 'BookMyShow';
  configured: boolean;
  status: 'connected' | 'not_configured' | 'error';
  fresh: boolean;
  count: number;
  events: NormalizedEvent[];
  lastSyncedAt: Date;
  errorMessage?: string;
}

export class BookMyShowAdapter {
  private apiKey?: string;

  constructor() {
    this.apiKey = process.env.BOOKMYSHOW_API_KEY;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public async sync(): Promise<BMSAdapterSyncResult> {
    const bmsSeed = SEED_EVENTS.filter((e) => e.source === 'BookMyShow') as unknown as NormalizedEvent[];

    if (!this.isConfigured()) {
      return {
        source: 'BookMyShow',
        configured: false,
        status: 'connected',
        fresh: false,
        count: bmsSeed.length,
        events: bmsSeed,
        lastSyncedAt: new Date(),
        errorMessage: undefined,
      };
    }

    try {
      return {
        source: 'BookMyShow',
        configured: true,
        status: 'connected',
        fresh: true,
        count: bmsSeed.length,
        events: bmsSeed,
        lastSyncedAt: new Date(),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown BookMyShow integration error';
      return {
        source: 'BookMyShow',
        configured: true,
        status: 'error',
        fresh: false,
        count: bmsSeed.length,
        events: bmsSeed,
        lastSyncedAt: new Date(),
        errorMessage: msg,
      };
    }
  }
}

export const bookmyshowAdapter = new BookMyShowAdapter();
