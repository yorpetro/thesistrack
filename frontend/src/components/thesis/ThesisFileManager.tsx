import { useState } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import FileViewer from '../file-viewer/FileViewer';
import AttachmentList from '../file-viewer/AttachmentList';

type ThesisFileManagerProps = {
  thesisId: string;
};

const ThesisFileManager = ({ thesisId }: ThesisFileManagerProps) => {
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();

  const handleFileUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUpload = () => {
    navigate(`/theses/${thesisId}/upload`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-secondary">Documents</h2>
        <button
          onClick={handleUpload}
          className="btn-primary flex items-center"
        >
          <ArrowUpTrayIcon className="h-4 w-4 mr-1.5" />
          <span>Upload Attachments</span>
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <AttachmentList 
            key={refreshTrigger}
            thesisId={thesisId}
            selectedAttachmentId={selectedAttachmentId}
            onSelectAttachment={setSelectedAttachmentId}
          />
        </div>

        {selectedAttachmentId && (
          <div className="bg-white rounded-lg shadow-sm">
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