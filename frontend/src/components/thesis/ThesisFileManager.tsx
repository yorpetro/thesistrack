import { useState } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import FileViewer from '../file-viewer/FileViewer';
import AttachmentList from '../file-viewer/AttachmentList';
import { AuthUser, ThesisWithRelations } from '../../types';

type ThesisFileManagerProps = {
  thesisId: string;
  currentUser?: AuthUser | null;
  thesis?: ThesisWithRelations;
};

const ThesisFileManager = ({ thesisId, currentUser, thesis }: ThesisFileManagerProps) => {
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  const handleFileUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUpload = () => {
    navigate(`/theses/${thesisId}/upload`);
  };

  // Check if current user can upload (only students can upload to their own thesis)
  const canUpload = currentUser?.role === 'student' && 
                   thesis && 
                   currentUser.id === thesis.student_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-secondary dark:text-gray-100">Documents</h2>
        {canUpload && (
          <button
            onClick={handleUpload}
            className="btn-primary flex items-center"
          >
            <ArrowUpTrayIcon className="h-4 w-4 mr-1.5" />
            <span>Upload Attachments</span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
          <AttachmentList 
            key={refreshTrigger}
            thesisId={thesisId}
            selectedAttachmentId={selectedAttachmentId}
            onSelectAttachment={setSelectedAttachmentId}
          />
        </div>

        {selectedAttachmentId && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
            <FileViewer 
              thesisId={thesisId}
              attachmentId={selectedAttachmentId}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ThesisFileManager; 