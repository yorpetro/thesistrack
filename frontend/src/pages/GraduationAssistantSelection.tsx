import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getGraduationAssistants } from '../services/userService.ts';
import { getTheses } from '../services/thesisService';
import { createThesisRequest, getMyRequests, cancelRequest } from '../services/requestService';
import { GraduationAssistant, Thesis, ThesisRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import RequestDisclaimer from '../components/RequestDisclaimer';

const GraduationAssistantSelection = () => {
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
  const { user } = useAuth();

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
        const pendingRequest = requestsData.find(req => req.status === 'pending');
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
    if (!selectedAssistant || !thesis) return;
    
    try {
      setRequestLoading(true);
      
      // Create request for the selected assistant
      const newRequest = await createThesisRequest(thesis.id, selectedAssistant.id);
      
      // Update the active request
      setActiveRequest(newRequest);
      setShowDisclaimer(false);
      
    } catch (err) {
      console.error(err);
      setError('Failed to send request. Please try again.');
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
                    
                    <h2 className="text-xl font-semibold text-center mb-2">
                      {assistant.full_name || 'Unnamed Assistant'}
                    </h2>
                    
                    <div className="flex justify-center items-center mb-4">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {assistant.student_count || 0} {assistant.student_count === 1 ? 'Student' : 'Students'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 text-center">
                      {assistant.bio || 'No bio available.'}
                    </p>
                    
                    <div className="flex justify-center">
                      {isPending ? (
                        <button
                          onClick={handleCancelRequest}
                          disabled={cancellingRequest}
                          className={`bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 font-medium py-2 px-4 rounded ${
                            cancellingRequest ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          aria-label={`Cancel request to ${assistant.full_name || 'this assistant'}`}
                        >
                          {cancellingRequest ? 'Cancelling...' : 'Cancel Request'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRequestAssistant(assistant)}
                          disabled={isDisabled || requestLoading}
                          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300 ${
                            (isDisabled || requestLoading) ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          aria-label={`Request ${assistant.full_name || 'graduation assistant'} as your mentor`}
                        >
                          Request Assist
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
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

export default GraduationAssistantSelection; 