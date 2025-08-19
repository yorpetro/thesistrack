import React, { useEffect, useState } from 'react';
import { deadlineService } from '../../services/deadlineService';
import { DeadlineDetail, DeadlineType } from '../../types/deadline';
import { useAuthStore } from '../../stores/authStore';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

const Calendar: React.FC = () => {
  const { user } = useAuthStore();
  const [deadlines, setDeadlines] = useState<DeadlineDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeadlines();
  }, [user?.role]);

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get upcoming deadlines within next 30 days
      // Backend already filters based on user role:
      // - Students see submission and defense deadlines
      // - Assistants and professors see all deadlines
      const upcomingDeadlines = await deadlineService.getUpcomingDeadlines(30);
      
      setDeadlines(upcomingDeadlines);
    } catch (err) {
      console.error('Failed to fetch deadlines:', err);
      setError('Failed to load deadlines');
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: DeadlineType) => {
    switch (type) {
      case 'submission': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'review': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'defense': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      case 'revision': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getUrgencyIndicator = (daysRemaining: number | null | undefined) => {
    if (daysRemaining === null || daysRemaining === undefined) return null;
    
    if (daysRemaining < 0) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
    } else if (daysRemaining <= 3) {
      return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />;
    } else if (daysRemaining <= 7) {
      return <ClockIcon className="h-4 w-4 text-yellow-500" />;
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysRemainingText = (daysRemaining: number | null | undefined) => {
    if (daysRemaining === null || daysRemaining === undefined) return '';
    
    if (daysRemaining < 0) {
      return `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''}`;
    } else if (daysRemaining === 0) {
      return 'Due today';
    } else if (daysRemaining === 1) {
      return 'Due tomorrow';
    } else {
      return `${daysRemaining} days left`;
    }
  };

  // Get critical notifications for immediate attention
  const getCriticalNotifications = () => {
    const criticalDeadlines = deadlines.filter(deadline => {
      const daysRemaining = deadline.days_remaining;
      if (daysRemaining === null || daysRemaining === undefined) return false;
      
      // Critical: Due today, overdue, or within critical timeframes based on user role
      if (daysRemaining <= 0) return true; // Overdue
      if (daysRemaining === 1) return true; // Due tomorrow
      
      // Role-specific critical timeframes
      if (deadline.deadline_type === 'submission' && user?.role === 'student' && daysRemaining <= 3) {
        return true;
      }
      if (deadline.deadline_type === 'review' && user?.role === 'graduation_assistant' && daysRemaining <= 1) {
        return true;
      }
      
      return false;
    });

    return criticalDeadlines.slice(0, 2); // Show max 2 critical notifications
  };

  const getBusinessLogicMessage = (deadline: DeadlineDetail) => {
    const daysRemaining = deadline.days_remaining;
    if (daysRemaining === null || daysRemaining === undefined) return null;

    // Business Logic: Students have 1 week to submit, Assistants have 3 days before deadline to review
    if (deadline.deadline_type === 'submission' && user?.role === 'student') {
      if (daysRemaining <= 7 && daysRemaining > 0) {
        const urgency = daysRemaining <= 3 ? 'urgent' : 'reminder';
        return (
          <div className={`text-xs mt-1 ${urgency === 'urgent' ? 'text-red-600' : 'text-orange-600'}`}>
            📝 {urgency === 'urgent' ? 'URGENT:' : ''} Submit your thesis within {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
          </div>
        );
      } else if (daysRemaining <= 0) {
        return (
          <div className="text-xs text-red-600 mt-1">
            ⚠️ Submission deadline has passed
          </div>
        );
      }
    } else if (deadline.deadline_type === 'review' && user?.role === 'graduation_assistant') {
      if (daysRemaining <= 3 && daysRemaining > 0) {
        return (
          <div className="text-xs text-blue-600 mt-1">
            👨‍🏫 Complete thesis reviews within {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
          </div>
        );
      } else if (daysRemaining <= 0) {
        return (
          <div className="text-xs text-red-600 mt-1">
            ⚠️ Review deadline has passed
          </div>
        );
      }
    } else if (deadline.deadline_type === 'defense') {
      // Defense deadlines are relevant to all roles
      if (daysRemaining <= 7 && daysRemaining > 0) {
        let message = '';
        if (user?.role === 'student') {
          message = '🎓 Prepare for your thesis defense';
        } else if (user?.role === 'graduation_assistant') {
          message = '📋 Review materials for upcoming defense';
        } else if (user?.role === 'professor') {
          message = '🏛️ Thesis defense scheduled';
        }
        return (
          <div className="text-xs text-purple-600 mt-1">
            {message}
          </div>
        );
      }
    } else if (deadline.deadline_type === 'revision' && user?.role === 'student') {
      if (daysRemaining <= 5 && daysRemaining > 0) {
        return (
          <div className="text-xs text-amber-600 mt-1">
            ✏️ Submit thesis revisions within {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
          </div>
        );
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 dark:text-red-400 text-sm p-4">
        {error}
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 p-6">
        <CalendarDaysIcon className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
        <p className="text-sm">No upcoming deadlines</p>
      </div>
    );
  }

  const criticalNotifications = getCriticalNotifications();

  return (
    <div className="space-y-3">
      {/* Critical Notifications */}
      {criticalNotifications.length > 0 && (
        <div className="space-y-2 mb-4">
          {criticalNotifications.map((deadline) => (
            <div key={`critical-${deadline.id}`} className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-4 w-4 text-red-500 dark:text-red-400 mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300 truncate">
                    {deadline.title}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {deadline.days_remaining !== null && deadline.days_remaining !== undefined && deadline.days_remaining <= 0 
                      ? 'OVERDUE' 
                      : deadline.days_remaining === 1 
                      ? 'DUE TOMORROW'
                      : deadline.days_remaining !== null && deadline.days_remaining !== undefined
                      ? `${deadline.days_remaining} DAYS LEFT`
                      : 'DUE DATE UNKNOWN'
                    }
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {deadlines.map((deadline) => (
        <div 
          key={deadline.id} 
          className={`rounded-lg p-3 border-l-4 ${
            deadline.days_remaining !== null && deadline.days_remaining !== undefined && deadline.days_remaining <= 3 
              ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' 
              : deadline.days_remaining !== null && deadline.days_remaining !== undefined && deadline.days_remaining <= 7
              ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : 'border-l-gray-300 dark:border-l-gray-600 bg-gray-50 dark:bg-gray-800'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {deadline.title}
              </h4>
              <div className="flex items-center mt-1 space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getTypeColor(deadline.deadline_type)}`}>
                  {deadline.deadline_type}
                </span>
                {getUrgencyIndicator(deadline.days_remaining)}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 dark:text-gray-300">
            <div className="flex justify-between items-center">
              <span>{formatDate(deadline.deadline_date)}</span>
              <span>{formatTime(deadline.deadline_date)}</span>
            </div>
            
            {/* Display location for defense deadlines */}
            {deadline.deadline_type === 'defense' && deadline.location && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{deadline.location}</span>
              </div>
            )}
            
            {deadline.days_remaining !== null && deadline.days_remaining !== undefined && (
              <div className={`mt-1 font-medium ${
                deadline.days_remaining < 0 ? 'text-red-600 dark:text-red-400' :
                deadline.days_remaining <= 3 ? 'text-orange-600 dark:text-orange-400' :
                deadline.days_remaining <= 7 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {getDaysRemainingText(deadline.days_remaining)}
              </div>
            )}
            
            {getBusinessLogicMessage(deadline)}
          </div>
          
          {deadline.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
              {deadline.description}
            </p>
          )}
        </div>
      ))}
      
      {user?.role === 'professor' && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <a 
            href="/admin/set-deadlines" 
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            Manage Deadlines →
          </a>
        </div>
      )}
    </div>
  );
};

export default Calendar; 