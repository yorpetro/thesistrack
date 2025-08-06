// Placeholder for Student Home Screen
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getTheses } from '../../services/thesisService';
import { getThesisSupervisors } from '../../services/userService';
import { getMyRequests, cancelRequest } from '../../services/requestService';
import { Thesis, GraduationAssistant, ThesisRequest } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { 
  DocumentTextIcon, 
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import RequestDisclaimer from '../../components/RequestDisclaimer';
import Calendar from '../../components/common/Calendar';

const StudentHome: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
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
  
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const theses = await getTheses(); // Assuming getTheses fetches the specific student's thesis
        const thesis = theses.length > 0 ? theses[0] : null;
        setStudentThesis(thesis);

        if (thesis && !thesis.supervisor_id) {
          setNeedsAssistant(true);
          fetchAssistantsAndRequests(thesis.id);
        } else {
          setNeedsAssistant(false); // Reset if thesis exists and has supervisor or no thesis exists
        }
      } catch (err) {
        console.error('Failed to fetch student thesis:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAssistantsAndRequests = async (thesisId: string) => {
      try {
        setLoadingAssistants(true);
        const [assistantsData, requestsData] = await Promise.all([
          getThesisSupervisors(),
          getMyRequests() // Fetches requests initiated by the student
        ]);

        const pendingRequest = requestsData.find(
          req => req.thesis_id === thesisId && req.status === 'requested'
        );
        
        setActiveRequest(pendingRequest || null);
        setAssistants(assistantsData);
      } catch (err) {
        console.error('Failed to load assistant data:', err);
      } finally {
        setLoadingAssistants(false);
      }
    };

    fetchStudentData();
  }, [user?.id]); // Depend on user ID to refetch if user changes

  const handleRequestAssistant = (assistant: GraduationAssistant) => {
    setSelectedAssistant(assistant);
    setShowDisclaimer(true); // This might need adjustment if RequestDisclaimer is complex
  };
  
  const handleConfirmRequest = async () => {
    if (!selectedAssistant || !studentThesis) return;
    
    // The logic to navigate to /select-assistant is now directly handled 
    // by the "View All Graduation Assistants" button and potentially 
    // the click handler for requesting a specific assistant might change.
    // For now, let's keep the navigation logic.
    // If the RequestDisclaimer modal itself handles the request creation, 
    // this might need refactoring.
    try {
      setRequestLoading(true);
      navigate('/select-assistant'); 
    } catch (err) {
      console.error('Failed to navigate for request:', err);
    } finally {
      setRequestLoading(false);
    }
  };
  
  const handleCancelRequest = async () => {
    if (!activeRequest) return;
    
    try {
      setCancellingRequest(true);
      await cancelRequest(activeRequest.id);
      setActiveRequest(null);
      // Optionally, refetch assistants/requests to ensure UI consistency
    } catch (err) {
      console.error('Failed to cancel request:', err);
    } finally {
      setCancellingRequest(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section (Optional but good for consistency) */}
      <div className="bg-white rounded-lg shadow p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome{user?.full_name ? `, ${user.full_name}` : ''}!
        </h1>
        <p className="text-lg text-gray-600">
          Manage and track your thesis journey from submission to completion.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Thesis and Assistant */}
        <div className="md:col-span-2 space-y-8">
          {/* Your Thesis Card */}
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
                    tabIndex={0} // Added for accessibility
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
              ) : assistants.length === 0 && !activeRequest ? ( // Only show if no active request
                <p className="text-gray-500 text-center py-2">No graduation assistants available at the moment.</p>
              ) : !activeRequest && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {assistants.slice(0, 3).map(assistant => (
                    <div 
                      key={assistant.id}
                      className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex justify-center mb-3">
                        {/* Placeholder for assistant avatar */}
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
                        tabIndex={0} // Added for accessibility
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

        {/* Right Column: Calendar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
             <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Deadlines</h2>
             <Calendar />
          </div>
        </div>
      </div>
      
      {/* Request Disclaimer Modal - Ensure props are passed correctly */}
      <RequestDisclaimer
        open={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        onConfirm={handleConfirmRequest} // Or potentially a different handler if request is made directly
        assistantName={selectedAssistant?.full_name || ''}
        loading={requestLoading} // Or a specific loading state for the disclaimer action
      />
    </div>
  );
};

export default StudentHome; 