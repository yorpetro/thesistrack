import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  getCurrentUser, 
  updateCurrentUser, 
  uploadProfilePicture, 
  deleteProfilePicture 
} from '../services/userService';
import { User } from '../types';
import { 
  UserCircleIcon,
  CameraIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user: authUser, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    bio: ''
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const userData = await getCurrentUser();
        setUser(userData);
        setFormData({
          full_name: userData.full_name || '',
          bio: userData.bio || ''
        });
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      
      const updateData = {
        full_name: formData.full_name,
        bio: formData.bio,
      };
      
      const updatedUser = await updateCurrentUser(updateData);
      setUser(updatedUser);
      
      // Update auth store
      updateUser(updatedUser);
      
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Maximum size is 5MB.');
      return;
    }

    try {
      setUploadingImage(true);
      setError(null);
      
      const updatedUser = await uploadProfilePicture(file);
      setUser(updatedUser);
      updateUser(updatedUser);
      
      setSuccess('Profile picture updated successfully!');
    } catch (err: any) {
      console.error('Profile picture upload error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) return;

    try {
      setUploadingImage(true);
      setError(null);
      
      const updatedUser = await deleteProfilePicture();
      setUser(updatedUser);
      updateUser(updatedUser);
      
      setSuccess('Profile picture deleted successfully!');
    } catch (err: any) {
      console.error('Profile picture delete error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to delete profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const getProfileImageUrl = (profilePicture: string | null) => {
    if (!profilePicture) return null;
    // Use the profile picture serving endpoint
    return `http://localhost:8000/api/v1/users/profile-picture/${profilePicture}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="card text-center text-red-500">
        <p>Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-secondary">Profile Settings</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="card">
        <h2 className="text-lg font-semibold text-secondary mb-4">Profile Picture</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            {user.profile_picture ? (
              <img
                src={getProfileImageUrl(user.profile_picture)}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <UserCircleIcon className="w-24 h-24 text-gray-400" />
            )}
            {uploadingImage && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <CameraIcon className="h-4 w-4" />
              {user.profile_picture ? 'Change Picture' : 'Upload Picture'}
            </button>
            
            {user.profile_picture && (
              <button
                onClick={handleDeleteImage}
                disabled={uploadingImage}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ml-2"
              >
                <TrashIcon className="h-4 w-4" />
                Delete Picture
              </button>
            )}
            
            <p className="text-sm text-gray-500">
              Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Information Form */}
      <div className="card">
        <h2 className="text-lg font-semibold text-secondary mb-4">Profile Information</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>



          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Tell us a bit about yourself..."
            />
          </div>



          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
