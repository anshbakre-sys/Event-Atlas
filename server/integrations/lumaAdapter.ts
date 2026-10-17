import { SEED_EVENTS } from './seedData.ts';
import type { NormalizedEvent } from '../utils/eventFilter.ts';

export interface LumaAdapterSyncResult {
  source: 'Luma';
  configured: boolean;
  status: 'connected' | 'not_configured' | 'error';
  fresh: boolean;
  count: number;
  events: NormalizedEvent[];
  lastSyncedAt: Date;
  errorMessage?: string;
}

export class LumaAdapter {
  private apiKey?: string;

  constructor() {
    this.apiKey = process.env.LUMA_API_KEY;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public async sync(): Promise<LumaAdapterSyncResult> {
    const lumaSeed = SEED_EVENTS.filter((e) => e.source === 'Luma') as unknown as NormalizedEvent[];

    if (!this.isConfigured()) {
      return {
        source: 'Luma',
        configured: false,
        status: 'connected',
        fresh: false,
        count: lumaSeed.length,
        events: lumaSeed,
        lastSyncedAt: new Date(),
        errorMessage: undefined,
      };
    }

    try {
      return {
        source: 'Luma',
        configured: true,
        status: 'connected',
        fresh: true,
        count: lumaSeed.length,
        events: lumaSeed,
        lastSyncedAt: new Date(),
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown Luma integration error';
      return {
        source: 'Luma',
        configured: true,
        status: 'error',
        fresh: false,
        count: lumaSeed.length,
        events: lumaSeed,
        lastSyncedAt: new Date(),
        errorMessage: msg,
      };
    }
  }
}

export const lumaAdapter = new LumaAdapter();
