import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { EventCard } from '../components/events/EventCard';
import { EventFilterBar } from '../components/events/EventFilterBar';
import { EventMap } from '../components/map/EventMap';
import { eventApi } from '../services/api';
import { NormalizedEvent, EventFilterState } from '../types';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { Map as MapIcon, List, AlertCircle, RefreshCw } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCity, referenceCoordinates } = useLocation();

  // Filters state initialized from URL params if present (e.g. from AI assistant)
  const [filters, setFilters] = useState<EventFilterState>(() => {
    const categoriesParam = searchParams.get('categories');
    const citiesParam = searchParams.get('cities');
    const platformsParam = searchParams.get('platforms');
    const budgetParam = searchParams.get('budget');
    const endDateParam = searchParams.get('endDate');
    const searchParam = searchParams.get('search');

    return {
      searchQuery: searchParam || '',
      platforms: platformsParam ? platformsParam.split(',') : [],
      categories: categoriesParam ? categoriesParam.split(',') : [],
      cities: citiesParam ? citiesParam.split(',') : [],
      priceType: 'all',
      budget: budgetParam ? Number(budgetParam) : undefined,
      endDate: endDateParam || undefined,
      sortBy: 'date',
    };
  });

  const [events, setEvents] = useState<NormalizedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');

  // Load events whenever filters, referenceCoordinates, or user age changes
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await eventApi.getEvents({
        filters,
        userLat: referenceCoordinates.lat,
        userLng: referenceCoordinates.lng,
      });

      setEvents(data.events);

      // Default select the first event if none selected or previous selection no longer in list
      if (data.events.length > 0) {
        if (!selectedEvent || !data.events.some((e) => e.eventId === selectedEvent.eventId)) {
          setSelectedEvent(data.events[0]);
        }
      } else {
        setSelectedEvent(null);
      }
    } catch (err: unknown) {
      setError('Unable to load events at this time. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters, referenceCoordinates, user?.userAge]);

  const handleFilterChange = (updated: Partial<EventFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      platforms: [],
      categories: [],
      cities: [],
      priceType: 'all',
      budget: undefined,
      startDate: undefined,
      endDate: undefined,
      sortBy: 'date',
    });
  };

  const handleOpenDetails = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] min-h-0 overflow-hidden">
      {/* Mobile Toggle Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0">
        <span className="text-xs font-semibold text-slate-300">
          {events.length} Events in {selectedCity.name}
        </span>
        <div className="flex rounded-lg bg-slate-800 p-0.5">
          <button
            onClick={() => setMobileTab('map')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              mobileTab === 'map' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" /> Map
          </button>
          <button
            onClick={() => setMobileTab('list')}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              mobileTab === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
        </div>
      </div>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row h-full min-h-0 overflow-hidden">
        {/* Left Sidebar: Discovery & Event List */}
        <aside
          className={`w-full lg:w-[460px] xl:w-[500px] shrink-0 bg-slate-950 flex flex-col h-full min-h-0 border-r border-slate-800/80 z-10 ${
            mobileTab === 'list' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Top Filter Controls */}
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/95 shrink-0 z-20">
            <EventFilterBar
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
              totalResults={events.length}
            />
          </div>

          {/* Scrollable Event List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="p-3.5 rounded-xl border border-slate-800/60 bg-slate-900/30 animate-pulse flex gap-3"
                  >
                    <div className="w-24 h-24 rounded-lg bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-slate-800 rounded w-3/4" />
                      <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                      <div className="h-3 bg-slate-800/60 rounded w-2/3" />
                      <div className="h-4 bg-slate-800 rounded w-1/4 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
                <p className="text-xs text-rose-200">{error}</p>
                <button
                  onClick={fetchEvents}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry
                </button>
              </div>
            ) : events.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                  <MapIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <h4 className="font-bold text-sm text-white">No Matching Events Found</h4>
                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                  We couldn't find any events matching your selected criteria. Try relaxing your budget ceiling, widening your date boundary, or exploring another city.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              events.map((event) => (
                <EventCard
                  key={event.eventId}
                  event={event}
                  isSelected={selectedEvent?.eventId === event.eventId}
                  onSelect={(evt) => setSelectedEvent(evt)}
                  onOpenDetails={handleOpenDetails}
                />
              ))
            )}
          </div>
        </aside>

        {/* Right Main Map Area */}
        <main
          className={`flex-1 h-full relative overflow-hidden bg-slate-950 ${
            mobileTab === 'map' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <EventMap
            events={events}
            selectedEvent={selectedEvent}
            onSelectEvent={(evt) => {
              setSelectedEvent(evt);
            }}
            onOpenDetails={handleOpenDetails}
          />
        </main>
      </div>
    </div>
  );
};
