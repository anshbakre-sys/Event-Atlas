import React, { useState } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  IndianRupee,
  Calendar,
} from 'lucide-react';
import { EventFilterState, CATEGORY_LIST } from '../../types';

interface EventFilterBarProps {
  filters: EventFilterState;
  onChange: (updated: Partial<EventFilterState>) => void;
  onReset: () => void;
  totalResults: number;
}

export const EventFilterBar: React.FC<EventFilterBarProps> = ({
  filters,
  onChange,
  onReset,
  totalResults,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const platformsList = ['District', 'BookMyShow', 'Luma'] as const;

  const togglePlatform = (platform: string) => {
    let current = [...filters.platforms];
    if (current.includes(platform)) {
      current = current.filter((p) => p !== platform);
    } else {
      current.push(platform);
    }
    onChange({ platforms: current });
  };

  const toggleCategory = (cat: string) => {
    let current = [...filters.categories];
    if (current.includes(cat)) {
      current = current.filter((c) => c !== cat);
    } else {
      current.push(cat);
    }
    onChange({ categories: current });
  };

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    filters.platforms.length > 0 ||
    filters.categories.length > 0 ||
    filters.priceType !== 'all' ||
    filters.budget !== undefined ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate);

  return (
    <div className="space-y-3">
      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onChange({ searchQuery: e.target.value })}
          placeholder="Search rock concerts, comedy, hackathons, venues..."
          className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 transition-colors"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onChange({ searchQuery: '' })}
            className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Primary Row: Platform Filters + Sort Mode + Advanced Toggle */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        {/* Source Badges Multiselect */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {platformsList.map((platform) => {
            const active = filters.platforms.includes(platform);
            return (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                  active
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500 shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {platform === 'Luma' ? 'Luma Events' : platform}
              </button>
            );
          })}
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Sorting */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              onClick={() => onChange({ sortBy: 'date' })}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                filters.sortBy === 'date'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Sort by upcoming date"
            >
              Date
            </button>
            <button
              onClick={() => onChange({ sortBy: 'distance' })}
              className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                filters.sortBy === 'distance'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Sort by nearest distance"
            >
              Distance
            </button>
          </div>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              showAdvanced || hasActiveFilters
                ? 'bg-slate-800 border-slate-700 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            aria-label="Filter events"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Drawer */}
      {showAdvanced && (
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 animate-in fade-in">
          {/* Price & Budget Filter */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-300 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                Budget & Ticket Price
              </span>
              {filters.budget !== undefined && (
                <span className="text-emerald-400 font-bold">
                  ≤ ₹{filters.budget.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => onChange({ priceType: 'all', budget: undefined })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                  filters.priceType === 'all' && filters.budget === undefined
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-850 border-slate-800 text-slate-400'
                }`}
              >
                All Prices
              </button>
              <button
                onClick={() => onChange({ priceType: 'free', budget: undefined })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                  filters.priceType === 'free'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-850 border-slate-800 text-slate-400'
                }`}
              >
                Free Only
              </button>
              <button
                onClick={() => onChange({ budget: 1000, priceType: 'all' })}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border ${
                  filters.budget === 1000
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-850 border-slate-800 text-slate-400'
                }`}
              >
                Under ₹1,000
              </button>
            </div>

            {/* Budget Slider */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="5000"
                step="250"
                value={filters.budget || 5000}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChange({ budget: val >= 5000 ? undefined : val, priceType: 'all' });
                }}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="text-[10px] text-slate-400 shrink-0">
                {filters.budget ? `Max ₹${filters.budget}` : 'Any Price'}
              </span>
            </div>
          </div>

          {/* Categories Selector */}
          <div>
            <span className="block text-xs font-semibold text-slate-300 mb-1.5">
              Categories
            </span>
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
              {CATEGORY_LIST.map((cat) => {
                const active = filters.categories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                      active
                        ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Date Limits */}
          <div className="pt-1 border-t border-slate-800">
            <span className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Date Boundary
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  const now = new Date().toISOString();
                  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                  onChange({ startDate: now, endDate: in30Days });
                }}
                className="text-[10px] px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300"
              >
                Next 30 Days
              </button>
              <button
                onClick={() => {
                  // Prompt test case: Before 20 December 2026
                  onChange({ endDate: '2026-12-20T23:59:59.000Z' });
                }}
                className={`text-[10px] px-2.5 py-1 rounded border transition-colors ${
                  filters.endDate?.startsWith('2026-12-20')
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                Before 20 Dec
              </button>
              {(filters.startDate || filters.endDate) && (
                <button
                  onClick={() => onChange({ startDate: undefined, endDate: undefined })}
                  className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-300"
                >
                  Clear dates
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
          <span className="text-slate-400 font-medium">Active:</span>

          {filters.searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              "{filters.searchQuery}"
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => onChange({ searchQuery: '' })} />
            </span>
          )}

          {filters.platforms.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40"
            >
              {p}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => togglePlatform(p)} />
            </span>
          ))}

          {filters.categories.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
            >
              {c}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => toggleCategory(c)} />
            </span>
          ))}

          {filters.budget !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              ≤ ₹{filters.budget}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => onChange({ budget: undefined })} />
            </span>
          )}

          {filters.priceType === 'free' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              Free Only
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => onChange({ priceType: 'all' })} />
            </span>
          )}

          {filters.endDate && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Before {new Date(filters.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => onChange({ endDate: undefined })} />
            </span>
          )}

          <button
            onClick={onReset}
            className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold ml-1 flex items-center gap-0.5"
          >
            <RotateCcw className="w-3 h-3" /> Reset all
          </button>
        </div>
      )}

      {/* Results Count Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-0.5">
        <span>
          Showing <strong className="text-white font-bold">{totalResults}</strong> event{totalResults === 1 ? '' : 's'}
        </span>
        <span className="text-[11px] text-slate-500">
          Sorted by {filters.sortBy === 'distance' ? 'Nearest distance' : 'Upcoming date'}
        </span>
      </div>
    </div>
  );
};
