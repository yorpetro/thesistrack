import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTheses, createThesis } from '../../services/thesisService';
import { Thesis, ThesisStatus } from '../../types';
import { 
  PlusIcon, 
  DocumentTextIcon,
  UserIcon,
  CalendarIcon
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

const ThesesList = () => {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newThesisTitle, setNewThesisTitle] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const fetchTheses = async () => {
      try {
        setLoading(true);
        const data = await getTheses();
        setTheses(data);
      } catch (err) {
        setError('Failed to load theses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTheses();
  }, []);

  const handleCreateThesis = async () => {
    if (!newThesisTitle.trim()) return;
    
    try {
      setCreateLoading(true);
      const newThesis = await createThesis({ title: newThesisTitle });
      setTheses([newThesis, ...theses]);
      setNewThesisTitle('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create thesis:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Theses</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          <span>New Thesis</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-red-500">
          <p>{error}</p>
        </div>
      ) : theses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-medium text-gray-900 mb-2">No theses yet</h2>
          <p className="text-gray-500 mb-4">Get started by creating your first thesis</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            <span>New Thesis</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {theses.map((thesis) => (
            <Link
              key={thesis.id}
              to={`/theses/${thesis.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition duration-150 overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2 line-clamp-2">{thesis.title}</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[thesis.status]}`}>
                    {thesis.status.charAt(0).toUpperCase() + thesis.status.slice(1)}
                  </span>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <div className="flex items-center mb-1">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>Created {formatDate(thesis.created_at)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black opacity-30" onClick={() => setShowCreateModal(false)}></div>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-20">
              <h2 className="text-xl font-bold mb-4">Create New Thesis</h2>
              <div className="mb-4">
                <label htmlFor="thesis-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Thesis Title
                </label>
                <input
                  type="text"
                  id="thesis-title"
                  value={newThesisTitle}
                  onChange={(e) => setNewThesisTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter thesis title"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateThesis}
                  disabled={createLoading || !newThesisTitle.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? (
                    <span className="flex items-center">
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-0 border-r-0 border-white rounded-full"></div>
                      Creating...
                    </span>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThesesList; 