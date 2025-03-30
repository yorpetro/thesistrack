import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getTheses, createThesis } from '../../services/thesisService';
import { Thesis, ThesisStatus } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { 
  PlusIcon, 
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const statusColors: Record<ThesisStatus, string> = {
  draft: 'bg-neutral text-secondary',
  submitted: 'bg-accent-light/20 text-accent-dark',
  under_review: 'bg-yellow-100 text-yellow-800',
  needs_revision: 'bg-orange-100 text-orange-800',
  approved: 'bg-primary/20 text-primary-700',
  declined: 'bg-red-100 text-red-800'
};

const ThesesList = () => {
  const { user } = useAuthStore();
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

    if (user?.role !== 'student') {
      fetchTheses();
    }
  }, [user?.role]);

  // Redirect students to their thesis page or thesis creation
  if (user?.role === 'student') {
    if (theses.length > 0) {
      return <Navigate to={`/theses/${theses[0].id}`} />;
    }
    return <Navigate to="/theses/new" />;
  }

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">My Theses</h1>
          <p className="text-earth mt-1">Manage and track your thesis projects</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary shadow-custom"
        >
          <PlusIcon className="h-5 w-5 mr-1.5" />
          <span>New Thesis</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="card text-center text-red-500">
          <p>{error}</p>
        </div>
      ) : theses.length === 0 ? (
        <div className="card text-center p-10">
          <div className="bg-neutral/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="h-10 w-10 text-secondary" />
          </div>
          <h2 className="text-xl font-medium text-secondary mb-2">No theses yet</h2>
          <p className="text-earth mb-6">Get started by creating your first thesis</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary shadow-custom"
          >
            <PlusIcon className="h-5 w-5 mr-1.5" />
            <span>New Thesis</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {theses.map((thesis) => (
            <Link
              key={thesis.id}
              to={`/theses/${thesis.id}`}
              className="card hover:shadow-custom-lg transition-all duration-200 flex flex-col h-full group"
            >
              <div className="p-1 px-2 mb-2 w-fit self-start">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[thesis.status]}`}>
                  {thesis.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-3 text-secondary group-hover:text-primary transition-colors duration-200 line-clamp-2">
                {thesis.title}
              </h2>
              <div className="mt-auto pt-4 text-sm text-earth border-t border-neutral-light">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1.5" />
                  <span>Created {formatDate(thesis.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto bg-secondary/50 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-custom shadow-custom-lg max-w-md w-full p-6 relative">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-earth hover:text-secondary transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              
              <h2 className="text-xl font-bold mb-5 text-secondary">Create New Thesis</h2>
              <div className="mb-6">
                <label htmlFor="thesis-title" className="block text-sm font-medium text-secondary mb-2">
                  Thesis Title
                </label>
                <input
                  type="text"
                  id="thesis-title"
                  value={newThesisTitle}
                  onChange={(e) => setNewThesisTitle(e.target.value)}
                  className="form-input"
                  placeholder="Enter thesis title"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-white border border-neutral rounded-custom hover:bg-neutral-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateThesis}
                  disabled={createLoading || !newThesisTitle.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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