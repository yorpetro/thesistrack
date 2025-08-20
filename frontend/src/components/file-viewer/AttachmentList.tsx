import { useState, useEffect } from 'react';
import { getAttachments } from '../../services/attachmentService';
import { Attachment } from '../../types';
import { DocumentTextIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

type AttachmentListProps = {
  thesisId: string;
  onSelectAttachment: (attachmentId: string) => void;
  selectedAttachmentId: string | null;
};

const AttachmentList = ({ 
  thesisId, 
  onSelectAttachment, 
  selectedAttachmentId 
}: AttachmentListProps) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        setLoading(true);
        const data = await getAttachments(thesisId);
        setAttachments(data);
        
        if (!selectedAttachmentId && data.length > 0) {
          onSelectAttachment(data[0].id);
        }
      } catch (err) {
        setError('Failed to load attachments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (thesisId) {
      fetchAttachments();
    }
  }, [thesisId, onSelectAttachment, selectedAttachmentId]);

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex space-x-2">
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 dark:text-red-400">{error}</div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
        No attachments found
      </div>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (contentType: string | null | undefined) => {
    if (!contentType) {
      return <DocumentIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
    if (contentType.includes('pdf')) {
      return <DocumentTextIcon className="h-5 w-5 text-red-500 dark:text-red-400" />;
    }
    if (contentType.includes('doc')) {
      return <DocumentTextIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
    }
    return <DocumentIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg">
      <div className="border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Attachments</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">{attachments.length} files</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-600">
        {attachments.map((attachment) => (
          <div 
            key={attachment.id}
            className={`group flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 ${
              selectedAttachmentId === attachment.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
            onClick={() => onSelectAttachment(attachment.id)}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectAttachment(attachment.id)}
            aria-label={`Select ${attachment.filename}`}
            role="button"
          >
            <div className="flex-shrink-0 mr-3">
              {getFileIcon(attachment.content_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {attachment.filename}
                </p>
                <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatFileSize(attachment.size)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDate(attachment.updated_at)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttachmentList; 