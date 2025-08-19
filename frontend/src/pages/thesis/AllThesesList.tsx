import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllThesesForProfessors, updateThesis } from '../../services/thesisService';
import { getUsers } from '../../services/userService';
import { ThesisWithRelations, ThesisStatus, User } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import Modal from '../../components/common/Modal';
import { 
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  AcademicCapIcon,
  EyeIcon,
  XMarkIcon,
  ArrowUturnLeftIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

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

const AllThesesList = () => {
  const { user } = useAuthStore();
  const [theses, setTheses] = useState<ThesisWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ThesisStatus | 'all'>('all');
  const [processingTheses, setProcessingTheses] = useState<string[]>([]);
  const [reviewerModalOpen, setReviewerModalOpen] = useState(false);
  const [selectedThesisForReviewer, setSelectedThesisForReviewer] = useState<string | null>(null);
  const [availableReviewers, setAvailableReviewers] = useState<User[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<string>('');

  useEffect(() => {
    const fetchAllTheses = async () => {
      try {
        setLoading(true);
        const data = await getAllThesesForProfessors();
        setTheses(data);
      } catch (err) {
        setError('Failed to load theses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTheses();
  }, []);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const handleDeclineThesis = async (thesisId: string) => {
    if (!confirm('Are you sure you want to decline this thesis?')) return;
    
    try {
      setProcessingTheses(prev => [...prev, thesisId]);
              await updateThesis(thesisId, { status: 'declined' as ThesisStatus });
      
      // Update local state
      setTheses(prev => prev.map(thesis => 
        thesis.id === thesisId 
          ? { ...thesis, status: 'declined' as ThesisStatus }
          : thesis
      ));
    } catch (error) {
      console.error('Failed to decline thesis:', error);
      alert('Failed to decline thesis. Please try again.');
    } finally {
      setProcessingTheses(prev => prev.filter(id => id !== thesisId));
    }
  };

  const handleUndeclineThesis = async (thesisId: string) => {
    const thesis = theses.find(t => t.id === thesisId);
    if (!thesis) return;
    
    // Determine new status and reviewer based on current reviewer assignment
    const hasReviewer = thesis.supervisor_id && thesis.supervisor;
    const newStatus = hasReviewer ? 'under_review' : 'draft';
    const confirmMessage = hasReviewer 
      ? 'Are you sure you want to undecline this thesis? It will be returned to "Under Review" status since it has an assigned reviewer.'
      : 'Are you sure you want to undecline this thesis? It will be returned to "Draft" status.';
    
    if (!confirm(confirmMessage)) return;
    
    try {
      setProcessingTheses(prev => [...prev, thesisId]);
      
      // Update thesis with appropriate status and clear supervisor if no reviewer should be assigned
      const updateData: any = { status: newStatus };
      if (!hasReviewer) {
        updateData.supervisor_id = null;
      }
      
      await updateThesis(thesisId, updateData);
      
      // Update local state
      setTheses(prev => prev.map(t => 
        t.id === thesisId 
          ? { 
              ...t, 
              status: newStatus as ThesisStatus,
              supervisor_id: hasReviewer ? t.supervisor_id : null,
              supervisor: hasReviewer ? t.supervisor : null
            }
          : t
      ));
    } catch (error) {
      console.error('Failed to undecline thesis:', error);
      alert('Failed to undecline thesis. Please try again.');
    } finally {
      setProcessingTheses(prev => prev.filter(id => id !== thesisId));
    }
  };

  const handleOpenReviewerModal = async (thesisId: string) => {
    try {
      setSelectedThesisForReviewer(thesisId);
      const users = await getUsers();
      // Filter for professors and graduation assistants only
      const reviewers = users.filter(user => 
        user.role === 'professor' || user.role === 'graduation_assistant'
      );
              setAvailableReviewers(reviewers as any);
      setReviewerModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch reviewers:', error);
      alert('Failed to load reviewers. Please try again.');
    }
  };

  const handleChangeReviewer = async () => {
    if (!selectedThesisForReviewer || !selectedReviewer) return;
    
    try {
      await updateThesis(selectedThesisForReviewer, { supervisor_id: selectedReviewer });
      
      // Update local state
      const reviewer = availableReviewers.find(r => r.id === selectedReviewer);
      setTheses(prev => prev.map(thesis => 
        thesis.id === selectedThesisForReviewer 
          ? { ...thesis, supervisor_id: selectedReviewer, supervisor: reviewer }
          : thesis
      ));
      
      // Close modal and reset state
      setReviewerModalOpen(false);
      setSelectedThesisForReviewer(null);
      setSelectedReviewer('');
    } catch (error) {
      console.error('Failed to change reviewer:', error);
      alert('Failed to change reviewer. Please try again.');
    }
  };

  const handleCloseReviewerModal = () => {
    setReviewerModalOpen(false);
    setSelectedThesisForReviewer(null);
    setSelectedReviewer('');
  };

  const filteredTheses = filter === 'all' 
    ? theses 
    : theses.filter(thesis => thesis.status === filter);

  const getStatusCounts = () => {
    const counts = {
      all: theses.length,
      draft: theses.filter(t => t.status === 'draft').length,
      under_review: theses.filter(t => t.status === 'under_review').length,
      approved: theses.filter(t => t.status === 'approved').length,
      declined: theses.filter(t => t.status === 'declined').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary dark:text-gray-100">All Theses Overview</h1>
          <p className="text-earth dark:text-gray-400 mt-1">Monitor thesis statuses across all students for deadline planning</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="border-b border-neutral-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            { key: 'all' as const, label: 'All Theses', count: statusCounts.all },
            { key: 'draft' as const, label: 'Draft', count: statusCounts.draft },
            { key: 'under_review' as const, label: 'Under Review', count: statusCounts.under_review },
            { key: 'approved' as const, label: 'Approved', count: statusCounts.approved },
            { key: 'declined' as const, label: 'Declined', count: statusCounts.declined },
          ].map((tab) => (
            <button
              key={tab.key}
                              onClick={() => setFilter(tab.key as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                filter === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 rounded-full py-0.5 px-2.5 text-xs font-medium">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="card text-center text-red-500">
          <p>{error}</p>
        </div>
      ) : filteredTheses.length === 0 ? (
        <div className="card text-center p-10">
          <div className="bg-neutral/50 dark:bg-gray-700/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <DocumentTextIcon className="h-10 w-10 text-secondary dark:text-gray-300" />
          </div>
          <h2 className="text-xl font-medium text-secondary dark:text-gray-100 mb-2">No theses found</h2>
          <p className="text-earth dark:text-gray-400 mb-6">
            {filter === 'all' 
              ? 'There are currently no theses in the system.' 
              : `No theses with status "${statusLabels[filter as ThesisStatus]}" found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTheses.map((thesis) => (
            <div
              key={thesis.id}
              className="card p-6 hover:shadow-custom-lg transition-all duration-200"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[thesis.status].bg} ${statusColors[thesis.status].text}`}>
                      {statusLabels[thesis.status]}
                    </span>
                    <div className="text-sm text-gray-500">
                      Created {formatDate(thesis.created_at)}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-secondary mb-2 line-clamp-2">
                    {thesis.title}
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="h-4 w-4" />
                      <span>Student: {thesis.student?.full_name || thesis.student?.email || 'Unknown'}</span>
                    </div>
                    {thesis.supervisor && (
                      <div className="flex items-center gap-1.5">
                        <AcademicCapIcon className="h-4 w-4" />
                        <span>Supervisor: {thesis.supervisor.full_name || thesis.supervisor.email}</span>
                      </div>
                    )}
                    {thesis.defense_date && (
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Defense: {formatDate(thesis.defense_date)}</span>
                      </div>
                    )}
                  </div>
                  
                  {thesis.abstract && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {thesis.abstract}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/theses/${thesis.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors duration-200"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View Details
                  </Link>
                  
                  {/* Control Panel Actions */}
                  {thesis.status === 'declined' ? (
                    <button
                      onClick={() => handleUndeclineThesis(thesis.id)}
                      disabled={processingTheses.includes(thesis.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <ArrowUturnLeftIcon className="h-4 w-4" />
                      {processingTheses.includes(thesis.id) ? 'Processing...' : 'Undecline'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeclineThesis(thesis.id)}
                      disabled={processingTheses.includes(thesis.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      {processingTheses.includes(thesis.id) ? 'Processing...' : 'Decline'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleOpenReviewerModal(thesis.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Change Reviewer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviewer Change Modal */}
      <Modal 
        isOpen={reviewerModalOpen} 
        onClose={handleCloseReviewerModal}
        title="Change Thesis Reviewer"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a new reviewer for this thesis:
          </p>
          
          <div>
            <label htmlFor="reviewer-select" className="block text-sm font-medium text-gray-700 mb-2">
              Available Reviewers
            </label>
            <select
              id="reviewer-select"
              value={selectedReviewer}
              onChange={(e) => setSelectedReviewer(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            >
              <option value="">Select a reviewer...</option>
              {availableReviewers.map((reviewer) => (
                <option key={reviewer.id} value={reviewer.id}>
                  {reviewer.full_name || reviewer.email} ({(reviewer as any).role})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleCloseReviewerModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleChangeReviewer}
              disabled={!selectedReviewer}
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Change Reviewer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AllThesesList;
