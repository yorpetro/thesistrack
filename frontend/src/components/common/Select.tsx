import React, { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  label?: string;
  error?: string;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({ options, label, id, error, placeholder, className, ...props }) => {
  const baseClasses = "block w-full pl-3 pr-10 py-2 text-base border-neutral-light dark:border-gray-600 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md disabled:opacity-50 disabled:bg-neutral-lighter dark:disabled:bg-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";
  const errorClasses = "border-red-500 dark:border-red-400 text-red-900 dark:text-red-300 placeholder-red-300 dark:placeholder-red-400 focus:ring-red-500 focus:border-red-500";
  const combinedClasses = `${baseClasses} ${error ? errorClasses : ''} ${className || ''}`;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-neutral-dark dark:text-gray-200 mb-1">
          {label}
        </label>
      )}
      <select id={id} className={combinedClasses} {...props}>
        {placeholder && (
          <option value="" disabled={props.required || !props.value}> {/* Disable placeholder if required and value is empty */}
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

export default Select; 