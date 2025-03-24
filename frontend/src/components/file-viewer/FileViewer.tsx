import { useState, useEffect } from 'react';
import { getAttachmentPreview, getDownloadUrl } from '../../services/attachmentService';
import { PreviewData } from '../../types';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

type FileViewerProps = {
  thesisId: string;
  attachmentId: string;
};

const FileViewer = ({ thesisId, attachmentId }: FileViewerProps) => {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      if (!thesisId || !attachmentId) return;
      
      try {
        setLoading(true);
        const data = await getAttachmentPreview(thesisId, attachmentId);
        setPreview(data);
        setError(null);
      } catch (err) {
        setError('Failed to load file preview');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [thesisId, attachmentId]);

  const handleDownload = () => {
    window.open(getDownloadUrl(thesisId, attachmentId), '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="mt-2">{error || 'Failed to load preview'}</p>
      </div>
    );
  }

  const getFileIcon = () => {
    if (preview.type === 'pdf') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (preview.type === 'docx' || preview.type === 'doc') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getFileIcon()}
          <h3 className="text-sm font-medium truncate">{preview.filename}</h3>
        </div>
        <button 
          onClick={handleDownload}
          className="p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          aria-label="Download file"
          tabIndex={0}
        >
          <ArrowDownTrayIcon className="h-5 w-5 text-gray-500" />
        </button>
      </div>
      
      <div className="p-4">
        {preview.content_type === 'pdf' && preview.html && (
          <div 
            className="h-[600px] w-full" 
            dangerouslySetInnerHTML={{ __html: preview.html }} 
          />
        )}
        
        {preview.content_type === 'document' && preview.html && (
          <div 
            className="prose max-w-none" 
            dangerouslySetInnerHTML={{ __html: preview.html }} 
          />
        )}
        
        {preview.content_type === 'text' && preview.content && (
          <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded text-sm">{preview.content}</pre>
        )}
        
        {preview.description && (
          <div className="mt-4 text-sm text-gray-500">
            <p className="font-medium">Description:</p>
            <p>{preview.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileViewer; 