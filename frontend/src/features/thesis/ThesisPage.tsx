import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getThesis, updateThesis, createThesisReview } from '../../services/thesisService';
import { ThesisWithRelations, ThesisStatus, ReviewCreate } from '../../types';
import ThesisFileManager from '../../components/thesis/ThesisFileManager';
import ThesisContent from '../../components/thesis/ThesisContent';
import CommentSection from '../../components/thesis/comments/CommentSection';
import { useAuthStore } from '../../stores/authStore';
import { ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Modal from '../../components/common/Modal';
import Textarea from '../../components/common/Textarea';
import Select from '../../components/common/Select';
import ProfilePicture from '../../components/common/ProfilePicture';

const statusColors: Record<ThesisStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-300' },
  submitted: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-300' },
  under_review: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-800 dark:text-blue-300' },
  needs_revision: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-800 dark:text-orange-300' },
  approved: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-300' },
  declined: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-300' }
};

const statusLabels: Record<ThesisStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  needs_revision: 'Needs Revision',
  approved: 'Approved',
  declined: 'Declined'
};

const ThesisPage = () => {
  const { id } = useParams<{ id: string }>();

  const { user } = useAuthStore();
  const [thesis, setThesis] = useState<ThesisWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewGrade, setReviewGrade] = useState<number | ''>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThesis = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await getThesis(id);
        setThesis(data);
      } catch (err) {
        setError('Failed to load thesis details');
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

  const handleOpenReviewModal = () => {
    setReviewText('');
    setReviewGrade('');
    setReviewError(null);
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id || !reviewText || reviewGrade === '') {
      setReviewError('Please provide review text and select a grade.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      const reviewData: ReviewCreate = {
        comments: reviewText,
        grade: reviewGrade as number,
      };

      await createThesisReview(id, reviewData);

      const newStatus = reviewGrade === 2 ? ThesisStatus.declined : ThesisStatus.approved;

      const updatedThesisData = await updateThesis(id, { status: newStatus });

      setThesis(prev => prev ? { ...prev, ...updatedThesisData } : null);
      setIsReviewModalOpen(false);

    } catch (err) {
      console.error('Failed to submit review or update thesis status:', err);
      setReviewError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmittingReview(false);
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
  const gradeOptions = [
    { value: 2, label: '2 (Sufficient)' },
    { value: 3, label: '3 (Satisfactory)' },
    { value: 4, label: '4 (Good)' },
    { value: 5, label: '5 (Very Good)' },
    { value: 6, label: '6 (Excellent)' }
  ];

  return (
    <div className="space-y-6">
      {user?.role !== 'student' && (
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/theses"
            className="inline-flex items-center text-accent dark:text-accent-light hover:text-accent-dark dark:hover:text-accent transition-colors"
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
        onSave={user?.role !== 'graduation_assistant' ? handleSaveThesis : undefined}
        isEditable={user?.role !== 'graduation_assistant'}
      />

      {thesis.supervisor && (
        <div className="card">
          <div className="flex items-center mb-3">
            <UserCircleIcon className="h-6 w-6 mr-2 text-secondary dark:text-gray-300" />
            <h3 className="text-lg font-semibold text-secondary dark:text-gray-100">Assigned Reviewer</h3>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <ProfilePicture 
                profilePicture={thesis.supervisor.profile_picture}
                alt={thesis.supervisor.full_name || 'Supervisor'}
                size="md"
              />
              <span className="text-secondary dark:text-gray-200 font-medium">
                {thesis.supervisor.full_name || 'N/A'}
              </span>
            </div>
            {(user?.role === 'graduation_assistant' || user?.role === 'professor') && 
             user?.id === thesis.supervisor_id && (
              <button
                onClick={handleOpenReviewModal}
                className="btn-secondary"
              >
                Review Thesis
              </button>
            )}
          </div>
        </div>
      )}

      {user?.role !== 'graduation_assistant' && (
        <ThesisFileManager 
          thesisId={thesis.id} 
          currentUser={user}
          thesis={thesis}
        />
      )}

      <CommentSection
        thesisId={thesis.id}
        currentUser={user}
      />

      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Submit Review"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <Textarea
            label="Review Comments"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Enter your review comments here..."
            required
            rows={4}
          />
          <Select
            label="Preliminary Grade"
            value={reviewGrade}
            onChange={(e) => setReviewGrade(e.target.value === '' ? '' : parseInt(e.target.value))}
            options={[{ value: '', label: 'Select Grade' }, ...gradeOptions]}
            required
          />
          {reviewError && (
            <p className="text-sm text-red-600 dark:text-red-400">{reviewError}</p>
          )}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="btn-outline"
              disabled={isSubmittingReview}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ThesisPage; 