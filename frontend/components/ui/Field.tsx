import React from 'react';

interface FieldProps {
  id: string;
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ id, label, icon, required = false, className = '', children }) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 flex">
            {icon}
          </span>
        )}
        {children}
      </div>
    </div>
  );
};

export default Field;