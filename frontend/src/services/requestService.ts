import api from './api';
// Import the shared ThesisRequest type
import { ThesisRequest } from '../types';

// Defines the type of request that can be created

/**
 * Create a new thesis assistance request
 * @param student_id The ID of the student
 * @param thesis_id The ID of the thesis
 * @param assistant_id The ID of the graduation assistant
 * @returns The created request
 */
export const createThesisRequest = async (student_id: string, thesis_id: string, assistant_id: string): Promise<ThesisRequest> => {
  const response = await api.post('/assistant/requests/', { student_id, thesis_id, assistant_id });
  return response.data;
};

/**
 * Get all requests for the current user
 * @returns Array of thesis requests
 */
export const getMyRequests = async (): Promise<ThesisRequest[]> => {
  const response = await api.get('/assistant/requests/');
  return response.data;
};

/**
 * Get a specific request by ID
 * @param request_id The ID of the request to fetch
 * @returns The request details
 */
export const getRequest = async (request_id: string): Promise<ThesisRequest> => {
  const response = await api.get(`/requests/${request_id}`);
  return response.data;
};

/**
 * Cancel a thesis request
 * @param request_id The ID of the request to cancel
 * @returns The updated request
 */
export const cancelRequest = async (request_id: string): Promise<ThesisRequest> => {
  const response = await api.delete(`/assistant/requests/${request_id}`);
  return response.data;
};

/**
 * Approve a thesis request (for assistants)
 * @param request_id The ID of the request to approve
 * @returns The updated request
 */
export const approveRequest = async (request_id: string): Promise<ThesisRequest> => {
  const response = await api.put(`/assistant/requests/${request_id}`, { status: 'accepted' });
  return response.data;
};

/**
 * Decline a thesis request (for assistants)
 * @param request_id The ID of the request to decline
 * @returns The updated request
 */
export const declineRequest = async (request_id: string): Promise<ThesisRequest> => {
  const response = await api.put(`/assistant/requests/${request_id}`, { status: 'declined' });
  return response.data;
}; 