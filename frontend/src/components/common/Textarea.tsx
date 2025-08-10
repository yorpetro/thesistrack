import React, { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, error, className, ...props }) => {
  const baseClasses = "block w-full px-3 py-2 border border-neutral-light dark:border-gray-600 rounded-md shadow-sm placeholder-neutral dark:placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50 disabled:bg-neutral-lighter dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";
  const errorClasses = "border-red-500 dark:border-red-400 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-400 focus:ring-red-500 focus:border-red-500";
  const combinedClasses = `${baseClasses} ${error ? errorClasses : ''} ${className || ''}`;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-dark dark:text-gray-200 mb-1">
          {label}
        </label>
      )}
      <textarea id={id} className={combinedClasses} {...props} />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Textarea; 