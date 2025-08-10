import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Calendar from '../../components/common/Calendar';
import { useAuthStore } from '../../stores/authStore';
import { getTheses, updateThesis } from '../../services/thesisService';
import { getMyRequests, approveRequest, declineRequest } from '../../services/requestService';
import { Thesis, ThesisRequest } from '../../types';
import { 
  AcademicCapIcon, 
  CalendarDaysIcon, 
  DocumentTextIcon, 
  UserGroupIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';

const ProfessorHome: React.FC = () => {
  const { user } = useAuthStore();
  const [supervisedTheses, setSupervisedTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<ThesisRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processingRequestIds, setProcessingRequestIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfessorData = async () => {
      if (!user?.id) {
        setLoading(false);
        setLoadingRequests(false);
        return;
      }

      try {
        setLoading(true);
        setLoadingRequests(true);
        // Fetch supervised theses and incoming requests in parallel
        const [thesesData, requestsData] = await Promise.all([
          getTheses(user.id),
          getMyRequests() // Fetches requests targeted to this professor
        ]);
        
        setSupervisedTheses(thesesData);
        
        // Filter for only requests with status 'requested'
        const pendingReqs = requestsData.filter(req => req.status === 'requested');
        setPendingRequests(pendingReqs);
      } catch (err) {
        console.error('Failed to fetch professor data:', err);
      } finally {
        setLoading(false);
        setLoadingRequests(false);
      }
    };

    fetchProfessorData();
  }, [user?.id]);

  const handleApproveRequest = async (requestId: string) => {
    const requestToApprove = pendingRequests.find(req => req.id === requestId);
    if (!requestToApprove) {
      console.error('Request not found for approval:', requestId);
      return;
    }
    if (!user?.id) {
      console.error('User ID not found, cannot approve request.');
      return;
    }
    
    const { thesis_id } = requestToApprove;
    const professorId = user.id;

    try {
      setProcessingRequestIds(prev => [...prev, requestId]);
      
      // 1. Update the thesis supervisor first
      await updateThesis(thesis_id, { supervisor_id: professorId });
      console.log(`Thesis ${thesis_id} supervisor updated to ${professorId}`);

      // 2. Then, approve the request
      await approveRequest(requestId);
      console.log(`Request ${requestId} approved.`);

      // Update UI: remove request from pending
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      
      // 3. Refetch supervised theses to update the list immediately
      try {
        const updatedTheses = await getTheses(professorId);
        setSupervisedTheses(updatedTheses);
        console.log('Supervised theses list updated.');
      } catch (fetchErr) {
        console.error('Failed to refetch supervised theses after approval:', fetchErr);
      }

    } catch (err) {
      console.error('Failed to process approval:', err);
    } finally {
      setProcessingRequestIds(prev => prev.filter(id => id !== requestId));
    }
  };
  
  const handleDeclineRequest = async (requestId: string) => {
    try {
      setProcessingRequestIds(prev => [...prev, requestId]);
      await declineRequest(requestId);
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (err) {
      console.error('Failed to decline request:', err);
    } finally {
      setProcessingRequestIds(prev => prev.filter(id => id !== requestId));
    }
  };

  if (loading || loadingRequests) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 mb-8 border dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome, Professor {user?.full_name || ''}!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Oversee thesis supervision, set deadlines, and manage academic progress.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Main Actions and Supervised Theses */}
        <div className="md:col-span-2 space-y-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Set Deadlines Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 shadow-sm border dark:border-blue-800">
              <ClockIcon className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-4" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Manage Deadlines</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Set and manage thesis submission, review, and defense deadlines for all students.
              </p>
              <Link
                to="/admin/set-deadlines"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center"
                tabIndex={0}
                aria-label="Set thesis deadlines"
              >
                Set Deadlines
                <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>

            {/* View All Theses Card */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 shadow-sm border dark:border-green-800">
              <DocumentTextIcon className="h-10 w-10 text-green-600 dark:text-green-400 mb-4" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">All Theses Overview</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Monitor thesis statuses across all students to help with deadline planning decisions.
              </p>
              <Link
                to="/theses/all"
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center"
                tabIndex={0}
                aria-label="View all theses overview"
              >
                View All Theses
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

          {/* Pending Thesis Requests Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
            <div className="flex items-center mb-6">
              <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Pending Thesis Requests</h2>
            </div>
            
            {loadingRequests ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No pending thesis requests at the moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => {
                  const isProcessing = processingRequestIds.includes(request.id);
                  
                  return (
                    <div 
                      key={request.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150"
                    >
                      <div className="p-4">
                        <div className="mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            Request from: {request.student_name ? 
                              <span className="font-semibold">{request.student_name}</span> 
                              : 'Unknown Student'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Thesis Title: {request.thesis_title || 'Untitled Thesis'}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center justify-between mt-4">
                          <Link
                            to={`/theses/${request.thesis_id}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium mr-4"
                            tabIndex={0}
                            aria-label={`View thesis: ${request.thesis_title || 'Untitled'}`}
                          >
                            View Thesis Details
                          </Link>
                          
                          <div className="flex space-x-3 mt-2 sm:mt-0">
                            <button
                              onClick={() => handleDeclineRequest(request.id)}
                              disabled={isProcessing}
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors duration-150 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                              aria-label="Decline thesis request"
                              tabIndex={0}
                            >
                              <XMarkIcon className="h-4 w-4 mr-1" />
                              Decline
                            </button>
                            
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              disabled={isProcessing}
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors duration-150 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                              aria-label="Approve thesis request"
                              tabIndex={0}
                            >
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Supervised Theses Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
            <div className="flex items-center mb-6">
              <AcademicCapIcon className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-2" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Your Supervised Theses</h2>
            </div>
            
            {supervisedTheses.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">You currently have no supervised theses.</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Students can request thesis supervision from professors and graduation assistants.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {supervisedTheses.map(thesis => (
                  <Link 
                    key={thesis.id}
                    to={`/theses/${thesis.id}`}
                    className="block p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150"
                    aria-label={`View details for thesis: ${thesis.title}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 truncate">{thesis.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Student ID: {thesis.student_id}</p>
                        {thesis.status && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                            thesis.status === 'approved' ? 'bg-green-100 text-green-800' :
                            thesis.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                            thesis.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {thesis.status.replace('_', ' ').charAt(0).toUpperCase() + thesis.status.replace('_', ' ').slice(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Calendar */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border dark:border-gray-700">
            <div className="flex items-center mb-4">
              <CalendarDaysIcon className="h-5 w-5 text-gray-600 dark:text-gray-300 mr-2" />
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Upcoming Deadlines</h2>
            </div>
            <Calendar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorHome; 