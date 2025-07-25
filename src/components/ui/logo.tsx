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

  return (
    <div className={`${className} ${sizes[size]} flex items-center justify-center`}>
      <div className="relative w-full h-full">
        <div className="absolute inset-0 bg-monza-yellow rounded-lg flex items-center justify-center">
          <span className="text-monza-black font-bold text-xl">M</span>
        </div>
      </div>
    </div>
  );
};

export default Logo;
