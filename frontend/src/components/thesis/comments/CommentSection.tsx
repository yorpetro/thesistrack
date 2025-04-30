import { useState, useEffect } from 'react';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { ThesisComment, UserSimple, AuthUser } from '../../../types';
import { 
  getThesisComments, 
  createComment, 
  updateComment, 
  deleteComment
} from '../../../services/commentService';
import CommentForm from './CommentForm';
import Comment from './Comment';

interface CommentSectionProps {
  thesisId: string;
  currentUser: AuthUser | null;
}

const CommentSection = ({ thesisId, currentUser }: CommentSectionProps) => {
  const [comments, setComments] = useState<ThesisComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [thesisId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      const commentsData = await getThesisComments(thesisId);
      
      // Filter out top-level comments (those without parent_id)
      const parentComments = commentsData.filter(c => !c.parent_id);
      
      // The API already provides the nested replies structure, so we can use it directly
      setComments(parentComments);
    } catch (err: any) {
      console.error('Failed to load comments:', err);
      setError('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async (content: string) => {
    if (!currentUser) return;
    
    setSubmitting(true);
    setError(null);
    try {
      const newComment = await createComment(thesisId, {
        content,
        thesis_id: thesisId,
        user_id: currentUser.id
      });

      // Create the comment with the current user information
      const commentWithUser: ThesisComment = {
        ...newComment,
        user: {
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.full_name,
          role: currentUser.role
        },
        replies: [] // Initialize empty replies array for consistency
      };
      
      // Append the new comment to the end of the list
      setComments(prevComments => [...prevComments, commentWithUser]);
    } catch (err) {
      console.error('Failed to create comment:', err);
      setError('Failed to create comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string, content: string) => {
    setSubmitting(true);
    try {
      const updatedComment = await updateComment(commentId, { content });
      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, ...updatedComment };
          }
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === commentId ? { ...reply, ...updatedComment } : reply
              )
            };
          }
          return comment;
        });
      });
    } catch (err) {
      console.error('Failed to update comment:', err);
      setError('Failed to update comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments(prevComments => {
        // First check if it's a top-level comment
        if (prevComments.some(c => c.id === commentId)) {
          return prevComments.filter(c => c.id !== commentId);
        }
        
        // If not, recursively check and update replies
        return prevComments.map(comment => {
          // Check direct replies
          if (comment.replies?.some(r => r.id === commentId)) {
            return {
              ...comment,
              replies: comment.replies.filter(r => r.id !== commentId)
            };
          }
          
          // Check nested replies
          if (comment.replies?.length) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply.replies?.some(r => r.id === commentId)) {
                  return {
                    ...reply,
                    replies: reply.replies.filter(r => r.id !== commentId)
                  };
                }
                return reply;
              })
            };
          }
          
          return comment;
        });
      });
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setError('Failed to delete comment. Please try again.');
    }
  };

  const handleReplyToComment = async (parentId: string, content: string) => {
    if (!currentUser) return;
    
    setSubmitting(true);
    setError(null);
    try {
      const newReply = await createComment(thesisId, {
        content,
        thesis_id: thesisId,
        user_id: currentUser.id,
        parent_id: parentId
      });

      // Create the reply with the current user information
      const replyWithUser: ThesisComment = {
        ...newReply,
        user: {
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.full_name,
          role: currentUser.role
        },
        replies: [] // Initialize empty replies array for consistency
      };
      
      setComments(prevComments => 
        prevComments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), replyWithUser]
            };
          }
          // Also check nested replies
          if (comment.replies?.some(r => r.id === parentId)) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply.id === parentId) {
                  return {
                    ...reply,
                    replies: [...(reply.replies || []), replyWithUser]
                  };
                }
                return reply;
              })
            };
          }
          return comment;
        })
      );
    } catch (err) {
      console.error('Failed to create reply:', err);
      setError('Failed to create reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-6 text-secondary flex items-center">
        <ChatBubbleLeftIcon className="h-5 w-5 mr-2 text-primary" />
        Comments
      </h2>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-custom text-red-600">
          {error}
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-earth">
          <p>No comments yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              replies={comment.replies || []}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onReply={handleReplyToComment}
              submitting={submitting}
            />
          ))}
        </div>
      )}

      {/* New Comment Form */}
      <div className="mt-6 pt-6 border-t border-neutral">
        {!currentUser ? (
          <div className="text-center py-4 text-earth">
            <p>Please <Link to="/login" className="text-primary hover:underline">log in</Link> to leave a comment.</p>
          </div>
        ) : (
          <CommentForm
            onSubmit={handleCreateComment}
            submitting={submitting}
          />
        )}
      </div>
    </div>
  );
};

export default CommentSection; 