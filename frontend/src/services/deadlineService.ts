import api from './api';
import { Deadline, DeadlineCreate, DeadlineUpdate, DeadlineDetail, DeadlineType } from '../types/deadline';

export const deadlineService = {
  // Get all deadlines
  getDeadlines: async (params?: {
    skip?: number;
    limit?: number;
    deadline_type?: DeadlineType;
    active_only?: boolean;
  }): Promise<DeadlineDetail[]> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
      if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params?.deadline_type) queryParams.append('deadline_type', params.deadline_type);
      if (params?.active_only !== undefined) queryParams.append('active_only', params.active_only.toString());
      
      const url = `/deadlines/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching deadlines:', error);
      throw error;
    }
  },

  // Get upcoming deadlines
  getUpcomingDeadlines: async (daysAhead: number = 30): Promise<DeadlineDetail[]> => {
    try {
      const response = await api.get(`/deadlines/upcoming/?days_ahead=${daysAhead}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming deadlines:', error);
      throw error;
    }
  },

  // Get a specific deadline
  getDeadline: async (id: string): Promise<DeadlineDetail> => {
    try {
      const response = await api.get(`/deadlines/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching deadline ${id}:`, error);
      throw error;
    }
  },

  // Create a new deadline
  createDeadline: async (data: DeadlineCreate): Promise<Deadline> => {
    try {
      const response = await api.post('/deadlines/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating deadline:', error);
      throw error;
    }
  },

  // Update a deadline
  updateDeadline: async (id: string, data: DeadlineUpdate): Promise<Deadline> => {
    try {
      const response = await api.put(`/deadlines/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating deadline ${id}:`, error);
      throw error;
    }
  },

  // Delete a deadline
  deleteDeadline: async (id: string): Promise<void> => {
    try {
      await api.delete(`/deadlines/${id}`);
    } catch (error) {
      console.error(`Error deleting deadline ${id}:`, error);
      throw error;
    }
  },
}; 