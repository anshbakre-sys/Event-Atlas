import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserModel, IUser } from '../models/User.ts';
import { isDbConnected, getFallbackUsers, addFallbackUser } from '../config/database.ts';
import { calculateAge } from '../utils/age.ts';

// In-memory token store for session mapping
const tokenSessions = new Map<string, { userId: string; email: string; expiresAt: number }>();

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  userAge: number | null;
  phone?: string;
  preferredCity?: string;
  preferences?: {
    favoriteCategories?: string[];
    maxBudget?: number;
  };
}

export class AuthService {
  public static async register(data: {
    name: string;
    email: string;
    password: string;
    dateOfBirth: string;
    phone?: string;
    preferredCity?: string;
  }): Promise<{ user: SafeUser; token: string }> {
    const { name, email, password, dateOfBirth, phone, preferredCity } = data;

    if (!name || !email || !password || !dateOfBirth) {
      throw new Error('Name, email, password, and date of birth are required.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const passwordHash = await bcrypt.hash(password, 10);

    if (isDbConnected()) {
      const existing = await UserModel.findOne({ email: normalizedEmail });
      if (existing) {
        throw new Error('An account with this email already exists.');
      }

      const user = await UserModel.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        dateOfBirth,
        phone: phone?.trim(),
        preferredCity: preferredCity?.trim() || 'Indore',
      });

      const token = this.generateToken(user._id.toString(), user.email);
      return { user: this.toSafeUser(user), token };
    } else {
      const existing = getFallbackUsers().find((u) => u.email === normalizedEmail);
      if (existing) {
        throw new Error('An account with this email already exists.');
      }

      const user = {
        _id: `user-${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        dateOfBirth,
        phone: phone?.trim(),
        preferredCity: preferredCity?.trim() || 'Indore',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addFallbackUser(user);

      const token = this.generateToken(user._id, user.email);
      return { user: this.toSafeUser(user), token };
    }
  }

  public static async login(email: string, password: string): Promise<{ user: SafeUser; token: string }> {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected()) {
      const user = await UserModel.findOne({ email: normalizedEmail });
      if (!user) {
        throw new Error('Invalid email or password.');
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new Error('Invalid email or password.');
      }

      const token = this.generateToken(user._id.toString(), user.email);
      return { user: this.toSafeUser(user), token };
    } else {
      const user = getFallbackUsers().find((u) => u.email === normalizedEmail);
      if (!user) {
        throw new Error('Invalid email or password.');
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new Error('Invalid email or password.');
      }

      const token = this.generateToken(user._id, user.email);
      return { user: this.toSafeUser(user), token };
    }
  }

  public static async getUserById(userId: string): Promise<SafeUser | null> {
    if (isDbConnected()) {
      const user = await UserModel.findById(userId);
      return user ? this.toSafeUser(user) : null;
    } else {
      const user = getFallbackUsers().find((u) => u._id === userId);
      return user ? this.toSafeUser(user) : null;
    }
  }

  public static async updateProfile(
    userId: string,
    updates: {
      name?: string;
      dateOfBirth?: string;
      phone?: string;
      preferredCity?: string;
      preferences?: {
        favoriteCategories?: string[];
        maxBudget?: number;
      };
    }
  ): Promise<SafeUser> {
    if (isDbConnected()) {
      const user = await UserModel.findById(userId);
      if (!user) throw new Error('User not found.');

      if (updates.name) user.name = updates.name.trim();
      if (updates.dateOfBirth) user.dateOfBirth = updates.dateOfBirth;
      if (updates.phone !== undefined) user.phone = updates.phone.trim();
      if (updates.preferredCity) user.preferredCity = updates.preferredCity.trim();
      if (updates.preferences) {
        user.preferences = { ...user.preferences, ...updates.preferences };
      }

      await user.save();
      return this.toSafeUser(user);
    } else {
      const user = getFallbackUsers().find((u) => u._id === userId);
      if (!user) throw new Error('User not found.');

      if (updates.name) user.name = updates.name.trim();
      if (updates.dateOfBirth) user.dateOfBirth = updates.dateOfBirth;
      if (updates.phone !== undefined) user.phone = updates.phone.trim();
      if (updates.preferredCity) user.preferredCity = updates.preferredCity.trim();
      if (updates.preferences) {
        user.preferences = { ...user.preferences, ...updates.preferences };
      }
      user.updatedAt = new Date();
      return this.toSafeUser(user);
    }
  }

  public static verifyToken(token: string): { userId: string; email: string } | null {
    const session = tokenSessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      tokenSessions.delete(token);
      return null;
    }
    return { userId: session.userId, email: session.email };
  }

  public static revokeToken(token: string): void {
    tokenSessions.delete(token);
  }

  private static generateToken(userId: string, email: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    tokenSessions.set(token, { userId, email, expiresAt });
    return token;
  }

  private static toSafeUser(user: any): SafeUser {
    const age = calculateAge(user.dateOfBirth);
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      userAge: age,
      phone: user.phone,
      preferredCity: user.preferredCity,
      preferences: user.preferences,
    };
  }
}
