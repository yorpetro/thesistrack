import api from './api';
import { GraduationAssistant, UserSimple } from '../types';

/**
 * Fetch users with optional role filter
 */
export const getUsers = async (role?: string): Promise<UserSimple[]> => {
  try {
    const params = role ? { role } : {};
    const response = await api.get('/users/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Fetch graduation assistants
 */
export const getGraduationAssistants = async (): Promise<GraduationAssistant[]> => {
  try {
    const response = await api.get('/users/', { 
      params: { role: 'graduation_assistant' } 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching graduation assistants:', error);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<UserSimple> => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
}; 