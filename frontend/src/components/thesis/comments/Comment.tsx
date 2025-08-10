import { useState } from 'react';
import { format } from 'date-fns';
import {
  PencilIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { ThesisComment, AuthUser } from '../../../types';
import CommentForm from './CommentForm';
import ProfilePicture from '../../common/ProfilePicture';

interface CommentProps {
  comment: ThesisComment;
  currentUser: AuthUser | null;
  replies: ThesisComment[];
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReply: (parentId: string, content: string, isApproval: boolean) => Promise<void>;
  submitting: boolean;
}

const Comment = ({
  comment,
  currentUser,
  replies,
  onEdit,
  onDelete,
  onReply,
  submitting
}: CommentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [editContent, setEditContent] = useState(comment.content);

  const handleEdit = async (content: string) => {
    await onEdit(comment.id, content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (isDeleting) {
      await onDelete(comment.id);
    }
    setIsDeleting(false);
  };

  const handleReply = async (content: string, isApproval: boolean) => {
    await onReply(comment.id, content, isApproval);
    setIsReplying(false);
    setShowReplies(true); // Show replies after adding a new one
  };

  const isAuthor = currentUser?.id === comment.user_id;
  const isParentComment = !comment.parent_id;
  const hasReplies = isParentComment && replies.length > 0;

  return (
    <div className={`${isParentComment ? 'rounded-lg border border-neutral dark:border-gray-600' : 'border-l border-neutral dark:border-gray-600 ml-8 mt-2'}`}>
      {/* Comment Header */}
      <div className="flex items-center justify-between p-4 bg-neutral/5 dark:bg-gray-700/20">
        <div className="flex items-center">
          <div className="mr-2">
            <ProfilePicture 
              profilePicture={comment.user?.profile_picture}
              alt={comment.user?.full_name || comment.user?.email || 'User'}
              size="sm"
            />
          </div>
          <span className="text-sm font-medium text-secondary dark:text-gray-200">
            {comment.user?.full_name || comment.user?.email || 'Unknown user'}
          </span>
          <span className="text-xs text-earth dark:text-gray-400 ml-2">
            {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
          </span>
        </div>
      </div>

      {/* Comment Body */}
      <div className="p-4">
        {isEditing ? (
          <div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="form-input w-full h-32 mb-3"
              placeholder="Edit your comment..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(comment.content);
                }}
                className="btn-neutral btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEdit(editContent)}
                disabled={!editContent.trim() || submitting}
                className="btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <div className="animate-spin h-3 w-3 mr-2 border-2 border-b-0 border-r-0 border-white rounded-full"></div>
                    Saving...
                  </span>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-secondary dark:text-gray-100 whitespace-pre-wrap">{comment.content}</p>
        )}
      </div>

      {/* Comment Actions */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="btn-link text-sm flex items-center"
            >
              {showReplies ? (
                <>
                  <ChevronUpIcon className="h-4 w-4 mr-1" />
                  Hide Replies
                </>
              ) : (
                <>
                  <ChevronDownIcon className="h-4 w-4 mr-1" />
                  Show Replies ({replies.length})
                </>
              )}
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isAuthor && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="btn-link text-sm"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => setIsDeleting(true)}
                className="btn-link text-sm text-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </>
          )}
          {isParentComment && !isEditing && (
            <button
              onClick={() => setIsReplying(true)}
              className="btn-link text-sm"
            >
              <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {isDeleting && (
        <div className="p-4 border-t border-neutral dark:border-gray-600">
          <p className="text-sm text-earth dark:text-gray-300 mb-3">Are you sure you want to delete this comment?</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsDeleting(false)}
              className="btn-neutral btn-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn-danger btn-sm"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Reply Form */}
      {isReplying && (
        <div className="p-4 border-t border-neutral dark:border-gray-600">
          <CommentForm
            onSubmit={handleReply}
            onCancel={() => setIsReplying(false)}
            submitting={submitting}
            isReply={true}
            placeholder="Write your reply..."
          />
        </div>
      )}

      {/* Replies */}
      {hasReplies && showReplies && (
        <div className="border-t border-neutral dark:border-gray-600">
          {replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              replies={[]}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment; 