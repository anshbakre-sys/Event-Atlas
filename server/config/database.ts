import mongoose from 'mongoose';
import { EventModel } from '../models/Event.ts';
import { SourceStatusModel } from '../models/SourceStatus.ts';
import { SEED_EVENTS } from '../integrations/seedData.ts';

let isConnected = false;
let fallbackMemoryEvents: any[] = [];
let fallbackMemoryUsers: any[] = [];

export async function connectDB(): Promise<boolean> {
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      console.log('Connecting to MongoDB via Mongoose...');
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      console.log('MongoDB connected successfully via Mongoose.');
      await seedDatabaseIfEmpty();
      return true;
    } catch (err: unknown) {
      console.warn('MongoDB connection failed, enabling resilient in-memory fallback:', err instanceof Error ? err.message : err);
      isConnected = false;
      initFallbackData();
      return false;
    }
  } else {
    // If MONGODB_URI is not provided in environment, initialize resilient in-memory store
    console.log('MONGODB_URI not provided. Running in resilient mock/in-memory mode for development.');
    isConnected = false;
    initFallbackData();
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function getFallbackEvents(): any[] {
  return fallbackMemoryEvents;
}

export function setFallbackEvents(events: any[]): void {
  fallbackMemoryEvents = events;
}

export function getFallbackUsers(): any[] {
  return fallbackMemoryUsers;
}

export function addFallbackUser(user: any): void {
  fallbackMemoryUsers.push(user);
}

function initFallbackData() {
  fallbackMemoryEvents = [...SEED_EVENTS].map((e) => ({
    ...e,
    _id: `mem-${e.eventId}`,
    lastSyncedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

async function seedDatabaseIfEmpty() {
  try {
    const count = await EventModel.countDocuments();
    if (count === 0) {
      console.log('Seeding initial event catalog into MongoDB...');
      await EventModel.insertMany(SEED_EVENTS);
      console.log(`Seeded ${SEED_EVENTS.length} events into MongoDB.`);
    }

    // Initialize SourceStatus
    const sources: Array<'District' | 'BookMyShow' | 'Luma'> = ['District', 'BookMyShow', 'Luma'];
    for (const source of sources) {
      const existing = await SourceStatusModel.findOne({ source });
      const srcEventsCount = await EventModel.countDocuments({ source });
      if (!existing) {
        await SourceStatusModel.create({
          source,
          name: source === 'District' ? 'District by Zomato' : source === 'BookMyShow' ? 'BookMyShow' : 'Luma Events',
          isConfigured: true,
          status: 'connected',
          recordsCount: srcEventsCount,
          lastSyncedAt: new Date(),
        });
      } else {
        existing.recordsCount = srcEventsCount;
        await existing.save();
      }
    }
  } catch (err) {
    console.error('Error seeding initial event catalog:', err);
  }
}
