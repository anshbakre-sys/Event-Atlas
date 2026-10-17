import mongoose, { Schema, Document } from 'mongoose';

export interface ISourceStatus extends Document {
  source: 'District' | 'BookMyShow' | 'Luma';
  name: string;
  isConfigured: boolean;
  status: 'connected' | 'syncing' | 'error' | 'not_configured';
  lastSyncedAt?: Date;
  recordsCount: number;
  errorMessage?: string;
}

const SourceStatusSchema = new Schema<ISourceStatus>(
  {
    source: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    isConfigured: { type: Boolean, default: true },
    status: { type: String, enum: ['connected', 'syncing', 'error', 'not_configured'], default: 'connected' },
    lastSyncedAt: { type: Date, default: Date.now },
    recordsCount: { type: Number, default: 0 },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

export const SourceStatusModel =
  mongoose.models.SourceStatus || mongoose.model<ISourceStatus>('SourceStatus', SourceStatusSchema);
