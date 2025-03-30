import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getGraduationAssistants } from '../services/userService.ts';
import { getTheses, updateThesis } from '../services/thesisService';
import { GraduationAssistant, Thesis } from '../types';
import { useAuth } from '../context/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const GraduationAssistantSelection = () => {
  const [assistants, setAssistants] = useState<GraduationAssistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [hasThesis, setHasThesis] = useState(false);
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
        // Fetch graduation assistants and all theses in parallel
        const [assistantsData, thesesData] = await Promise.all([
          getGraduationAssistants(),
          getTheses()
        ]);
        
        // Check if the student has a thesis
        setHasThesis(thesesData.length > 0);
        
        // Assistants now include student_count from the backend
        setAssistants(assistantsData);
        setError(null);
      } catch (err) {
        setError('Failed to load graduation assistants. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, user]);

  const handleSelectAssistant = async (assistantId: string) => {
    try {
      setSelecting(true);
      
      // Get the student's thesis
      const theses = await getTheses();
      
      if (theses && theses.length > 0) {
        // Update the thesis with the selected graduation assistant
        await updateThesis(theses[0].id, {
          supervisor_id: assistantId
        });
        
        // Navigate to the thesis page
        navigate(`/theses/${theses[0].id}`);
      } else {
        setError('No thesis found. Please create a thesis first.');
        setHasThesis(false);
      }
    } catch (err) {
      setError('Failed to assign graduation assistant. Please try again.');
      console.error(err);
    } finally {
      setSelecting(false);
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
              You need to create a thesis before selecting a graduation assistant.
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
        <h1 className="text-2xl font-bold mb-6">Select Your Graduation Assistant</h1>
        
        <p className="mb-6 text-gray-600">
          Please select a graduation assistant who will guide you through your thesis process.
          You can view each assistant's profile and the number of students they are currently mentoring.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {assistants.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No graduation assistants are available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assistants.map((assistant) => (
              <div 
                key={assistant.id} 
                className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    {/* Placeholder for future profile pictures */}
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
                    <button
                      onClick={() => handleSelectAssistant(assistant.id)}
                      disabled={selecting}
                      className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-300 ${
                        selecting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      aria-label={`Select ${assistant.full_name || 'graduation assistant'} as your mentor`}
                    >
                      {selecting ? 'Selecting...' : 'Select'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GraduationAssistantSelection; 