import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

type Variant = 'error' | 'success' | 'warning' | 'info';

interface BannerProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  error: 'bg-red-50 border-red-200 text-red-700',
  success: 'bg-green-50 border-green-200 text-green-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

const ICONS: Record<Variant, React.ReactNode> = {
  error: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
  success: <CheckCircle className="w-5 h-5 flex-shrink-0" />,
  warning: <AlertCircle className="w-5 h-5 flex-shrink-0" />,
  info: <Info className="w-5 h-5 flex-shrink-0" />,
};

const Banner: React.FC<BannerProps> = ({ variant = 'info', className = '', children }) => {
  return (
    <div className={`flex items-start gap-3 p-4 border rounded-lg ${VARIANTS[variant]} ${className}`}>
      <span className="flex-shrink-0">{ICONS[variant]}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
};

export default Banner;