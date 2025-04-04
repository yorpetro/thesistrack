import api from './api';

// Defines the type of request that can be created
export interface ThesisRequest {
  id: string;
  thesis_id: string;
  assistant_id: string;
  status: 'pending' | 'approved' | 'declined' | 'cancelled';
  created_at: string;
  updated_at: string;
}

/**
 * Create a new thesis assistance request
 * @param thesis_id The ID of the thesis
 * @param assistant_id The ID of the graduation assistant
 * @returns The created request
 */
export const createThesisRequest = async (thesis_id: string, assistant_id: string): Promise<ThesisRequest> => {
  const response = await api.post('/requests', { thesis_id, assistant_id });
  return response.data;
};

/**
 * Get all requests for the current user
 * @returns Array of thesis requests
 */
export const getMyRequests = async (): Promise<ThesisRequest[]> => {
  const response = await api.get('/requests/me');
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
  const response = await api.patch(`/requests/${request_id}/cancel`);
  return response.data;
};

/**
 * Approve a thesis request (for assistants)
 * @param request_id The ID of the request to approve
 * @returns The updated request
 */
export const approveRequest = async (request_id: string): Promise<ThesisRequest> => {
  const response = await api.patch(`/requests/${request_id}/approve`);
  return response.data;
};

/**
 * Decline a thesis request (for assistants)
 * @param request_id The ID of the request to decline
 * @returns The updated request
 */
export const declineRequest = async (request_id: string): Promise<ThesisRequest> => {
  const response = await api.patch(`/requests/${request_id}/decline`);
  return response.data;
}; 