import React, { useState } from 'react';
import { ThesisWithRelations, ThesisStatus, ReviewCreate, AuthUser } from '../../types';
import { createThesisReview, updateThesis } from '../../services/thesisService';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import Modal from '../common/Modal';
import Textarea from '../common/Textarea';
import Select from '../common/Select';

interface Props {
  thesis: ThesisWithRelations;
  user: AuthUser;
  onReviewSubmitted?: (updatedThesis: ThesisWithRelations) => void;
}

const gradeOptions = [
  { value: 2, label: '2 (Sufficient)' },
  { value: 3, label: '3 (Satisfactory)' },
  { value: 4, label: '4 (Good)' },
  { value: 5, label: '5 (Very Good)' },
  { value: 6, label: '6 (Excellent)' }
];

const ThesisReviewAssistantActions: React.FC<Props> = ({ thesis, user, onReviewSubmitted }) => {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewGrade, setReviewGrade] = useState<number | ''>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const handleOpenReviewModal = () => {
    setReviewText('');
    setReviewGrade('');
    setReviewError(null);
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!thesis.id || !reviewText || reviewGrade === '') {
      setReviewError('Please provide review text and select a grade.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      const reviewData: ReviewCreate = {
        text: reviewText,
        preliminary_evaluation: reviewGrade as number,
      };

      await createThesisReview(thesis.id, reviewData);
      const updatedThesisData = await updateThesis(thesis.id, { status: ThesisStatus.approved });
      if (onReviewSubmitted) {
        onReviewSubmitted({ ...thesis, ...updatedThesisData });
      }
      setIsReviewModalOpen(false);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (user.role !== 'graduation_assistant') return null;
  console.log(user);
  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-secondary">Assistant Actions</h3>
          <button
            onClick={handleOpenReviewModal}
            className="btn-primary inline-flex items-center"
            disabled={thesis.status === ThesisStatus.approved || thesis.status === ThesisStatus.declined}
          >
            <PencilSquareIcon className="h-5 w-5 mr-1.5" />
            Write Review
          </button>
        </div>
      </div>
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Write Thesis Review"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          {reviewError && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {reviewError}
            </div>
          )}
          <div>
            <label htmlFor="reviewText" className="block text-sm font-medium text-neutral-dark mb-1">
              Review Comments (Markdown supported)
            </label>
            <Textarea
              id="reviewText"
              value={reviewText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReviewText(e.target.value)}
              placeholder="Enter your review comments here..."
              rows={10}
              required
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="reviewGrade" className="block text-sm font-medium text-neutral-dark mb-1">
              Preliminary Evaluation Grade
            </label>
            <Select
              id="reviewGrade"
              value={reviewGrade}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReviewGrade(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
              options={gradeOptions}
              placeholder="Select a grade"
              required
              className="w-full"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="btn-secondary"
              disabled={isSubmittingReview}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmittingReview || !reviewText || reviewGrade === ''}
            >
              {isSubmittingReview ? 'Submitting...' : 'Submit Review & Approve'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default ThesisReviewAssistantActions; 