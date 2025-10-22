import React from 'react';

interface CustomCalendarIconProps {
  className?: string;
  size?: number;
}

export const CustomCalendarIcon: React.FC<CustomCalendarIconProps> = ({ 
  className = "h-4 w-4", 
  size = 24 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Clock icon instead of calendar */}
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  );
};

export default CustomCalendarIcon; 