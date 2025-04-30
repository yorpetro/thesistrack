import api from './api';
import { Thesis, ThesisWithRelations, ThesisStatus, ReviewCreate, ReviewRead, ErrorResponse } from '../types';
import { AxiosError } from 'axios';

export const getTheses = async (supervisorId?: string): Promise<Thesis[]> => {
  try {
    // Construct the URL with optional supervisor_id query parameter
    const url = supervisorId ? `/theses/?supervisor_id=${supervisorId}` : '/theses/';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching theses:', error);
    throw error;
  }
};

export const getThesis = async (id: string): Promise<ThesisWithRelations> => {
  try {
    const response = await api.get(`/theses/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching thesis ${id}:`, error);
    throw error;
  }
};

export const createThesis = async (data: {
  title: string;
  abstract?: string;
  student_id: string;
  supervisor_id?: string;
}): Promise<Thesis> => {
  try {
    const response = await api.post('/theses/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating thesis:', error);
    throw error;
  }
};

export const updateThesis = async (
  id: string,
  data: {
    title?: string;
    abstract?: string;
    status?: ThesisStatus;
    supervisor_id?: string;
    defense_date?: string | null;
  }
): Promise<Thesis> => {
  try {
    const response = await api.put(`/theses/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating thesis ${id}:`, error);
    throw error;
  }
};

export const deleteThesis = async (id: string): Promise<void> => {
  try {
    await api.delete(`/theses/${id}`);
  } catch (error) {
    console.error(`Error deleting thesis ${id}:`, error);
    throw error;
  }
};

// Function to create a review for a thesis
export const createThesisReview = async (thesisId: string, reviewData: ReviewCreate): Promise<ReviewRead> => {
  try {
    // Correct the endpoint path according to openapi.json
    const response = await api.post(`/theses/theses/${thesisId}/reviews`, reviewData);
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ErrorResponse>; // Type assertion
    console.error(`Error creating review for thesis ${thesisId}:`, error);
    
    let errorMessage = 'Failed to create review due to an unknown error';
    if (error.response && error.response.data) {
      // Check if detail is an array of validation errors or a single string
      if (Array.isArray(error.response.data.detail)) {
        errorMessage = error.response.data.detail.map(d => `${d.loc.join('.')} - ${d.msg}`).join('; ');
      } else if (typeof error.response.data.detail === 'string') {
        errorMessage = error.response.data.detail;
      }
    } else if (error.request) {
      errorMessage = 'Failed to create review: No response received from server.';
    } else {
      errorMessage = error.message || errorMessage;
    }
    throw new Error(errorMessage);
  }
}; 