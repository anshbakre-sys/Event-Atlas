import axios from 'axios';
import { NormalizedEvent, EventFilterState, UserProfile } from '../types';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const eventApi = {
  getEvents: async (params: {
    filters: Partial<EventFilterState>;
    userLat?: number;
    userLng?: number;
  }) => {
    const queryParams: Record<string, any> = {};

    if (params.filters.searchQuery) queryParams.search = params.filters.searchQuery;
    if (params.filters.platforms && params.filters.platforms.length > 0) {
      queryParams.platforms = params.filters.platforms.join(',');
    }
    if (params.filters.categories && params.filters.categories.length > 0) {
      queryParams.categories = params.filters.categories.join(',');
    }
    if (params.filters.cities && params.filters.cities.length > 0) {
      queryParams.cities = params.filters.cities.join(',');
    }
    if (params.filters.priceType && params.filters.priceType !== 'all') {
      queryParams.priceType = params.filters.priceType;
    }
    if (params.filters.minPrice !== undefined) queryParams.minPrice = params.filters.minPrice;
    if (params.filters.maxPrice !== undefined) queryParams.maxPrice = params.filters.maxPrice;
    if (params.filters.budget !== undefined) queryParams.budget = params.filters.budget;
    if (params.filters.startDate) queryParams.startDate = params.filters.startDate;
    if (params.filters.endDate) queryParams.endDate = params.filters.endDate;
    if (params.filters.sortBy) queryParams.sortBy = params.filters.sortBy;

    if (params.userLat !== undefined && params.userLng !== undefined) {
      queryParams.userLat = params.userLat;
      queryParams.userLng = params.userLng;
    }

    const response = await apiClient.get<{
      events: NormalizedEvent[];
      total: number;
      userAgeApplied: number | null;
    }>('/events', { params: queryParams });

    return response.data;
  },

  getEventById: async (eventId: string, userLat?: number, userLng?: number) => {
    const params: Record<string, any> = {};
    if (userLat !== undefined && userLng !== undefined) {
      params.userLat = userLat;
      params.userLng = userLng;
    }
    const response = await apiClient.get<{ event: NormalizedEvent }>(`/events/${eventId}`, {
      params,
    });
    return response.data.event;
  },

  getBookingHandoff: async (eventId: string) => {
    const response = await apiClient.post(`/events/${eventId}/handoff`);
    return response.data;
  },

  getSourceStatuses: async () => {
    const response = await apiClient.get('/sources/status');
    return response.data.sources;
  },
};

export const assistantApi = {
  search: async (payload: {
    prompt: string;
    userLat?: number;
    userLng?: number;
    currentCity?: string;
  }) => {
    const response = await apiClient.post('/assistant/search', payload);
    return response.data;
  },
};

export const authApi = {
  me: async () => {
    const response = await apiClient.get<{ authenticated: boolean; user: UserProfile | null }>('/auth/me');
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post<{ user: UserProfile; token: string }>('/auth/login', data);
    return response.data;
  },

  register: async (data: {
    name: string;
    email: string;
    password: string;
    dateOfBirth: string;
    phone?: string;
    preferredCity?: string;
  }) => {
    const response = await apiClient.post<{ user: UserProfile; token: string }>('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  updateProfile: async (data: {
    name?: string;
    dateOfBirth?: string;
    phone?: string;
    preferredCity?: string;
    preferences?: any;
  }) => {
    const response = await apiClient.patch<{ user: UserProfile }>('/users/me', data);
    return response.data;
  },
};
