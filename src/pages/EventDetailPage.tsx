import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Share2,
  Navigation,
  AlertCircle,
} from 'lucide-react';
import { eventApi } from '../services/api';
import { NormalizedEvent } from '../types';
import { PlatformBadge } from '../components/events/PlatformBadge';
import { BookingHandoffModal } from '../components/booking/BookingHandoffModal';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

export const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { referenceCoordinates } = useLocation();
  const { user } = useAuth();

  const [event, setEvent] = useState<NormalizedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await eventApi.getEventById(
          eventId,
          referenceCoordinates.lat,
          referenceCoordinates.lng
        );
        setEvent(data);
      } catch (err: unknown) {
        setError(
          'This event could not be found or is restricted based on your age profile.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [eventId, referenceCoordinates, user?.userAge]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full animate-pulse space-y-6">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="h-72 bg-slate-800 rounded-2xl w-full" />
        <div className="space-y-3">
          <div className="h-6 bg-slate-800 rounded w-1/2" />
          <div className="h-4 bg-slate-800 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex-1 max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Event Unavailable</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          {error || 'This event could not be found or is restricted.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Map Discovery
        </Link>
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const formattedDate = startDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const priceDisplay =
    event.startingPrice === 0
      ? 'Free Admission'
      : event.fullPriceRange || `From ₹${event.startingPrice.toLocaleString('en-IN')}`;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 pb-16">
      {/* Top Breadcrumb Nav */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copiedLink ? 'Link Copied!' : 'Share Event'}</span>
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Hero Banner */}
        <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
          <img
            src={event.imageUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1200&q=80'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Badges on Hero */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <PlatformBadge source={event.source} size="md" />
            {event.isAgeRestricted && (
              <span className="px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> 18+ Only
              </span>
            )}
          </div>

          {/* Floating Hero Title & Action */}
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> {event.category}
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                {event.title}
              </h1>
            </div>

            {/* Price Pill */}
            <div className="shrink-0 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl px-4 py-2.5 shadow-xl text-left sm:text-right">
              <span className="text-[10px] text-slate-400 block font-medium">Ticket Pricing</span>
              <span className="text-base sm:text-lg font-extrabold text-white">
                {priceDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Two-Column Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview / Key Details Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-4">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Event Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Date & Time */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Date</span>
                    <span className="font-semibold text-slate-100">{formattedDate}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Start Time</span>
                    <span className="font-semibold text-slate-100">{formattedTime} ({event.timezone || 'IST'})</span>
                  </div>
                </div>

                {/* Venue & Location */}
                <div className="flex items-start gap-3 sm:col-span-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Venue & Address</span>
                    <span className="font-semibold text-slate-100 block">{event.venueName}</span>
                    <span className="text-slate-400 text-[11px] block">{event.venueAddress || `${event.city}, ${event.country}`}</span>
                    {event.distanceKm !== undefined && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 mt-1 font-medium">
                        <Navigation className="w-3 h-3" />
                        {event.distanceKm < 1
                          ? `${Math.round(event.distanceKm * 1000)} meters away`
                          : `${event.distanceKm.toFixed(1)} km from your reference location`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                About this Experience
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {event.description || 'No detailed description provided by the event organizer.'}
              </p>

              {/* Tags */}
              {event.categoryTags && event.categoryTags.length > 0 && (
                <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-1.5">
                  {event.categoryTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Action / Booking Column */}
          <div className="space-y-4">
            {/* Action Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Listed on</span>
                <PlatformBadge source={event.source} size="md" />
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Admission</span>
                <span className="text-2xl font-black text-white">{priceDisplay}</span>
              </div>

              {/* Booking CTA Button */}
              <button
                onClick={() => setHandoffOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01]"
              >
                <span>Book / Register on {event.source}</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-slate-400 space-y-1">
                <p className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  Official verified ticket partner link
                </p>
                <p>
                  Includes autofill handoff to streamline registration with your profile.
                </p>
              </div>
            </div>

            {/* Organizer Info Card */}
            {event.organizer && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Organizer</span>
                <p className="font-semibold text-white">{event.organizer}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Handoff Modal */}
      <BookingHandoffModal
        isOpen={handoffOpen}
        onClose={() => setHandoffOpen(false)}
        event={{
          eventId: event.eventId,
          title: event.title,
          source: event.source,
          bookingUrl: event.bookingUrl,
          startingPrice: event.startingPrice,
          venueName: event.venueName,
          city: event.city,
        }}
      />
    </div>
  );
};
