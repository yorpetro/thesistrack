import { useState } from 'react';
import FileViewer from '../file-viewer/FileViewer';
import FileUploader from '../file-viewer/FileUploader';
import AttachmentList from '../file-viewer/AttachmentList';

type ThesisFileManagerProps = {
  thesisId: string;
};

const ThesisFileManager = ({ thesisId }: ThesisFileManagerProps) => {
  const [selectedAttachmentId, setSelectedAttachmentId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleFileUploadSuccess = () => {
    // Trigger a refresh of the attachment list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-1">
        <div className="space-y-4">
          <FileUploader 
            thesisId={thesisId} 
            onSuccess={handleFileUploadSuccess} 
          />
          
          <AttachmentList 
            key={refreshTrigger} // Force re-render when refreshTrigger changes
            thesisId={thesisId}
            selectedAttachmentId={selectedAttachmentId}
            onSelectAttachment={setSelectedAttachmentId}
          />
        </div>
      </div>
      
      <div className="lg:col-span-2">
        {selectedAttachmentId ? (
          <FileViewer 
            thesisId={thesisId}
            attachmentId={selectedAttachmentId}
          />
        ) : (
          <div className="bg-white rounded-lg shadow h-full flex items-center justify-center p-8 text-center">
            <div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No file selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a file from the list or upload a new one to view it here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThesisFileManager; 