import api from './api';
import { Attachment, PreviewData } from '../types';

export const getAttachments = async (thesisId: string): Promise<Attachment[]> => {
  const response = await api.get(`/theses/${thesisId}/attachments`);
  return response.data;
};

export const getAttachment = async (thesisId: string, attachmentId: string): Promise<Attachment> => {
  const response = await api.get(`/theses/${thesisId}/attachments/${attachmentId}`);
  return response.data;
};

export const uploadAttachment = async (
  thesisId: string,
  file: File,
  description?: string
): Promise<Attachment> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (description) {
    formData.append('description', description);
  }
  
  const response = await api.post(`/theses/${thesisId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const updateAttachment = async (
  thesisId: string,
  attachmentId: string,
  data: { filename?: string; description?: string }
): Promise<Attachment> => {
  const response = await api.put(`/theses/${thesisId}/attachments/${attachmentId}`, data);
  return response.data;
};

export const deleteAttachment = async (thesisId: string, attachmentId: string): Promise<void> => {
  await api.delete(`/theses/${thesisId}/attachments/${attachmentId}`);
};

export const replaceAttachment = async (
  thesisId: string,
  attachmentId: string,
  file: File
): Promise<Attachment> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(
    `/theses/${thesisId}/attachments/${attachmentId}/replace`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
};

export const getAttachmentPreview = async (
  thesisId: string,
  attachmentId: string,
  format: 'json' | 'html' | 'text' = 'json'
): Promise<PreviewData> => {
  const response = await api.get(`/theses/${thesisId}/attachments/${attachmentId}/preview`, {
    params: { format },
    headers: format === 'html' ? { Accept: 'text/html' } : undefined,
  });
  return response.data;
};

export const getDownloadUrl = (thesisId: string, attachmentId: string, inline = false): string => {
  return `/api/v1/theses/${thesisId}/attachments/${attachmentId}/download${inline ? '?inline=true' : ''}`;
}; 