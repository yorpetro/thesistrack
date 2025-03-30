import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTheses, updateThesis } from '../services/thesisService';
import { getGraduationAssistants } from '../services/userService';
import { Thesis, GraduationAssistant } from '../types';
import { useAuthStore } from '../stores/authStore';
import { 
  DocumentTextIcon, 
  AcademicCapIcon, 
  PlusIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const Home = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [recentTheses, setRecentTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentThesis, setStudentThesis] = useState<Thesis | null>(null);
  const [assistants, setAssistants] = useState<GraduationAssistant[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(false);
  const [needsAssistant, setNeedsAssistant] = useState(false);
  const [selectingAssistant, setSelectingAssistant] = useState(false);

  useEffect(() => {
    const fetchTheses = async () => {
      try {
        setLoading(true);
        const data = await getTheses();
        
        if (user?.role === 'student') {
          const thesis = data.length > 0 ? data[0] : null;
          setStudentThesis(thesis);
          
          // Check if the student needs to select a graduation assistant
          if (thesis && !thesis.supervisor_id) {
            setNeedsAssistant(true);
            fetchAssistants();
          }
        } else {
          // Get just the 3 most recent theses for non-students
          setRecentTheses(data.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch theses:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAssistants = async () => {
      try {
        setLoadingAssistants(true);
        // Fetch graduation assistants - student count now comes directly from the API
        const assistantsData = await getGraduationAssistants();
        setAssistants(assistantsData);
      } catch (err) {
        console.error('Failed to load graduation assistants:', err);
      } finally {
        setLoadingAssistants(false);
      }
    };

    fetchTheses();
  }, [user?.role]);

  const handleSelectAssistant = async (assistantId: string) => {
    if (!studentThesis) return;
    
    try {
      setSelectingAssistant(true);
      
      // Update the thesis with the selected graduation assistant
      await updateThesis(studentThesis.id, {
        supervisor_id: assistantId
      });
      
      // Update the local thesis object
      setStudentThesis({
        ...studentThesis,
        supervisor_id: assistantId
      });
      
      // No longer needs an assistant
      setNeedsAssistant(false);
    } catch (err) {
      console.error('Failed to assign graduation assistant:', err);
    } finally {
      setSelectingAssistant(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome{user?.full_name ? `, ${user.full_name}` : ''}!
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          {user?.role === 'student' 
            ? 'Manage and track your thesis journey from submission to completion.'
            : 'Thesis Tracker helps you manage academic theses from submission to completion.'}
        </p>
        
        {user?.role === 'student' ? (
          <div className="grid gap-6">
            <div className="bg-primary-50 rounded-lg p-6 shadow-sm">
              <DocumentTextIcon className="h-10 w-10 text-primary-600 mb-4" />
              <h2 className="text-lg font-medium text-gray-900 mb-2">Your Thesis</h2>
              <p className="text-gray-600 mb-4">
                {!studentThesis 
                  ? 'Start your thesis journey by creating your thesis.'
                  : 'View and manage your thesis submission.'}
              </p>
              <Link
                to={studentThesis ? `/theses/${studentThesis.id}` : "/theses/new"}
                className="text-primary-600 hover:text-primary-700 font-medium flex items-center"
                tabIndex={0}
                aria-label={!studentThesis ? 'Create new thesis' : 'View your thesis'}
              >
                {!studentThesis ? 'Create thesis' : 'View thesis'}
                <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>

            {/* Graduation Assistant Selection Section */}
            {studentThesis && needsAssistant && (
              <div className="bg-blue-50 rounded-lg p-6 shadow-sm">
                <UserGroupIcon className="h-10 w-10 text-blue-600 mb-4" />
                <h2 className="text-lg font-medium text-gray-900 mb-2">Select Your Graduation Assistant</h2>
                <p className="text-gray-600 mb-4">
                  Choose a graduation assistant who will guide you through your thesis journey.
                </p>
                
                {loadingAssistants ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                  </div>
                ) : assistants.length === 0 ? (
                  <p className="text-gray-500 text-center py-2">No graduation assistants available at the moment.</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                    {assistants.slice(0, 3).map(assistant => (
                      <div 
                        key={assistant.id}
                        className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="flex justify-center mb-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                            {assistant.full_name ? assistant.full_name.charAt(0).toUpperCase() : 'GA'}
                          </div>
                        </div>
                        <h3 className="text-center font-medium mb-1">{assistant.full_name || 'Unnamed'}</h3>
                        <p className="text-center text-xs text-gray-500 mb-3">
                          {assistant.student_count || 0} {assistant.student_count === 1 ? 'Student' : 'Students'}
                        </p>
                        <button
                          onClick={() => handleSelectAssistant(assistant.id)}
                          disabled={selectingAssistant}
                          className={`w-full text-center text-white bg-blue-600 hover:bg-blue-700 py-1.5 px-2 rounded text-sm ${
                            selectingAssistant ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          aria-label={`Select ${assistant.full_name || 'graduation assistant'} as your mentor`}
                        >
                          {selectingAssistant ? 'Selecting...' : 'Select'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Always show the View All button, regardless of how many assistants are shown */}
                <div className="mt-6 flex justify-center">
                  <Link
                    to="/select-assistant"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    tabIndex={0}
                    aria-label="View all graduation assistants"
                  >
                    View All Graduation Assistants
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
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
                tabIndex={0}
                aria-label="View your theses"
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
              <h2 className="text-lg font-medium text-gray-900 mb-2">Start New Thesis</h2>
              <p className="text-gray-600 mb-4">
                Begin your next academic achievement by creating a new thesis.
              </p>
              <Link
                to="/theses/new"
                className="text-green-600 hover:text-green-700 font-medium flex items-center"
                tabIndex={0}
                aria-label="Create new thesis"
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
        )}
      </div>
      
      {user?.role !== 'student' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Theses</h2>
            <Link
              to="/theses"
              className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center"
              tabIndex={0}
              aria-label="View all theses"
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
                to="/theses/new"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                tabIndex={0}
                aria-label="Create new thesis"
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
                  tabIndex={0}
                  aria-label={`View thesis: ${thesis.title}`}
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
      )}
    </div>
  );
};

export default Home; 