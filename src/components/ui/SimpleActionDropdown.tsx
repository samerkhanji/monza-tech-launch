import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ChevronDown } from 'lucide-react';

interface ActionOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface SimpleActionDropdownProps {
  options: ActionOption[];
  onAction: (action: string) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  variant?: 'dots' | 'button';
  size?: 'sm' | 'md';
}

const SimpleActionDropdown: React.FC<SimpleActionDropdownProps> = ({
  options,
  onAction,
  className = '',
  disabled = false,
  ariaLabel = 'Actions',
  id,
  variant = 'dots',
  size = 'sm'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleAction = (actionValue: string) => {
    onAction(actionValue);
    setIsOpen(false);
  };

  const iconSizeClasses = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        variant="ghost"
        size={size}
        className={variant === 'dots' ? 'h-8 w-8 p-0' : 'h-8 px-3'}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={disabled}
        id={id}
        aria-label={ariaLabel}
      >
        {variant === 'dots' ? (
          <MoreHorizontal className={iconSizeClasses} />
        ) : (
          <>
            <span>Actions</span>
            <ChevronDown className={`${iconSizeClasses} ml-1`} />
          </>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[160px]">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center transition-colors ${
                  option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!option.disabled) {
                    handleAction(option.value);
                  }
                }}
                disabled={option.disabled}
              >
                {option.icon && <span className="mr-2">{option.icon}</span>}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleActionDropdown;