// Placeholder for Graduation Assistant Home Screen
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyRequests, approveRequest, declineRequest } from '../../services/requestService';
import { ThesisRequest } from '../../types'; // Ensure correct path
import { useAuthStore } from '../../stores/authStore';
import { 
  CheckIcon, 
  ClockIcon,
  XMarkIcon // Added for the Decline button
} from '@heroicons/react/24/outline';
import Calendar from '../../components/common/Calendar';
import { getTheses, updateThesis } from '../../services/thesisService'; // Import updateThesis
import { Thesis } from '../../types'; // To type assigned theses
import { DocumentTextIcon, UserGroupIcon } from '@heroicons/react/24/outline'; // For new sections

const AssistantHome: React.FC = () => {
  const { user } = useAuthStore();
  const [assignedTheses, setAssignedTheses] = useState<Thesis[]>([]);
  const [loadingTheses, setLoadingTheses] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<ThesisRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true); // Start as true
  const [processingRequestIds, setProcessingRequestIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchAssistantData = async () => {
      // Ensure user and user.id exist before proceeding
      if (!user?.id) {
        console.error("User ID not found, cannot fetch assistant data.");
        setLoadingRequests(false);
        setLoadingTheses(false);
        return; // Exit if user ID is missing
      }
      
      try {
        setLoadingRequests(true);
        setLoadingTheses(true);
        // Fetch incoming requests and assigned theses in parallel
        const [requestsData, thesesData] = await Promise.all([
          getMyRequests(), // Fetches requests targeted to this assistant
          // Pass the assistant's user ID to filter theses
          getTheses(user.id) 
        ]);
        
        // Filter for only requests with status 'requested'
        const pendingReqs = requestsData.filter(req => req.status === 'requested');
        setPendingRequests(pendingReqs);
        
        // Theses are now pre-filtered by the backend using supervisor_id
        setAssignedTheses(thesesData);

      } catch (err) {
        console.error('Failed to fetch assistant data:', err);
      } finally {
        setLoadingRequests(false);
        setLoadingTheses(false);
      }
    };

    fetchAssistantData();
  }, [user?.id]); // Depend on user ID

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
    const assistantId = user.id;

    try {
      setProcessingRequestIds(prev => [...prev, requestId]);
      
      // 1. Update the thesis supervisor first
      await updateThesis(thesis_id, { supervisor_id: assistantId });
      console.log(`Thesis ${thesis_id} supervisor updated to ${assistantId}`);

      // 2. Then, approve the request
      await approveRequest(requestId);
      console.log(`Request ${requestId} approved.`);

      // Update UI: remove request from pending
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      
      // 3. Refetch assigned theses to update the list immediately
      try {
        const updatedTheses = await getTheses(assistantId);
        setAssignedTheses(updatedTheses);
        console.log('Assigned theses list updated.');
      } catch (fetchErr) {
        console.error('Failed to refetch assigned theses after approval:', fetchErr);
        // Optionally notify user that the list might be stale
      }

    } catch (err) {
      console.error('Failed to process approval:', err);
      // TODO: Add user-facing error notification (e.g., using a toast library)
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

  // Combine loading states for a general loading indicator if needed
  const isLoading = loadingRequests || loadingTheses;
  
  if (isLoading) {
     return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.full_name || 'Assistant'}!
          </h1>
          <p className="text-lg text-gray-600">
            Manage student thesis requests and oversee your assigned theses.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Requests and Assigned Theses */}
            <div className="md:col-span-2 space-y-8">
                {/* Pending Thesis Requests Section */}
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
                                className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors duration-150"
                            >
                                <div className="p-4">
                                <div className="mb-2">
                                    <h3 className="font-medium text-gray-900 mb-1">
                                    Request from: {request.student_name ? 
                                        <span className="font-semibold">{request.student_name}</span> 
                                        : 'Unknown Student'}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                    Thesis Title: {request.thesis_title || 'Untitled Thesis'}
                                    </p>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-between mt-4">
                                    <Link
                                    to={`/theses/${request.thesis_id}`} // Link to view thesis details
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4"
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

                {/* Assigned Theses Section */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center mb-6">
                        <DocumentTextIcon className="h-6 w-6 text-primary-600 mr-2" />
                        <h2 className="text-xl font-bold text-gray-900">Your Assigned Theses</h2>
                    </div>
                    {loadingTheses ? (
                       <div className="flex justify-center items-center h-32">
                         <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                       </div>
                    ) : assignedTheses.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">You currently have no assigned theses.</p>
                            {/* Optional: Link to browse available theses or info */} 
                        </div>
                    ) : (
                         <div className="space-y-3">
                            {assignedTheses.map(thesis => (
                                <Link 
                                    key={thesis.id}
                                    to={`/theses/${thesis.id}`}
                                    className="block p-3 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors duration-150"
                                    aria-label={`View details for thesis: ${thesis.title}`}
                                >
                                    <h4 className="font-medium text-gray-800">{thesis.title}</h4>
                                    {/* TODO: Replace student_id with student_name once available from API */}
                                    <p className="text-sm text-gray-600">Student ID: {thesis.student_id}</p> 
                                    {/* Add more relevant details like status if available */} 
                                </Link>
                            ))}
                        </div>
                    )}
                    <div className="mt-6 flex justify-center">
                        <Link 
                            to="/theses"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            tabIndex={0}
                            aria-label="View all theses"
                        >
                            View All Theses
                        </Link>
                    </div>
                </div>
            </div>

             {/* Right Column: Calendar */}
            <div className="md:col-span-1">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Upcoming Deadlines & Events</h2>
                    <Calendar />
                </div>
            </div>
        </div>
    </div>
  );
};

export default AssistantHome; 