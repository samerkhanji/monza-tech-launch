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
      {/* Calendar frame */}
      <path d="M3 4h18c1.1 0 2 0.9 2 2v14c0 1.1-0.9 2-2 2H3c-1.1 0-2-0.9-2-2V6c0-1.1 0.9-2 2-2z" />
      
      {/* Top rings */}
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      
      {/* Header line */}
      <path d="M1 9h22" />
      
      {/* Calendar grid */}
      <rect x="4" y="11" width="2" height="2" fill="currentColor" />
      <rect x="8" y="11" width="2" height="2" fill="currentColor" />
      <rect x="12" y="11" width="2" height="2" fill="currentColor" />
      <rect x="16" y="11" width="2" height="2" fill="currentColor" />
      
      <rect x="4" y="15" width="2" height="2" fill="currentColor" />
      <rect x="8" y="15" width="2" height="2" fill="currentColor" />
      <rect x="12" y="15" width="2" height="2" fill="currentColor" />
      <rect x="16" y="15" width="2" height="2" fill="currentColor" />
      
      <rect x="4" y="19" width="2" height="2" fill="currentColor" />
      <rect x="8" y="19" width="2" height="2" fill="currentColor" />
      <rect x="12" y="19" width="2" height="2" fill="currentColor" />
      
      {/* Torn corner effect */}
      <path d="M17 19l2-2v2z" fill="currentColor" />
    </svg>
  );
};

export default CustomCalendarIcon; 