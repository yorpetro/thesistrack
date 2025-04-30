import React, { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, id, error, className, ...props }) => {
  const baseClasses = "block w-full px-3 py-2 border border-neutral-light rounded-md shadow-sm placeholder-neutral focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:opacity-50 disabled:bg-neutral-lighter";
  const errorClasses = "border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500";
  const combinedClasses = `${baseClasses} ${error ? errorClasses : ''} ${className || ''}`;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-dark mb-1">
          {label}
        </label>
      )}
      <textarea id={id} className={combinedClasses} {...props} />
      {error && (
        <p className="mt-1 text-sm text-red-600" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Textarea; 