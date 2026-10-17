import React from 'react';
import { Calendar, MapPin, Navigation, Tag, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { NormalizedEvent } from '../../types';
import { PlatformBadge } from './PlatformBadge';

interface EventCardProps {
  event: NormalizedEvent;
  isSelected?: boolean;
  onSelect: (event: NormalizedEvent) => void;
  onOpenDetails: (eventId: string) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  isSelected,
  onSelect,
  onOpenDetails,
}) => {
  // Format date and time
  const startDate = new Date(event.startDate);
  const formattedDate = startDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const formattedTime = startDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedPrice =
    event.startingPrice === 0
      ? 'Free'
      : `₹${event.startingPrice.toLocaleString('en-IN')}`;

  const formatDistance = (km?: number) => {
    if (km === undefined || !isFinite(km)) return null;
    if (km < 1) return `${Math.round(km * 1000)}m away`;
    return `${km.toFixed(1)} km away`;
  };

  const distanceText = formatDistance(event.distanceKm);

  return (
    <div
      onClick={() => onSelect(event)}
      className={`group relative rounded-xl border p-3.5 transition-all cursor-pointer ${
        isSelected
          ? 'bg-slate-900/90 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
          : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
      }`}
    >
      <div className="flex gap-3">
        {/* Thumbnail Image */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-lg overflow-hidden bg-slate-800">
          <img
            src={event.imageUrl || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=600&q=80'}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-1.5 left-1.5">
            <PlatformBadge source={event.source} size="sm" />
          </div>
          {event.isAgeRestricted && (
            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-[9px] font-bold text-rose-300 flex items-center gap-0.5 backdrop-blur-sm">
              <ShieldAlert className="w-2.5 h-2.5" /> 18+
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Category tag & Distance */}
            <div className="flex items-center justify-between gap-1 text-[11px] mb-1">
              <span className="text-indigo-400 font-medium truncate flex items-center gap-1">
                <Tag className="w-3 h-3 shrink-0" />
                {event.category}
              </span>
              {distanceText && (
                <span className="text-slate-400 font-medium shrink-0 flex items-center gap-0.5 bg-slate-800/60 px-1.5 py-0.5 rounded text-[10px]">
                  <Navigation className="w-2.5 h-2.5 text-blue-400" />
                  {distanceText}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-indigo-300 transition-colors">
              {event.title}
            </h3>

            {/* Date & Time */}
            <div className="flex items-center gap-1 text-[11px] text-slate-300 mt-1">
              <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
              <span>
                {formattedDate} · {formattedTime}
              </span>
            </div>

            {/* Venue & City */}
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="truncate">
                {event.venueName}, {event.city}
              </span>
            </div>
          </div>

          {/* Bottom Bar: Price & View Action */}
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">Starts at</span>
              <span className={`text-xs sm:text-sm font-extrabold ${event.startingPrice === 0 ? 'text-emerald-400' : 'text-white'}`}>
                {formattedPrice}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(event.eventId);
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-indigo-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition-all"
            >
              <span>Details</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
