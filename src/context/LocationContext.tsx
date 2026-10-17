import React, { createContext, useContext, useState, useEffect } from 'react';
import { CityOption, KNOWN_CITIES } from '../types';

interface LocationContextType {
  selectedCity: CityOption;
  userCoords: { lat: number; lng: number } | null;
  isLocating: boolean;
  locationError: string | null;
  hasLocationPermission: boolean;
  selectCityByName: (cityName: string) => void;
  requestBrowserLocation: () => Promise<void>;
  referenceCoordinates: { lat: number; lng: number };
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState<CityOption>(KNOWN_CITIES[0]); // Indore default
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean>(false);

  const selectCityByName = (cityName: string) => {
    const match = KNOWN_CITIES.find(
      (c) => c.name.toLowerCase() === cityName.toLowerCase()
    );
    if (match) {
      setSelectedCity(match);
      setLocationError(null);
    }
  };

  const requestBrowserLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserCoords(coords);
        setHasLocationPermission(true);
        setIsLocating(false);

        // Find closest known city
        let closestCity = KNOWN_CITIES[0];
        let minDiff = Infinity;
        for (const city of KNOWN_CITIES) {
          const diff =
            Math.abs(city.lat - coords.lat) + Math.abs(city.lng - coords.lng);
          if (diff < minDiff) {
            minDiff = diff;
            closestCity = city;
          }
        }
        setSelectedCity(closestCity);
      },
      (err) => {
        setIsLocating(false);
        setHasLocationPermission(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Exploring via selected city.');
        } else {
          setLocationError('Unable to retrieve location. Using selected city.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // If user coordinates exist, use them as reference; otherwise use selected city coordinates
  const referenceCoordinates = userCoords || {
    lat: selectedCity.lat,
    lng: selectedCity.lng,
  };

  return (
    <LocationContext.Provider
      value={{
        selectedCity,
        userCoords,
        isLocating,
        locationError,
        hasLocationPermission,
        selectCityByName,
        requestBrowserLocation,
        referenceCoordinates,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
