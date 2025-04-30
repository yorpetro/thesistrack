// Placeholder for Thesis List Page (for Assistants/Professors)
import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getTheses, createThesis } from '../../services/thesisService';
import { Thesis, ThesisStatus } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { 
  PlusIcon, 
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

const statusColors: Record<ThesisStatus, string> = {
  draft: 'bg-neutral text-secondary',
  submitted: 'bg-accent-light/20 text-accent-dark',
  under_review: 'bg-yellow-100 text-yellow-800',
  needs_revision: 'bg-orange-100 text-orange-800',
  approved: 'bg-primary/20 text-primary-700',
  declined: 'bg-red-100 text-red-800'
};

// Rename ThesesList to ThesisListPage
const ThesisListPage = () => {
  const { user } = useAuthStore();
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newThesisTitle, setNewThesisTitle] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    const fetchTheses = async () => {
      if (!user) return; // Ensure user is defined
      
      try {
        setLoading(true);
        let data: Thesis[];
        
        // If user is a graduation assistant, fetch only their assigned theses
        // Note: This assumes getTheses service and backend endpoint are updated 
        // to accept a filter like { supervisorId: user.id }
        if (user.role === 'graduation_assistant') {
          // TODO: Update getTheses to accept filter parameters
          // For now, we simulate passing the ID, but the service needs modification.
          // data = await getTheses({ supervisorId: user.id }); 
          
          // TEMPORARY: Fetch all and filter locally (REMOVE THIS LATER)
          const allTheses = await getTheses();
          data = allTheses.filter(thesis => thesis.supervisor_id === user.id);
        } else {
          // For other roles (e.g., professor), fetch all theses
          data = await getTheses();
        }
        
        setTheses(data);
      } catch (err) {
        setError('Failed to load theses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTheses();
  }, [user]); // Dependency updated to user object

  // Redirect students to their thesis page or thesis creation
  if (user?.role === 'student') {
    if (theses.length > 0) {
      return <Navigate to={`/theses/${theses[0].id}`} />;
    }
    return <Navigate to="/theses/new" />;
  }

  const handleCreateThesis = async () => {
    if (!newThesisTitle.trim() || !user?.id) return;
    
    try {
      setCreateLoading(true);
      const newThesis = await createThesis({ title: newThesisTitle, student_id: user.id });
      setTheses([newThesis, ...theses]);
      setNewThesisTitle('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create thesis:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">My Theses</h1>
          <p className="text-earth mt-1">Manage and track your thesis projects</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="card text-center text-red-500">
          <p>{error}</p>
        </div>
      ) : theses.length === 0 ? (
        <div className="card text-center p-10">
          <div className="bg-neutral/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="h-10 w-10 text-secondary" />
          </div>
          <h2 className="text-xl font-medium text-secondary mb-2">No theses yet</h2>
          <p className="text-earth mb-6">
            There are currently no theses matching your view criteria. 
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {theses.map((thesis) => (
            <Link
              key={thesis.id}
              to={`/theses/${thesis.id}`}
              className="card hover:shadow-custom-lg transition-all duration-200 flex flex-col h-full group"
            >
              <div className="p-1 px-2 mb-2 w-fit self-start">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[thesis.status]}`}>
                  {thesis.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-3 text-secondary group-hover:text-primary transition-colors duration-200 line-clamp-2">
                {thesis.title}
              </h2>
              <div className="mt-auto pt-4 text-sm text-earth border-t border-neutral-light">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1.5" />
                  <span>Created {formatDate(thesis.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// Rename ThesesList to ThesisListPage
export default ThesisListPage; 