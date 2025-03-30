import api from './api';
import { ThesisComment, CommentBase } from '../types';

export const getThesisComments = async (thesisId: string): Promise<ThesisComment[]> => {
  try {
    console.log(`Fetching comments for thesis ${thesisId}...`);
    const response = await api.get(`/theses/${thesisId}/comments`);
    console.log('Comments response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching comments for thesis ${thesisId}:`, error);
    throw error;
  }
};

export const createComment = async (
  thesisId: string, 
  data: {
    content: string;
    is_approval: boolean;
    thesis_id: string;
    user_id: string;
    parent_id?: string;
  }
): Promise<ThesisComment> => {
  try {
    console.log(`Creating comment for thesis ${thesisId} with data:`, data);
    
    // Ensure parent_id is properly sent (undefined will be omitted from the JSON)
    const requestData = {
      ...data,
      // Only include parent_id if it's a string (omit if undefined)
      ...(data.parent_id ? { parent_id: data.parent_id } : {})
    };
    
    console.log('Sending comment data:', requestData);
    const response = await api.post(`/theses/${thesisId}/comments`, requestData);
    console.log('Create comment response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error creating comment for thesis ${thesisId}:`, error);
    throw error;
  }
};

export const updateComment = async (
  commentId: string,
  data: {
    content?: string;
    is_resolved?: boolean;
    is_approval?: boolean;
  }
): Promise<ThesisComment> => {
  try {
    console.log(`Updating comment ${commentId} with data:`, data);
    const response = await api.put(`/theses/comments/${commentId}`, data);
    console.log('Update comment response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating comment ${commentId}:`, error);
    throw error;
  }
};

export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    console.log(`Deleting comment ${commentId}...`);
    await api.delete(`/theses/comments/${commentId}`);
    console.log('Comment deleted successfully');
  } catch (error) {
    console.error(`Error deleting comment ${commentId}:`, error);
    throw error;
  }
};

export const resolveComment = async (commentId: string): Promise<ThesisComment> => {
  try {
    console.log(`Resolving comment ${commentId}...`);
    const response = await api.patch(`/comments/${commentId}/resolve`, {});
    console.log('Resolve comment response:', response.data);
    return response.data;
  } catch (error) {
    console.error(`Error resolving comment ${commentId}:`, error);
    throw error;
  }
}; 