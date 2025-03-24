import { useState, useEffect } from 'react';
import { getAttachments } from '../../services/attachmentService';
import { AttachmentBase } from '../../types';
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
  const [attachments, setAttachments] = useState<AttachmentBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttachments = async () => {
      try {
        setLoading(true);
        const data = await getAttachments(thesisId);
        setAttachments(data);
        
        // Select first attachment if none selected and we have attachments
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
    <div className="bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium p-4 border-b">Attachments</h3>
      <ul className="divide-y divide-gray-200">
        {attachments.map((attachment) => (
          <li 
            key={attachment.id}
            className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedAttachmentId === attachment.id ? 'bg-blue-50' : ''}`}
            onClick={() => onSelectAttachment(attachment.id)}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectAttachment(attachment.id)}
            aria-label={`Select ${attachment.filename}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getFileIcon(attachment.file_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.filename}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(attachment.file_size)} • {formatDate(attachment.updated_at)}
                </p>
                {attachment.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {attachment.description}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttachmentList; 