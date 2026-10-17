import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Compass,
  ArrowRight,
  MapPin,
  Calendar,
  IndianRupee,
  Tag,
  ShieldAlert,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { assistantApi } from '../services/api';
import { NormalizedEvent } from '../types';
import { PlatformBadge } from '../components/events/PlatformBadge';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  criteria?: {
    categories?: string[];
    cities?: string[];
    budget?: number;
    startDate?: string;
    endDate?: string;
    platforms?: string[];
    nearMe?: boolean;
  };
  events?: NormalizedEvent[];
}

export const AssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCity, referenceCoordinates } = useLocation();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I'm your Event Atlas discovery agent powered by Gemini. You can describe your plans in plain English—mention dates, cities, categories, or budgets—and I will match real verified events across District, BookMyShow, and Luma.`,
    },
  ]);

  const examplePrompts = [
    'Is there any rock events near me before 20 December? My budget is ₹1,000, and I can go to Indore, Mumbai, or Delhi.',
    'Find free developer meetups and hackathons in Mumbai and Bengaluru',
    'Show me stand-up comedy shows under ₹800 in Indore or Delhi',
    'Cultural and classical music concerts this month',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const data = await assistantApi.search({
        prompt: textToSend,
        userLat: referenceCoordinates.lat,
        userLng: referenceCoordinates.lng,
        currentCity: selectedCity.name,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        criteria: data.criteria,
        events: data.events,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          text: 'I ran into an issue connecting to the event search engine. Please try rephrasing your request or search directly on the map.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToMap = (criteria?: ChatMessage['criteria']) => {
    if (!criteria) {
      navigate('/');
      return;
    }

    const params = new URLSearchParams();
    if (criteria.categories && criteria.categories.length > 0) {
      params.set('categories', criteria.categories.join(','));
    }
    if (criteria.cities && criteria.cities.length > 0) {
      params.set('cities', criteria.cities.join(','));
    }
    if (criteria.budget !== undefined) {
      params.set('budget', String(criteria.budget));
    }
    if (criteria.endDate) {
      params.set('endDate', criteria.endDate);
    }
    if (criteria.platforms && criteria.platforms.length > 0) {
      params.set('platforms', criteria.platforms.join(','));
    }

    navigate(`/?${params.toString()}`);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-57px)] max-w-4xl mx-auto w-full px-4 py-4 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-white">
              AI Event Discovery Agent
            </h1>
            <p className="text-[11px] text-slate-400">
              Grounded in live database records · Powered by Gemini
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
        >
          <Compass className="w-3.5 h-3.5 text-indigo-400" />
          <span>Explore Map</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            {/* Message Bubble */}
            <div
              className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-xl'
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>

              {/* Extracted Criteria Chips */}
              {msg.criteria && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="text-slate-400 font-semibold self-center mr-1">
                    Interpreted:
                  </span>
                  {msg.criteria.categories?.map((cat) => (
                    <span
                      key={cat}
                      className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-500/40"
                    >
                      🏷 {cat}
                    </span>
                  ))}
                  {msg.criteria.cities?.map((city) => (
                    <span
                      key={city}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      📍 {city}
                    </span>
                  ))}
                  {msg.criteria.budget !== undefined && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      ₹ Budget ≤ {msg.criteria.budget}
                    </span>
                  )}
                  {msg.criteria.endDate && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      📅 Before{' '}
                      {new Date(msg.criteria.endDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>
              )}

              {/* Grounded Matching Event Cards */}
              {msg.events && msg.events.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-white">
                      Matching Verified Events ({msg.events.length})
                    </span>
                    <button
                      onClick={() => handleApplyToMap(msg.criteria)}
                      className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <span>View on Interactive Map</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {msg.events.map((evt) => (
                      <div
                        key={evt.eventId}
                        className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <img
                            src={evt.imageUrl || ''}
                            alt={evt.title}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-800 shrink-0"
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <PlatformBadge source={evt.source} size="sm" />
                              <span className="text-[10px] text-slate-400">
                                {new Date(evt.startDate).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            </div>
                            <h4 className="font-bold text-xs text-white truncate">
                              {evt.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              📍 {evt.venueName}, {evt.city}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 gap-1.5">
                          <span className="text-xs font-extrabold text-white">
                            {evt.startingPrice === 0 ? 'Free' : `₹${evt.startingPrice}`}
                          </span>
                          <button
                            onClick={() => navigate(`/events/${evt.eventId}`)}
                            className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 text-indigo-300 hover:text-white text-[10px] font-bold transition-colors"
                          >
                            Details →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 w-fit text-slate-300 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            <span>Gemini is parsing constraints and searching verified event catalog...</span>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 2 && (
        <div className="py-2 space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400">
            Try an example prompt:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {examplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 text-slate-300 hover:text-white transition-colors"
              >
                "{p}"
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Query Input Bar */}
      <div className="pt-2 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about events e.g. Rock concerts in Indore or Mumbai before Dec 20 under ₹1,000..."
            disabled={loading}
            className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 disabled:opacity-60 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-500 transition-colors shadow-md"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
