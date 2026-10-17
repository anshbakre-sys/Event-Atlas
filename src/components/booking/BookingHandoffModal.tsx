import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PlatformBadge } from '../events/PlatformBadge';
import { Link } from 'react-router-dom';

interface BookingHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    eventId: string;
    title: string;
    source: 'District' | 'BookMyShow' | 'Luma';
    bookingUrl: string;
    startingPrice: number;
    venueName: string;
    city: string;
  };
}

export const BookingHandoffModal: React.FC<BookingHandoffModalProps> = ({
  isOpen,
  onClose,
  event,
}) => {
  const { user } = useAuth();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(true);

  if (!isOpen) return null;

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Determine prefill URL for Luma
  let targetUrl = event.bookingUrl;
  let prefillAvailable = false;
  if (event.source === 'Luma' && user) {
    try {
      const u = new URL(event.bookingUrl);
      if (user.name) u.searchParams.set('name', user.name);
      if (user.email) u.searchParams.set('email', user.email);
      targetUrl = u.toString();
      prefillAvailable = true;
    } catch (e) {
      targetUrl = event.bookingUrl;
    }
  }

  const handleProceed = () => {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PlatformBadge source={event.source} size="md" />
              <span className="text-xs font-semibold text-slate-400">
                Official Booking Handoff
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1">
              {event.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {event.venueName}, {event.city}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4 text-xs">
          {/* Transparency / Integration Explanation Banner */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Direct Platform Redirect</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Event Atlas aggregates listings and transfers you directly to the verified event organizer on{' '}
              <strong className="text-white">{event.source}</strong> for ticket purchase and registration.
            </p>
            {prefillAvailable ? (
              <p className="text-emerald-400 font-medium text-[11px]">
                ✓ Verified Luma integration: Your name and email will be prefilled in the RSVP form.
              </p>
            ) : (
              <p className="text-slate-400 text-[11px]">
                {event.source} requires checkout on their website. Use the quick-copy buttons below to copy your details with one click.
              </p>
            )}
          </div>

          {/* User Details Autofill Section */}
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Your Saved Profile Details
                </span>
                <span className="text-[10px] text-slate-400">Click to copy</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Full Name */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <span className="text-[10px] text-slate-400 block">Name</span>
                    <span className="font-semibold text-white truncate block">{user.name}</span>
                  </div>
                  <button
                    onClick={() => handleCopy('name', user.name)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                    title="Copy Name"
                  >
                    {copiedField === 'name' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Email Address */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="truncate mr-2">
                    <span className="text-[10px] text-slate-400 block">Email</span>
                    <span className="font-semibold text-white truncate block">{user.email}</span>
                  </div>
                  <button
                    onClick={() => handleCopy('email', user.email)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                    title="Copy Email"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Phone Number */}
                {user.phone && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="truncate mr-2">
                      <span className="text-[10px] text-slate-400 block">Phone</span>
                      <span className="font-semibold text-white truncate block">{user.phone}</span>
                    </div>
                    <button
                      onClick={() => handleCopy('phone', user.phone!)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                      title="Copy Phone"
                    >
                      {copiedField === 'phone' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                {/* Date of Birth */}
                {user.dateOfBirth && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="truncate mr-2">
                      <span className="text-[10px] text-slate-400 block">DOB</span>
                      <span className="font-semibold text-white truncate block">{user.dateOfBirth}</span>
                    </div>
                    <button
                      onClick={() => handleCopy('dob', user.dateOfBirth)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                      title="Copy Date of Birth"
                    >
                      {copiedField === 'dob' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Save time on bookings</p>
                <p className="text-[11px] text-slate-400">
                  Log in to auto-copy your profile details to external event forms.
                </p>
              </div>
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shrink-0"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Consent Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(e) => setConsentAccepted(e.target.checked)}
              className="rounded accent-indigo-600 w-4 h-4"
            />
            <span className="text-[11px]">
              I consent to open {event.source} in a secure new tab to finalize my ticket booking.
            </span>
          </label>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleProceed}
            disabled={!consentAccepted}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all ${
              consentAccepted
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Continue to {event.source}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
