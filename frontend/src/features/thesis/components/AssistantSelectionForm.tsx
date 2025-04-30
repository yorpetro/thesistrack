import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Update import paths relative to the new location
import { getGraduationAssistants } from '../../../services/userService.ts'; 
import { getTheses } from '../../../services/thesisService'; 
import { createThesisRequest, getMyRequests, cancelRequest } from '../../../services/requestService';
import { GraduationAssistant, Thesis, ThesisRequest } from '../../../types';
import { useAuthStore } from '../../../stores/authStore';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import RequestDisclaimer from '../../../components/RequestDisclaimer'; // Assuming RequestDisclaimer is in components/ root

// Rename component to match file name
const AssistantSelectionForm = () => {
  const [assistants, setAssistants] = useState<GraduationAssistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<GraduationAssistant | null>(null);
  const [hasThesis, setHasThesis] = useState(false);
  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [activeRequest, setActiveRequest] = useState<ThesisRequest | null>(null);
  const [cancellingRequest, setCancellingRequest] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    // Redirect if user is not a student
    if (user && user.role !== 'student') {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch graduation assistants, theses, and pending requests in parallel
        const [assistantsData, thesesData, requestsData] = await Promise.all([
          getGraduationAssistants(),
          getTheses(),
          getMyRequests()
        ]);
        
        // Check if the student has a thesis
        const hasExistingThesis = thesesData.length > 0;
        setHasThesis(hasExistingThesis);
        
        if (hasExistingThesis) {
          setThesis(thesesData[0]);
          
          // If thesis already has a supervisor and the supervisor was approved (not just requested)
          if (thesesData[0].supervisor_id) {
            navigate('/');
            return;
          }
        }
        
        // Check if there's an active request
        const pendingRequest = requestsData.find(req => req.status === 'requested');
        setActiveRequest(pendingRequest || null);
        
        // Set assistants data
        setAssistants(assistantsData);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, user]);

  const handleRequestAssistant = (assistant: GraduationAssistant) => {
    setSelectedAssistant(assistant);
    setShowDisclaimer(true);
  };
  
  const handleConfirmRequest = async () => {
    if (!selectedAssistant || !thesis || !user) {
      // We already know this path is not taken if we see the 400 error
      return;
    }
    
    // Reset error before trying
    setError(null); 
    
    try {
      setRequestLoading(true);
      
      // Create request for the selected assistant
      const newRequest = await createThesisRequest(user.id, thesis.id, selectedAssistant.id);
      
      // --- On Success --- 
      // Update the active request state with the response from the API
      setActiveRequest(newRequest); 
      // Close the confirmation modal
      setShowDisclaimer(false); 
      // Reset selected assistant (optional, but good practice)
      setSelectedAssistant(null); 
      
    } catch (err: any) { // Add type annotation for err
      // --- On Error --- 
      console.error('Request creation failed:', err);
      
      // Extract more detailed error message from backend response if available
      let errorMsg = 'Failed to send request. Please check the requirements or try again.';
      if (err.response?.data?.detail) {
        // If detail is an array of validation errors (FastAPI style)
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map((e: any) => e.msg || 'Invalid input').join(', ');
        } 
        // If detail is a simple string
        else if (typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg); 
      // Keep the modal open so the user sees the error
    } finally {
      // Ensure loading state is always turned off
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
      console.error(err);
      setError('Failed to cancel request. Please try again.');
    } finally {
      setCancellingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!hasThesis) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Create Your Thesis First</h1>
            <p className="mb-6 text-gray-600">
              You need to create a thesis before requesting a graduation assistant.
            </p>
            <Link 
              to="/theses/new" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700"
            >
              Create Thesis
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Link 
          to="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
          tabIndex={0}
          aria-label="Back to Home"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back to Home
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Request a Graduation Assistant</h1>
        
        <p className="mb-6 text-gray-600">
          Please request a graduation assistant who will guide you through your thesis process.
          The assistant will be notified and can choose to accept or decline your request.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {activeRequest && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <h2 className="text-lg font-medium text-blue-800 mb-2">Pending Request</h2>
            <p className="text-blue-700 mb-4">
              You have a pending request with {
                assistants.find(a => a.id === activeRequest.assistant_id)?.full_name || 'a graduation assistant'
              }.
            </p>
            <button
              onClick={handleCancelRequest}
              disabled={cancellingRequest}
              className={`bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 font-medium py-2 px-4 rounded ${
                cancellingRequest ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              aria-label="Cancel request"
            >
              {cancellingRequest ? 'Cancelling...' : 'Cancel Request'}
            </button>
          </div>
        )}

        {assistants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No graduation assistants are available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assistants.map((assistant) => {
              const isPending = activeRequest?.assistant_id === assistant.id;
              const isDisabled = !!activeRequest && !isPending;
              
              return (
                <div 
                  key={assistant.id} 
                  className={`border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 ${
                    isPending ? 'ring-2 ring-blue-500' : ''
                  } ${isDisabled ? 'opacity-50' : ''}`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                        {assistant.full_name ? assistant.full_name.charAt(0).toUpperCase() : 'GA'}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-center mb-2">{assistant.full_name}</h3>
                    <p className="text-sm text-gray-500 text-center mb-4">{assistant.email}</p>
                    <button 
                      onClick={() => handleRequestAssistant(assistant)} 
                      disabled={isPending || isDisabled || requestLoading}
                      className={`w-full px-4 py-2 text-white rounded-md font-semibold transition-colors duration-300 ${
                        isPending 
                          ? 'bg-blue-300 cursor-default'
                          : isDisabled
                            ? 'bg-gray-300 cursor-not-allowed' 
                            : requestLoading 
                              ? 'bg-blue-400 cursor-wait'
                              : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      aria-disabled={isPending || isDisabled || requestLoading}
                      aria-label={`Request ${assistant.full_name}`}
                    >
                      {isPending ? 'Requested' : requestLoading && selectedAssistant?.id === assistant.id ? 'Requesting...' : 'Request Assistant'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Disclaimer Modal/Popup */}
      <RequestDisclaimer 
        open={showDisclaimer}
        assistantName={selectedAssistant?.full_name || ''} 
        onConfirm={handleConfirmRequest}
        onClose={() => setShowDisclaimer(false)}
        loading={requestLoading}
      />
    </div>
  );
};

export default AssistantSelectionForm; 