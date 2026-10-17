import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Lock, Mail, User, Calendar, Phone, MapPin, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { KNOWN_CITIES } from '../types';

interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string;
  phone?: string;
  preferredCity: string;
}

export const SignupPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    defaultValues: {
      preferredCity: 'Indore',
    },
  });

  const selectedDob = watch('dateOfBirth');

  // Preview calculated age
  let calculatedAge: number | null = null;
  if (selectedDob) {
    const bDate = new Date(selectedDob);
    if (!isNaN(bDate.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - bDate.getFullYear();
      const m = today.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
        age--;
      }
      calculatedAge = age;
    }
  }

  const onSubmit = async (data: SignupFormValues) => {
    try {
      setError(null);
      await registerAuth(data);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Join Event Atlas
          </h2>
          <p className="text-xs text-slate-400">
            Create an account to unlock personalized recommendations and age-verified discovery
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form with react-hook-form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                {...register('name', { required: 'Name is required' })}
                placeholder="Rohan Sharma"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder:text-slate-600 transition-colors"
              />
            </div>
            {errors.name && (
              <span className="text-[11px] text-rose-400 mt-0.5 block">{errors.name.message}</span>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Valid email required',
                  },
                })}
                placeholder="rohan@example.com"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder:text-slate-600 transition-colors"
              />
            </div>
            {errors.email && (
              <span className="text-[11px] text-rose-400 mt-0.5 block">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters long',
                  },
                })}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder:text-slate-600 transition-colors"
              />
            </div>
            {errors.password && (
              <span className="text-[11px] text-rose-400 mt-0.5 block">{errors.password.message}</span>
            )}
          </div>

          {/* Date of Birth (Mandatory for Age Eligibility) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Date of Birth <span className="text-indigo-400">*</span>
              </label>
              {calculatedAge !== null && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    calculatedAge >= 18
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  Age: {calculatedAge} years ({calculatedAge >= 18 ? '18+ Eligible' : 'Safe Mode'})
                </span>
              )}
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="date"
                {...register('dateOfBirth', {
                  required: 'Date of birth is required to determine age eligibility',
                })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white transition-colors"
              />
            </div>
            {errors.dateOfBirth && (
              <span className="text-[11px] text-rose-400 mt-0.5 block">
                {errors.dateOfBirth.message}
              </span>
            )}
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400 shrink-0" />
              Used automatically to protect underage users from adult (18+) restricted events.
            </p>
          </div>

          {/* Two Columns: Phone and Preferred City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phone (Optional for Booking Handoff) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white placeholder:text-slate-600 transition-colors"
                />
              </div>
            </div>

            {/* Preferred City */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Primary City
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <select
                  {...register('preferredCity')}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs text-white transition-colors"
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-colors mt-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
