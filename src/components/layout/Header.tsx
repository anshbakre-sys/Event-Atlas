import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Sparkles,
  User as UserIcon,
  LogOut,
  Navigation,
  ChevronDown,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { KNOWN_CITIES } from '../../types';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedCity, selectCityByName, requestBrowserLocation, isLocating, hasLocationPermission } =
    useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                Event Atlas
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Map-First
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              District · BookMyShow · Luma
            </p>
          </div>
        </Link>

        {/* Center / Location Selector */}
        <div className="flex items-center gap-2">
          {/* City Selector */}
          <div className="relative">
            <button
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-colors"
              aria-label="Select City"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium">{selectedCity.name}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {cityDropdownOpen && (
              <div
                className="absolute left-0 mt-1 w-44 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-1"
                onClick={() => setCityDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] uppercase font-semibold tracking-wider text-slate-400 border-b border-slate-800">
                  Select Hub City
                </div>
                {KNOWN_CITIES.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => selectCityByName(city.name)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      selectedCity.name === city.name
                        ? 'text-indigo-400 font-semibold bg-indigo-500/10'
                        : 'text-slate-300'
                    }`}
                  >
                    <span>{city.name}</span>
                    <span className="text-[10px] text-slate-500">{city.state}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Near Me GPS locator */}
          <button
            onClick={requestBrowserLocation}
            disabled={isLocating}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              hasLocationPermission
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
            title="Use current GPS location"
            aria-label="Use current location"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">
              {isLocating ? 'Locating...' : hasLocationPermission ? 'GPS Active' : 'Near Me'}
            </span>
          </button>
        </div>

        {/* Right Actions: AI Assistant & User Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AI Event Assistant Entrypoint */}
          <Link
            to="/assistant"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600/30 to-violet-600/30 border border-indigo-500/40 hover:border-indigo-400 text-indigo-200 text-xs font-semibold shadow-sm hover:shadow-indigo-500/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
            <span>AI Assistant</span>
          </Link>

          {/* User Account / Auth */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-colors"
                aria-label="User Account Menu"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center font-bold text-[11px]">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="font-medium text-slate-200 truncate max-w-[90px]">{user.name}</span>
                  <span className="text-[10px] text-slate-400">
                    {user.userAge !== null ? `${user.userAge} yrs` : 'User'}
                  </span>
                </div>
                {/* Age Eligibility indicator */}
                {user.userAge !== null && user.userAge >= 18 ? (
                  <span
                    title="18+ verified: All events visible"
                    className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  >
                    18+
                  </span>
                ) : (
                  <span
                    title="Safe Mode: Under 18 filtered"
                    className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  >
                    Safe Mode
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-1 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-semibold text-xs text-white">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                      {user.userAge !== null && user.userAge >= 18 ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> 18+ Adult Content Enabled
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Under 18 Safe Mode Active
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Profile & Preferences</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to="/login"
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
