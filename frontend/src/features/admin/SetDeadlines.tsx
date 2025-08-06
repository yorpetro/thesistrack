import React, { useState, useEffect } from 'react';
import { deadlineService } from '../../services/deadlineService';
import { Deadline, DeadlineCreate, DeadlineType } from '../../types/deadline';

const SetDeadlines: React.FC = () => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state - only for defense deadline (others auto-calculated)
  const [formData, setFormData] = useState<DeadlineCreate>({
    title: '',
    description: '',
    deadline_date: '',
    deadline_type: 'defense' as DeadlineType,
    is_active: true,
    is_global: true,
  });

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      const data = await deadlineService.getDeadlines();
      setDeadlines(data);
    } catch (err) {
      setError('Failed to load deadlines');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline_date) {
      setError('Title and deadline date are required');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      
      const createdDeadlines = await deadlineService.createDeadline({
        ...formData,
        deadline_date: new Date(formData.deadline_date).toISOString(),
      });
      
      // Add all created deadlines (defense, submission, review) to the list
      setDeadlines([...deadlines, ...createdDeadlines]);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        deadline_date: '',
        deadline_type: 'defense' as DeadlineType,
        is_active: true,
        is_global: true,
      });
    } catch (err) {
      setError('Failed to create deadlines');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (deadlineId: string) => {
    if (!confirm('Are you sure you want to delete this deadline?')) return;
    
    try {
      await deadlineService.deleteDeadline(deadlineId);
      setDeadlines(deadlines.filter(d => d.id !== deadlineId));
    } catch (err) {
      setError('Failed to delete deadline');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeColor = (type: DeadlineType) => {
    switch (type) {
      case 'submission': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-green-100 text-green-800';
      case 'defense': return 'bg-purple-100 text-purple-800';
      case 'revision': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading deadlines...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Manage Thesis Deadlines</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Create New Defense Deadline Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Set Defense Deadline</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Automatic Deadline Creation</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>When you set a defense deadline, the system will automatically create:</p>
                <ul className="mt-1 list-disc list-inside">
                  <li><strong>Submission deadline:</strong> 1 week before defense</li>
                  <li><strong>Review deadline:</strong> 2 days before defense</li>
                  <li><strong>Defense deadline:</strong> Your specified date</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Defense Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Spring 2025 Thesis Defense"
              required
            />
          </div>

          <div>
            <label htmlFor="deadline_date" className="block text-sm font-medium text-gray-700 mb-1">
              Defense Date & Time *
            </label>
            <input
              type="datetime-local"
              id="deadline_date"
              value={formData.deadline_date}
              onChange={(e) => setFormData({ ...formData, deadline_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Must be at least 1 week in the future (to allow for submission deadline)
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Optional description or additional details"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              Active
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_global}
                onChange={(e) => setFormData({ ...formData, is_global: e.target.checked })}
                className="mr-2"
              />
              Global (applies to all students)
            </label>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? 'Creating Deadlines...' : 'Create Defense & Related Deadlines'}
          </button>
        </form>
      </div>

      {/* Existing Deadlines */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Existing Deadlines</h2>
        </div>
        
        {deadlines.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No deadlines set yet. Create your first deadline above.
          </div>
        ) : (
          <div className="divide-y">
            {deadlines.map((deadline) => (
              <div key={deadline.id} className="p-6 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium">{deadline.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(deadline.deadline_type)}`}>
                      {deadline.deadline_type}
                    </span>
                    {!deadline.is_active && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-2">
                    <strong>Due:</strong> {formatDate(deadline.deadline_date)}
                  </p>
                  
                  {deadline.description && (
                    <p className="text-gray-600 text-sm">{deadline.description}</p>
                  )}
                </div>
                
                <button
                  onClick={() => handleDelete(deadline.id)}
                  className="text-red-600 hover:text-red-800 ml-4"
                  title="Delete deadline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SetDeadlines; 