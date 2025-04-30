import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTheses } from '../services/thesisService';
import { Thesis } from '../types';
import { useAuthStore } from '../stores/authStore';
import { 
  DocumentTextIcon, 
  AcademicCapIcon, 
  PlusIcon,
} from '@heroicons/react/24/outline';
import StudentHome from '../features/home/StudentHome';
import AssistantHome from '../features/home/AssistantHome';

const Home = () => {
  const { user } = useAuthStore();
  const [recentTheses, setRecentTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenericData = async () => {
      try {
        setLoading(true);
        const data = await getTheses();
        
        setRecentTheses(data.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch generic home data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role !== 'student' && user?.role !== 'graduation_assistant') {
      fetchGenericData();
    } else {
      setLoading(false);
    }
  }, [user?.role]);

  if (user?.role === 'student') {
    return <StudentHome />;
  }

  if (user?.role === 'graduation_assistant') {
    return <AssistantHome />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome{user?.full_name ? `, ${user.full_name}` : ''}!
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Thesis Tracker helps you manage academic theses from submission to completion.
        </p>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-primary-50 rounded-lg p-6 shadow-sm">
            <DocumentTextIcon className="h-10 w-10 text-primary-600 mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">Manage Theses</h2>
            <p className="text-gray-600 mb-4">
              View, track, and update thesis submissions.
            </p>
            <Link
              to="/theses"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
              tabIndex={0}
              aria-label="View all theses"
            >
              View all theses
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
              Monitor thesis statuses and review processes.
            </p>
            <Link
              to="/theses"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
              tabIndex={0}
              aria-label="Check thesis status"
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
            <h2 className="text-lg font-medium text-gray-900 mb-2">Register New Thesis</h2>
            <p className="text-gray-600 mb-4">
              Faculty can register new thesis projects.
            </p>
            <Link
              to="/theses/new"
              className="text-green-600 hover:text-green-700 font-medium flex items-center"
              tabIndex={0}
              aria-label="Register new thesis"
            >
              Register thesis
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
    </div>
  );
};

export default Home; 