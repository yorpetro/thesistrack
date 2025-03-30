import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createThesis } from '../../services/thesisService';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';

const NewThesis = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!user || !user.id) {
      setError('User authentication error. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const thesis = await createThesis({ 
        title: title.trim(),
        abstract: abstract.trim() || undefined,
        student_id: user.id
      });
      navigate(`/theses/${thesis.id}`);
    } catch (err) {
      console.error('Failed to create thesis:', err);
      setError('Failed to create thesis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-3 mb-6">
          <DocumentTextIcon className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Create New Thesis</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Thesis Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your thesis title"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-1">
              Abstract
            </label>
            <textarea
              id="abstract"
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your thesis abstract (optional)"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-0 border-r-0 border-white rounded-full"></div>
                  Creating...
                </span>
              ) : (
                'Create Thesis'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewThesis; 