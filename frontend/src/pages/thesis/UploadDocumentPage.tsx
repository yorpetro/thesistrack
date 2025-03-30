import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import FileUploader from '../../components/file-viewer/FileUploader';

const UploadDocumentPage = () => {
  const { thesisId } = useParams();
  const navigate = useNavigate();

  if (!thesisId) {
    return <div>Thesis ID is required</div>;
  }

  const handleUploadSuccess = () => {
    navigate(`/theses/${thesisId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-2">
        <button
          onClick={() => navigate(`/theses/${thesisId}`)}
          className="inline-flex items-center text-accent hover:text-accent-dark transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          <span>Back to thesis</span>
        </button>
      </div>

      <div className="card">
        <div className="p-6">
          <h1 className="text-xl font-bold text-secondary mb-6">Upload Document</h1>
          <FileUploader 
            thesisId={thesisId} 
            onSuccess={handleUploadSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentPage; 