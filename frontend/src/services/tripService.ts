import api from './api';
import type { Trip, CreateTripData } from '../types/trip';

export const getTrips = async (): Promise<Trip[]> => {
  const response = await api.get('/trips');
  return response.data.data;
};

export const getTrip = async (id: number): Promise<Trip> => {
  const response = await api.get(`/trips/${id}`);
  return response.data.data;
};

export const createTrip = async (data: CreateTripData): Promise<Trip> => {
  const response = await api.post('/trips', data);
  return response.data.data;
};

export const deleteTrip = async (id: number): Promise<void> => {
  await api.delete(`/trips/${id}`);
};

export const generateInviteLink = async (tripId: number): Promise<string> => {
  const response = await api.get(`/trips/${tripId}/invite`);
  return response.data.data.link;
};

export const joinTrip = async (token: string): Promise<{ tripId: number }> => {
  const response = await api.post('/trips/join', { token });
  return response.data.data;
};
