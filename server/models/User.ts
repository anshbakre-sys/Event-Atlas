import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  dateOfBirth: string; // YYYY-MM-DD
  phone?: string;
  preferredCity?: string;
  preferences?: {
    favoriteCategories?: string[];
    maxBudget?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    dateOfBirth: { type: String, required: true },
    phone: { type: String, trim: true },
    preferredCity: { type: String, trim: true, default: 'Indore' },
    preferences: {
      favoriteCategories: [{ type: String }],
      maxBudget: { type: Number, default: 2000 },
    },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
