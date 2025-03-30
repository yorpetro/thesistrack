import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CommentFormProps {
  onSubmit: (content: string, isApproval: boolean) => Promise<void>;
  onCancel?: () => void;
  isReply?: boolean;
  submitting?: boolean;
  placeholder?: string;
  initialContent?: string;
}

const CommentForm = ({
  onSubmit,
  onCancel,
  isReply = false,
  submitting = false,
  placeholder = 'Write your comment...',
  initialContent = ''
}: CommentFormProps) => {
  const [content, setContent] = useState(initialContent);
  const [isApproval, setIsApproval] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    await onSubmit(content, isApproval);
    setContent('');
    setIsApproval(false);
  };

  return (
    <div className="border border-neutral rounded-custom overflow-hidden">
      <div className="bg-neutral-light p-2 px-4 border-b border-neutral text-sm text-earth flex justify-between items-center">
        <span>{isReply ? 'Reply to comment' : 'Write a comment'}</span>
        {onCancel && (
          <button 
            onClick={onCancel}
            className="text-earth hover:text-secondary"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="form-input w-full h-32 mb-3"
          placeholder={placeholder}
        />
        <div className="flex justify-between items-center">
          {!isReply && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`approve-${isReply ? 'reply' : 'comment'}`}
                checked={isApproval}
                onChange={(e) => setIsApproval(e.target.checked)}
                className="mr-2 h-4 w-4 text-primary focus:ring-primary border-neutral rounded"
              />
              <label htmlFor={`approve-${isReply ? 'reply' : 'comment'}`} className="text-sm text-earth">
                Mark as approval
              </label>
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className={`btn-primary ${isReply ? 'btn-sm' : ''} disabled:opacity-50 disabled:cursor-not-allowed ${!isReply ? 'ml-auto' : ''}`}
          >
            {submitting ? (
              <span className="flex items-center">
                <div className={`animate-spin ${isReply ? 'h-3 w-3' : 'h-4 w-4'} mr-2 border-2 border-b-0 border-r-0 border-white rounded-full`}></div>
                Submitting...
              </span>
            ) : (
              isReply ? 'Reply' : 'Comment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentForm; 