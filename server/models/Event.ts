import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  eventId: string;
  title: string;
  description: string;
  category: string;
  categoryTags: string[];
  source: 'District' | 'BookMyShow' | 'Luma';
  sourceEventId: string;
  imageUrl: string;
  startDate: string; // ISO date
  endDate?: string;
  timezone: string;
  venueName: string;
  venueAddress: string;
  city: string;
  state?: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  startingPrice: number;
  fullPriceRange?: string;
  currency: string;
  bookingUrl: string;
  minAge: number;
  isAgeRestricted: boolean;
  organizer?: string;
  status: 'scheduled' | 'cancelled' | 'sold_out';
  lastSyncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, required: true, index: true },
    categoryTags: [{ type: String }],
    source: { type: String, required: true, enum: ['District', 'BookMyShow', 'Luma'], index: true },
    sourceEventId: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    startDate: { type: String, required: true, index: true },
    endDate: { type: String },
    timezone: { type: String, default: 'Asia/Kolkata' },
    venueName: { type: String, required: true },
    venueAddress: { type: String, default: '' },
    city: { type: String, required: true, index: true },
    state: { type: String },
    country: { type: String, default: 'India' },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    startingPrice: { type: Number, required: true, default: 0, index: true },
    fullPriceRange: { type: String },
    currency: { type: String, default: 'INR' },
    bookingUrl: { type: String, required: true },
    minAge: { type: Number, default: 0 },
    isAgeRestricted: { type: Boolean, default: false, index: true },
    organizer: { type: String },
    status: { type: String, enum: ['scheduled', 'cancelled', 'sold_out'], default: 'scheduled' },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound indexes for fast multi-dimensional queries
EventSchema.index({ city: 1, startDate: 1 });
EventSchema.index({ category: 1, startingPrice: 1 });
EventSchema.index({ source: 1, sourceEventId: 1 }, { unique: true });

export const EventModel = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
