import React from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface ProfilePictureProps {
  profilePicture?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({ 
  profilePicture, 
  alt = "Profile", 
  size = 'md', 
  className = '' 
}) => {
  const getProfileImageUrl = (profilePicture: string | null): string | null => {
    if (!profilePicture) return null;
    // Use the current origin for the API base URL in production
    const baseUrl = import.meta.env.PROD ? window.location.origin : 'http://localhost:8000';
    return `${baseUrl}/api/v1/users/profile-picture/${profilePicture}`;
  };

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const baseClasses = `${sizeClasses[size]} rounded-full object-cover`;

  if (profilePicture) {
    return (
      <img
        src={getProfileImageUrl(profilePicture)}
        alt={alt}
        className={`${baseClasses} ${className}`}
        onError={(e) => {
          // Fallback to icon if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const icon = document.createElement('div');
            icon.innerHTML = `<svg class="${baseClasses} ${className} text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`;
            parent.appendChild(icon);
          }
        }}
      />
    );
  }

  return <UserCircleIcon className={`${baseClasses} ${className} text-gray-400`} />;
};

export default ProfilePicture;
