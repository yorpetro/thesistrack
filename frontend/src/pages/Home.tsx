import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTheses } from '../services/thesisService';
import { Thesis } from '../types';
import { useAuthStore } from '../stores/authStore';
import { 
  DocumentTextIcon, 
  AcademicCapIcon, 
  PlusIcon 
} from '@heroicons/react/24/outline';

const Home = () => {
  const { user } = useAuthStore();
  const [recentTheses, setRecentTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentTheses = async () => {
      try {
        setLoading(true);
        const data = await getTheses();
        // Get just the 3 most recent theses
        setRecentTheses(data.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch recent theses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTheses();
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome{user?.full_name ? `, ${user.full_name}` : ''}!
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Thesis Tracker helps you manage your academic theses from submission to completion.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-primary-50 rounded-lg p-6 shadow-sm">
            <DocumentTextIcon className="h-10 w-10 text-primary-600 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Manage Your Theses</h2>
            <p className="text-gray-600 mb-4">
              Create, track, and update your thesis submissions in one place.
            </p>
            <Link
              to="/theses"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
            >
              View your theses
              <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6 shadow-sm">
            <AcademicCapIcon className="h-10 w-10 text-blue-600 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Track Progress</h2>
            <p className="text-gray-600 mb-4">
              Keep track of thesis statuses, feedback, and review processes.
            </p>
            <Link
              to="/theses"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              Check status
              <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6 shadow-sm">
            <PlusIcon className="h-10 w-10 text-green-600 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Start New Thesis</h2>
            <p className="text-gray-600 mb-4">
              Begin your next academic achievement by creating a new thesis.
            </p>
            <Link
              to="/theses"
              className="text-green-600 hover:text-green-700 font-medium flex items-center"
            >
              Create thesis
              <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Theses</h2>
          <Link
            to="/theses"
            className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
          >
            View all
            <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : recentTheses.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">No theses created yet. Start by creating your first thesis.</p>
            <Link
              to="/theses"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Create Thesis
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentTheses.map((thesis) => (
              <Link
                key={thesis.id}
                to={`/theses/${thesis.id}`}
                className="block bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition duration-150"
              >
                <h3 className="font-medium text-gray-900">{thesis.title}</h3>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    thesis.status === 'approved' 
                      ? 'bg-green-100 text-green-800' 
                      : thesis.status === 'declined' 
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {thesis.status.charAt(0).toUpperCase() + thesis.status.slice(1)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home; 