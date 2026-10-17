import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { NormalizedEvent } from '../../types';
import { useLocation } from '../../context/LocationContext';

interface EventMapProps {
  events: NormalizedEvent[];
  selectedEvent: NormalizedEvent | null;
  onSelectEvent: (event: NormalizedEvent) => void;
  onOpenDetails: (eventId: string) => void;
}

export const EventMap: React.FC<EventMapProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onOpenDetails,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { selectedCity, userCoords } = useLocation();

  // Create custom marker icons
  const createMarkerIcon = (source: string, isSelected: boolean) => {
    let color = '#6366f1'; // Indigo default
    let letter = 'E';

    if (source === 'District') {
      color = '#f43f5e'; // Rose
      letter = 'D';
    } else if (source === 'BookMyShow') {
      color = '#ef4444'; // Red
      letter = 'B';
    } else if (source === 'Luma') {
      color = '#f59e0b'; // Amber
      letter = 'L';
    }

    const size = isSelected ? 38 : 30;
    const border = isSelected ? '3px solid #ffffff' : '2px solid rgba(255, 255, 255, 0.9)';
    const shadow = isSelected
      ? 'box-shadow: 0 0 15px rgba(255, 255, 255, 0.8), 0 8px 16px rgba(0,0,0,0.8);'
      : 'box-shadow: 0 4px 10px rgba(0,0,0,0.6);';

    return L.divIcon({
      className: 'event-marker-pin',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border: ${border};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: ${isSelected ? '14px' : '11px'};
          ${shadow}
          cursor: pointer;
          transition: all 0.2s ease;
        ">
          ${letter}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center on selected city
    const initialLat = selectedCity.lat;
    const initialLng = selectedCity.lng;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: false,
    });

    // Esri World Dark Gray Base & Reference layers (unrestricted, high contrast, zero watermark)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '&copy; Esri, OpenStreetMap contributors',
        maxZoom: 16,
      }
    ).addTo(map);

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 16,
      }
    ).addTo(map);

    // Zoom control in top right
    L.control
      .zoom({
        position: 'topright',
      })
      .addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;
    setMapReady(true);

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize(true);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Pan to selected city when city changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([selectedCity.lat, selectedCity.lng], 12, {
      duration: 1.2,
    });
  }, [selectedCity]);

  // Update user location pin
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (userCoords) {
      if (!userMarkerRef.current) {
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div class="user-location-pulse"></div>
            <div class="user-location-dot"></div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
          icon: userIcon,
          zIndexOffset: 1000,
        })
          .addTo(mapInstanceRef.current)
          .bindPopup('<strong style="color:#38bdf8">Your Current Location</strong>');
      } else {
        userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userCoords]);

  // Render event markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    events.forEach((evt) => {
      if (!evt.coordinates?.lat || !evt.coordinates?.lng) return;

      const isSelected = selectedEvent?.eventId === evt.eventId;
      const icon = createMarkerIcon(evt.source, isSelected);

      const marker = L.marker([evt.coordinates.lat, evt.coordinates.lng], {
        icon,
        title: evt.title,
        zIndexOffset: isSelected ? 500 : 100,
      });

      // Marker click handles selection
      marker.on('click', () => {
        onSelectEvent(evt);
      });

      // Custom styled dark popup
      const formattedPrice =
        evt.startingPrice === 0 ? 'Free Entry' : `From ₹${evt.startingPrice.toLocaleString('en-IN')}`;

      const popupHtml = `
        <div style="min-width: 200px; max-width: 240px; padding: 12px; font-family: 'Plus Jakarta Sans', sans-serif;">
          <div style="position: relative; height: 90px; border-radius: 8px; overflow: hidden; margin-bottom: 8px; background: #1e293b;">
            <img src="${evt.imageUrl || ''}" alt="${evt.title}" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; top: 4px; left: 4px; background: rgba(15, 23, 42, 0.85); color: #e2e8f0; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
              ${evt.source}
            </div>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #ffffff; line-height: 1.3;">
            ${evt.title}
          </h4>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8;">
            📍 ${evt.venueName}, ${evt.city}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1);">
            <span style="font-size: 12px; font-weight: 800; color: #38bdf8;">
              ${formattedPrice}
            </span>
            <button id="view-evt-${evt.eventId}" style="background: #4f46e5; color: #ffffff; border: none; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
              View Details →
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: true,
        className: 'event-popup-custom',
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`view-evt-${evt.eventId}`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            onOpenDetails(evt.eventId);
          };
        }
      });

      layer.addLayer(marker);
    });
  }, [events, selectedEvent, mapReady]);

  // Fly to selected event when selectedEvent changes
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedEvent?.coordinates) return;
    mapInstanceRef.current.flyTo(
      [selectedEvent.coordinates.lat, selectedEvent.coordinates.lng],
      14,
      { duration: 1.0 }
    );
  }, [selectedEvent]);

  // Helper buttons to center map on city or user
  const handleRecenterCity = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([selectedCity.lat, selectedCity.lng], 12);
  };

  const handleRecenterUser = () => {
    if (!mapInstanceRef.current || !userCoords) return;
    mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 14);
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Floating Map HUD Controls */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-2">
        <button
          onClick={handleRecenterCity}
          className="p-2.5 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-700/80 text-slate-200 hover:text-white hover:bg-slate-800 shadow-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          title={`Center on ${selectedCity.name}`}
        >
          <span>Center on {selectedCity.name}</span>
        </button>

        {userCoords && (
          <button
            onClick={handleRecenterUser}
            className="p-2.5 rounded-xl bg-blue-600/90 backdrop-blur border border-blue-400 text-white hover:bg-blue-500 shadow-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Center on your GPS position"
          >
            <span>My GPS Location</span>
          </button>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-lg text-[11px] text-slate-300">
        <span className="font-semibold text-slate-400">Sources:</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> District
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> BookMyShow
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Luma
        </span>
      </div>
    </div>
  );
};
