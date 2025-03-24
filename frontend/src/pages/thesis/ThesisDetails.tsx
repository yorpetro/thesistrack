import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getThesis, updateThesis } from '../../services/thesisService';
import { ThesisWithRelations, ThesisStatus } from '../../types';
import ThesisFileManager from '../../components/thesis/ThesisFileManager';
import { 
  CalendarIcon, 
  UserIcon, 
  AcademicCapIcon,
  DocumentTextIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const statusColors: Record<ThesisStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  needs_revision: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800'
};

const ThesisDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [thesis, setThesis] = useState<ThesisWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');

  useEffect(() => {
    const fetchThesis = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getThesis(id);
        setThesis(data);
        setTitle(data.title);
        setAbstract(data.abstract || '');
      } catch (err) {
        setError('Failed to load thesis details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchThesis();
  }, [id]);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async () => {
    if (!id) return;
    
    try {
      const updatedThesis = await updateThesis(id, {
        title,
        abstract: abstract || null
      });
      
      setThesis(prev => prev ? { ...prev, ...updatedThesis } : null);
      setEditMode(false);
    } catch (err) {
      console.error('Failed to update thesis:', err);
    }
  };

  const handleCancel = () => {
    if (thesis) {
      setTitle(thesis.title);
      setAbstract(thesis.abstract || '');
    }
    setEditMode(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return format(new Date(dateString), 'MMMM dd, yyyy');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !thesis) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-500">
          <p>{error || 'Thesis not found'}</p>
          <button 
            onClick={() => navigate('/theses')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Back to Theses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {editMode ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-bold mb-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Thesis Title"
              />
            ) : (
              <h1 className="text-2xl font-bold mb-2">{thesis.title}</h1>
            )}
            
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                <span>Student: {thesis.student.full_name || thesis.student.email}</span>
              </div>
              
              {thesis.supervisor && (
                <div className="flex items-center">
                  <AcademicCapIcon className="h-4 w-4 mr-1" />
                  <span>Supervisor: {thesis.supervisor.full_name || thesis.supervisor.email}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                <span>Created: {formatDate(thesis.created_at)}</span>
              </div>
              
              {thesis.defense_date && (
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span>Defense Date: {formatDate(thesis.defense_date)}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[thesis.status]}`}>
                  {thesis.status.charAt(0).toUpperCase() + thesis.status.slice(1)}
                </span>
              </div>
            </div>
            
            {editMode ? (
              <textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Abstract (optional)"
              />
            ) : (
              <div className="prose max-w-none">
                <h3 className="text-lg font-medium mb-2">Abstract</h3>
                {thesis.abstract ? (
                  <p className="text-gray-700">{thesis.abstract}</p>
                ) : (
                  <p className="text-gray-500 italic">No abstract provided</p>
                )}
              </div>
            )}
          </div>
          
          {!editMode ? (
            <button
              onClick={handleEdit}
              className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Save
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Documents</h2>
        <ThesisFileManager thesisId={thesis.id} />
      </div>
    </div>
  );
};

export default ThesisDetails; 