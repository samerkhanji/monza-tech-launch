import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`${className} ${sizes[size]} flex items-center justify-center`}>
      <div className="bg-monza-yellow rounded-lg px-3 py-1 flex items-center justify-center min-w-fit whitespace-nowrap">
        <span className={`text-monza-black font-bold ${textSizes[size]}`}>MONZA S.A.L.</span>
      </div>
    </div>
  );
};

export default Logo;
