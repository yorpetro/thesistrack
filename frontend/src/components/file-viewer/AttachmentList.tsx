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
            <div className="h-12 w-12 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">{error}</div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-center">
        No attachments found
      </div>
    );
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <DocumentTextIcon className="h-5 w-5 text-red-500" />;
    }
    if (fileType.includes('doc')) {
      return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
    }
    return <DocumentIcon className="h-5 w-5 text-gray-500" />;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  return (
    <div className="bg-white rounded-lg">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Attachments</h3>
        <span className="text-xs text-gray-500">{attachments.length} files</span>
      </div>
      <div className="divide-y divide-gray-100">
        {attachments.map((attachment) => (
          <div 
            key={attachment.id}
            className={`group flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer ${
              selectedAttachmentId === attachment.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => onSelectAttachment(attachment.id)}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectAttachment(attachment.id)}
            aria-label={`Select ${attachment.filename}`}
            role="button"
          >
            <div className="flex-shrink-0 mr-3">
              {getFileIcon(attachment.file_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                  {attachment.filename}
                </p>
                <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatFileSize(attachment.file_size)}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
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