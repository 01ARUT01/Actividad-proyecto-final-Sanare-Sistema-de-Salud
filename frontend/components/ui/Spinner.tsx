import React from 'react';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  label?: string;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ label, className = '' }) => {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      {label && <span className="text-gray-600">{label}</span>}
    </div>
  );
};

export default Spinner;