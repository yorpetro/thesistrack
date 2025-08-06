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
 * Fetch graduation assistants and professors (available thesis supervisors)
 */
export const getThesisSupervisors = async (): Promise<GraduationAssistant[]> => {
  try {
    // Fetch both graduation assistants and professors
    const [assistantsResponse, professorsResponse] = await Promise.all([
      api.get('/users/', { params: { role: 'graduation_assistant' } }),
      api.get('/users/', { params: { role: 'professor' } })
    ]);
    
    // Combine both arrays and return
    return [...assistantsResponse.data, ...professorsResponse.data];
  } catch (error) {
    console.error('Error fetching thesis supervisors:', error);
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