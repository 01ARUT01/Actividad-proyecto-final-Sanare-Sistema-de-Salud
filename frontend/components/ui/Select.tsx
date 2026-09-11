import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasIcon?: boolean;
}

const Select: React.FC<SelectProps> = ({ hasIcon = false, className = '', children, ...rest }) => {
  return (
    <select
      {...rest}
      className={[
        'w-full p-3 border border-gray-300 rounded-lg bg-white',
        'focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none',
        hasIcon ? 'pl-10' : '',
        className,
      ].join(' ')}
    >
      {children}
    </select>
  );
};

export default Select;