import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Calendar,
  Phone,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Save,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  IndianRupee,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { KNOWN_CITIES } from '../types';

interface ProfileFormValues {
  name: string;
  dateOfBirth: string;
  phone?: string;
  preferredCity: string;
  maxBudget?: number;
}

export const ProfilePage: React.FC = () => {
  const { user, loading: authLoading, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<ProfileFormValues>();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    } else if (user) {
      reset({
        name: user.name,
        dateOfBirth: user.dateOfBirth,
        phone: user.phone || '',
        preferredCity: user.preferredCity || 'Indore',
        maxBudget: user.preferences?.maxBudget || 2000,
      });
    }
  }, [user, authLoading, reset, navigate]);

  const watchedDob = watch('dateOfBirth');
  let currentComputedAge: number | null = null;
  if (watchedDob) {
    const bDate = new Date(watchedDob);
    if (!isNaN(bDate.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - bDate.getFullYear();
      const m = today.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
        age--;
      }
      currentComputedAge = age;
    }
  }

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setFeedback(null);
      await authApi.updateProfile({
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        phone: data.phone,
        preferredCity: data.preferredCity,
        preferences: {
          maxBudget: data.maxBudget,
        },
      });
      await refreshUser();
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update profile.',
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const isEligibleForAdultEvents = user.userAge !== null && user.userAge >= 18;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Event Discovery
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>

        {/* Profile Card */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-600/30">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{user.name}</h1>
                <p className="text-xs text-slate-400">{user.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    City: {user.preferredCity || 'Indore'}
                  </span>
                </div>
              </div>
            </div>

            {/* Age Verification Badge */}
            <div className="text-right">
              {isEligibleForAdultEvents ? (
                <div className="inline-flex flex-col items-end">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 18+ Verified
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {user.userAge} years old · All events unlocked
                  </span>
                </div>
              ) : (
                <div className="inline-flex flex-col items-end">
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Safe Mode Active
                  </span>
                  <span className="text-[10px] text-amber-400 mt-1">
                    Under 18 ({user.userAge} yrs) · Adult content hidden
                  </span>
                </div>
              )}
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Profile & Booking Handoff Settings
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white"
                />
              </div>
            </div>

            {/* Date of Birth & Age Display */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Date of Birth
                </label>
                {currentComputedAge !== null && (
                  <span className="text-[11px] text-slate-400">
                    Computed Age: <strong className="text-white">{currentComputedAge} years</strong>
                  </span>
                )}
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  {...register('dateOfBirth', { required: 'Date of birth is required' })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Your age is dynamically evaluated on the backend to enforce age eligibility rules.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Phone (for booking handoff autofill)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <select
                    {...register('preferredCity')}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white"
                  >
                    {KNOWN_CITIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.state})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Default Budget Preference */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                Default Budget Preference (INR)
              </label>
              <input
                type="number"
                step="100"
                {...register('maxBudget', { valueAsNumber: true })}
                placeholder="2000"
                className="w-full px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Profile Details
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
