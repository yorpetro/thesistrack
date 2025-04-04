import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTheses } from '../services/thesisService';
import { getGraduationAssistants } from '../services/userService';
import { getMyRequests, cancelRequest, approveRequest, declineRequest } from '../services/requestService';
import { Thesis, GraduationAssistant, ThesisRequest } from '../types';
import { useAuthStore } from '../stores/authStore';
import { 
  DocumentTextIcon, 
  AcademicCapIcon, 
  PlusIcon,
  UserGroupIcon,
  XMarkIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import RequestDisclaimer from '../components/RequestDisclaimer';

const Home = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [recentTheses, setRecentTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentThesis, setStudentThesis] = useState<Thesis | null>(null);
  const [assistants, setAssistants] = useState<GraduationAssistant[]>([]);
  const [loadingAssistants, setLoadingAssistants] = useState(false);
  const [needsAssistant, setNeedsAssistant] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<GraduationAssistant | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const [activeRequest, setActiveRequest] = useState<ThesisRequest | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ThesisRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequestIds, setProcessingRequestIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchTheses = async () => {
      try {
        setLoading(true);
        const data = await getTheses();
        
        if (user?.role === 'student') {
          const thesis = data.length > 0 ? data[0] : null;
          setStudentThesis(thesis);
          
          // Check if the student needs an assistant
          if (thesis && !thesis.supervisor_id) {
            setNeedsAssistant(true);
            fetchAssistantsAndRequests(thesis.id);
          }
        } else {
          // Get just the 3 most recent theses for non-students
          setRecentTheses(data.slice(0, 3));
          
          // If user is a graduation assistant, fetch incoming requests
          if (user?.role === 'graduation_assistant') {
            fetchIncomingRequests();
          }
        }
      } catch (err) {
        console.error('Failed to fetch theses:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAssistantsAndRequests = async (thesisId: string) => {
      try {
        setLoadingAssistants(true);
        // Fetch graduation assistants and active requests in parallel
        const [assistantsData, requestsData] = await Promise.all([
          getGraduationAssistants(),
          getMyRequests()
        ]);
        
        // Find any active request for this thesis
        const pendingRequest = requestsData.find(
          req => req.thesis_id === thesisId && req.status === 'pending'
        );
        
        if (pendingRequest) {
          setActiveRequest(pendingRequest);
        }
        
        setAssistants(assistantsData);
      } catch (err) {
        console.error('Failed to load assistant data:', err);
      } finally {
        setLoadingAssistants(false);
      }
    };
    
    const fetchIncomingRequests = async () => {
      try {
        setLoadingRequests(true);
        const requests = await getMyRequests();
        // Filter for only pending requests
        const pendingReqs = requests.filter(req => req.status === 'pending');
        setPendingRequests(pendingReqs);
      } catch (err) {
        console.error('Failed to fetch incoming requests:', err);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchTheses();
  }, [user?.role]);

  const handleRequestAssistant = (assistant: GraduationAssistant) => {
    setSelectedAssistant(assistant);
    setShowDisclaimer(true);
  };
  
  const handleConfirmRequest = async () => {
    if (!selectedAssistant || !studentThesis) return;
    
    try {
      setRequestLoading(true);
      
      // Navigate to the selection page to complete the request
      // This is a cleaner UX than handling the request here
      navigate('/select-assistant');
      
    } catch (err) {
      console.error('Failed to prepare request:', err);
    } finally {
      setRequestLoading(false);
    }
  };
  
  const handleCancelRequest = async () => {
    if (!activeRequest) return;
    
    try {
      setCancellingRequest(true);
      
      // Cancel the active request
      await cancelRequest(activeRequest.id);
      
      // Clear the active request
      setActiveRequest(null);
      
    } catch (err) {
      console.error('Failed to cancel request:', err);
    } finally {
      setCancellingRequest(false);
    }
  };
  
  const handleApproveRequest = async (requestId: string) => {
    try {
      setProcessingRequestIds(prev => [...prev, requestId]);
      
      // Approve the request
      await approveRequest(requestId);
      
      // Remove the request from the list
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      
    } catch (err) {
      console.error('Failed to approve request:', err);
    } finally {
      setProcessingRequestIds(prev => prev.filter(id => id !== requestId));
    }
  };
  
  const handleDeclineRequest = async (requestId: string) => {
    try {
      setProcessingRequestIds(prev => [...prev, requestId]);
      
      // Decline the request
      await declineRequest(requestId);
      
      // Remove the request from the list
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      
    } catch (err) {
      console.error('Failed to decline request:', err);
    } finally {
      setProcessingRequestIds(prev => prev.filter(id => id !== requestId));
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

            {/* Graduation Assistant Section */}
            {studentThesis && needsAssistant && (
              <div className="bg-blue-50 rounded-lg p-6 shadow-sm">
                <UserGroupIcon className="h-10 w-10 text-blue-600 mb-4" />
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  {activeRequest 
                    ? 'Thesis Assistant Request Pending' 
                    : 'Request a Thesis Assistant'}
                </h2>
                
                {activeRequest ? (
                  <div className="mb-4">
                    <p className="text-gray-600 mb-3">
                      Your request is pending with <span className="font-medium">
                        {assistants.find(a => a.id === activeRequest.assistant_id)?.full_name || 'a graduation assistant'}
                      </span>. They will review your request and respond soon.
                    </p>
                    <button
                      onClick={handleCancelRequest}
                      disabled={cancellingRequest}
                      className={`inline-flex items-center text-red-600 hover:text-red-800 font-medium ${
                        cancellingRequest ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      aria-label="Cancel assistant request"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      {cancellingRequest ? 'Cancelling request...' : 'Cancel request'}
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-600 mb-4">
                    Choose a graduation assistant who will guide you through your thesis journey.
                  </p>
                )}
                
                {loadingAssistants ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                  </div>
                ) : assistants.length === 0 ? (
                  <p className="text-gray-500 text-center py-2">No graduation assistants available at the moment.</p>
                ) : !activeRequest && (
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
                          onClick={() => handleRequestAssistant(assistant)}
                          disabled={requestLoading}
                          className={`w-full text-center text-white bg-blue-600 hover:bg-blue-700 py-1.5 px-2 rounded text-sm ${
                            requestLoading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          aria-label={`Request ${assistant.full_name || 'graduation assistant'} as your mentor`}
                        >
                          {requestLoading ? 'Requesting...' : 'Request Assist'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Always show the View All button if there are assistants and no active request */}
                {assistants.length > 0 && !activeRequest && (
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
                )}
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
      
      {/* Thesis Request Section for Graduation Assistants */}
      {user?.role === 'graduation_assistant' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-6">
            <ClockIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">Pending Thesis Requests</h2>
          </div>
          
          {loadingRequests ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending thesis requests at the moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => {
                const isProcessing = processingRequestIds.includes(request.id);
                
                return (
                  <div 
                    key={request.id}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
                  >
                    <div className="p-4">
                      <div className="mb-2">
                        <h3 className="font-medium text-gray-900 mb-1">
                          Request from: {request.thesis?.student_id ? 
                            <span className="font-semibold">{
                              request.thesis.student_id
                            }</span> : 'Unknown Student'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Thesis Title: {request.thesis?.title || 'Untitled Thesis'}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-between mt-4">
                        <Link
                          to={`/theses/${request.thesis_id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          tabIndex={0}
                          aria-label={`View thesis: ${request.thesis?.title || 'Untitled'}`}
                        >
                          View Thesis Details
                        </Link>
                        
                        <div className="flex space-x-3 mt-2 sm:mt-0">
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            disabled={isProcessing}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 ${
                              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            aria-label="Decline thesis request"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Decline
                          </button>
                          
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={isProcessing}
                            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 ${
                              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            aria-label="Approve thesis request"
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
      )}
      
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
      
      {/* Request Disclaimer Modal */}
      <RequestDisclaimer
        open={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        onConfirm={handleConfirmRequest}
        assistantName={selectedAssistant?.full_name || ''}
        loading={requestLoading}
      />
    </div>
  );
};

export default Home; 