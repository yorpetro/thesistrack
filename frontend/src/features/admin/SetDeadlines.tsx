import React, { useState, useEffect } from 'react';
import { deadlineService } from '../../services/deadlineService';
import { Deadline, DeadlineCreate, DeadlineType } from '../../types/deadline';

const SetDeadlines: React.FC = () => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<DeadlineCreate>({
    title: '',
    description: '',
    deadline_date: '',
    deadline_type: 'submission' as DeadlineType,
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
      
      const newDeadline = await deadlineService.createDeadline({
        ...formData,
        deadline_date: new Date(formData.deadline_date).toISOString(),
      });
      
      setDeadlines([...deadlines, newDeadline]);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        deadline_date: '',
        deadline_type: 'submission' as DeadlineType,
        is_active: true,
        is_global: true,
      });
    } catch (err) {
      setError('Failed to create deadline');
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

      {/* Create New Deadline Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Deadline</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Thesis Submission Deadline"
                required
              />
            </div>
            
            <div>
              <label htmlFor="deadline_type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="deadline_type"
                value={formData.deadline_type}
                onChange={(e) => setFormData({ ...formData, deadline_type: e.target.value as DeadlineType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="submission">Submission</option>
                <option value="review">Review</option>
                <option value="defense">Defense</option>
                <option value="revision">Revision</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="deadline_date" className="block text-sm font-medium text-gray-700 mb-1">
              Deadline Date & Time *
            </label>
            <input
              type="datetime-local"
              id="deadline_date"
              value={formData.deadline_date}
              onChange={(e) => setFormData({ ...formData, deadline_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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
            {isCreating ? 'Creating...' : 'Create Deadline'}
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