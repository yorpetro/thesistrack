import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getThesis, updateThesis } from '../../services/thesisService';
import { ThesisWithRelations, ThesisStatus } from '../../types';
import ThesisFileManager from '../../components/thesis/ThesisFileManager';
import ThesisContent from '../../components/thesis/ThesisContent';
import CommentSection from '../../components/thesis/comments/CommentSection';
import { useAuthStore } from '../../stores/authStore';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const statusColors: Record<ThesisStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
  submitted: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  under_review: { bg: 'bg-blue-100', text: 'text-blue-800' },
  needs_revision: { bg: 'bg-orange-100', text: 'text-orange-800' },
  approved: { bg: 'bg-green-100', text: 'text-green-800' },
  declined: { bg: 'bg-red-100', text: 'text-red-800' }
};

const statusLabels: Record<ThesisStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  needs_revision: 'Needs Revision',
  approved: 'Approved',
  declined: 'Declined'
};

const ThesisDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [thesis, setThesis] = useState<ThesisWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThesis = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getThesis(id);
        setThesis(data);
      } catch (err) {
        setError('Failed to load thesis details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchThesis();
  }, [id]);

  const handleSaveThesis = async (title: string, abstract: string) => {
    if (!id) return;
    
    try {
      const updatedThesis = await updateThesis(id, {
        title,
        abstract: abstract ? abstract : undefined
      });
      
      setThesis(prev => prev ? { ...prev, ...updatedThesis } : null);
    } catch (err) {
      console.error('Failed to update thesis:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !thesis) {
    return (
      <div className="card text-center p-8">
        <div className="text-red-500 mb-6">
          <p>{error || 'Thesis not found'}</p>
        </div>
        <Link 
          to={user?.role === 'student' ? '/thesis/new' : '/theses'}
          className="btn-primary inline-flex items-center"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
          {user?.role === 'student' ? 'Create Thesis' : 'Back to Theses'}
        </Link>
      </div>
    );
  }

  const statusColor = statusColors[thesis.status];

  return (
    <div className="space-y-6">
      {user?.role !== 'student' && (
        <div className="flex items-center justify-between mb-6">
          <Link 
            to="/theses" 
            className="inline-flex items-center text-accent hover:text-accent-dark transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            <span>Back to theses</span>
          </Link>
          <div className={`px-3 py-1 rounded-full ${statusColor.bg} ${statusColor.text} text-sm font-medium`}>
            {statusLabels[thesis.status]}
          </div>
        </div>
      )}

      {user?.role === 'student' && (
        <div className="flex justify-end">
          <div className={`px-3 py-1 rounded-full ${statusColor.bg} ${statusColor.text} text-sm font-medium`}>
            {statusLabels[thesis.status]}
          </div>
        </div>
      )}

      <ThesisContent
        thesis={thesis}
        onSave={handleSaveThesis}
      />
      
      <ThesisFileManager thesisId={thesis.id} />
      
      <CommentSection
        thesisId={thesis.id}
        currentUser={user}
      />
    </div>
  );
};

export default ThesisDetails; 