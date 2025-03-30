import api from './api';
import { Thesis, ThesisWithRelations, ThesisStatus } from '../types';

export const getTheses = async (): Promise<Thesis[]> => {
  try {
    console.log('Fetching theses from API...');
    const response = await api.get('/theses/');
    console.log('Theses response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching theses:', error);
    throw error;
  }
};

export const getThesis = async (id: string): Promise<ThesisWithRelations> => {
  try {
    console.log(`Fetching thesis ${id} from API...`);
    const response = await api.get(`/theses/${id}`);
    console.log('Thesis detail response:', response.data);
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
    console.log('Creating thesis with data:', data);
    const response = await api.post('/theses/', data);
    console.log('Create thesis response:', response.data);
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
    console.log(`Updating thesis ${id} with data:`, data);
    const response = await api.put(`/theses/${id}`, data);
    console.log('Update thesis response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating thesis ${id}:`, error);
    throw error;
  }
};

export const deleteThesis = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting thesis ${id}...`);
    await api.delete(`/theses/${id}`);
    console.log(`Thesis ${id} deleted successfully`);
  } catch (error) {
    console.error(`Error deleting thesis ${id}:`, error);
    throw error;
  }
}; 