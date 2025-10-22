import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ChevronDown } from 'lucide-react';
import { MoveMenuItemsLive } from '@/components/MoveMenuItemsLive';
import { MoveMenuItemsOrdered } from '@/components/MoveMenuItemsOrdered';
import type { Floor, TableContext } from '@/services/move-smart-helpers';

interface ActionOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
  icon?: React.ReactNode;
  // Smart move properties
  isMoveAction?: boolean;
  isReceiveAction?: boolean;
  carId?: string;
  currentFloor?: Floor;
  tableContext?: TableContext;
  orderedId?: string;
  receiveTo?: Floor[];
}

interface SmartActionDropdownProps {
  options: ActionOption[];
  onAction: (action: string) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  variant?: 'dots' | 'button';
  size?: 'sm' | 'md';
}

const SmartActionDropdown: React.FC<SmartActionDropdownProps> = ({
  options,
  onAction,
  className = '',
  disabled = false,
  ariaLabel = 'Actions',
  id,
  variant = 'button',
  size = 'sm'
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  // Group options by their group property
  const groupedOptions = options.reduce((acc, option) => {
    const group = option.group || 'main';
    if (!acc[group]) acc[group] = [];
    acc[group].push(option);
    return acc;
  }, {} as Record<string, ActionOption[]>);

  // Recalculate position once dropdown is rendered
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const timeout = setTimeout(() => {
        if (dropdownRef.current && buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const dropdownRect = dropdownRef.current.getBoundingClientRect();
          const dropdownHeight = dropdownRect.height || 200;
          const dropdownWidth = dropdownRect.width || 160;
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          
          // Calculate if dropdown would extend below viewport
          const wouldExtendBelow = rect.bottom + 5 + dropdownHeight > viewportHeight - 20;
          
          // Position above button if it would extend below, otherwise below
          let top = wouldExtendBelow 
            ? Math.max(10, rect.top - dropdownHeight - 5)
            : rect.bottom + 5;
          
          // Ensure dropdown doesn't go above viewport
          if (top < 10) {
            top = 10;
          }
          
          // Ensure dropdown doesn't go below viewport
          if (top + dropdownHeight > viewportHeight - 10) {
            top = viewportHeight - dropdownHeight - 10;
          }
          
          // Calculate right position
          let right = viewportWidth - rect.right;
          
          // If dropdown would extend beyond left edge, adjust
          if (rect.right - dropdownWidth < 10) {
            right = 10;
          }
          
          setDropdownPosition({
            top: Math.max(10, top),
            right: Math.max(10, Math.min(right, viewportWidth - dropdownWidth - 10))
          });
        }
      }, 10);
      
      return () => clearTimeout(timeout);
    }
  }, [isOpen, options.length]);

  // Close dropdown when clicking outside and handle scroll/resize
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // If click is inside the floating dropdown content, do nothing
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      // If click is inside the trigger container, also ignore
      if (target.closest('.portal-dropdown-container')) {
        return;
      }
      // Otherwise, close the menu
      if (isOpen) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    const handleResize = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  const handleAction = (actionValue: string) => {
    console.log('🎯 Action triggered:', actionValue);
    if (!disabled) {
      onAction(actionValue);
      setIsOpen(false);
    }
  };

  const buttonSizeClasses = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm';
  const iconSizeClasses = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className={`portal-dropdown-container ${className}`}>
      <Button 
        ref={buttonRef}
        variant="ghost" 
        size={size}
        className={variant === 'dots' ? `h-8 w-8 p-0` : buttonSizeClasses}
        onClick={(e) => {
          e.stopPropagation();
          console.log('🔘 Action button clicked, disabled:', disabled, 'isOpen:', isOpen);
          if (!disabled) {
            setIsOpen(!isOpen);
          }
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
      
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed bg-white border border-gray-300 rounded-md shadow-xl z-50 min-w-[160px] max-w-[200px] max-h-[300px] overflow-y-auto"
          style={{ 
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            zIndex: 999999
          }}
        >
          <div className="py-1">
            {/* Main options */}
            {groupedOptions.main?.map((option) => {
              // Handle smart move actions
              if (option.isMoveAction && option.carId && option.currentFloor && option.tableContext) {
                return (
                  <div key={option.value}>
                    <MoveMenuItemsLive
                      carId={option.carId}
                      currentFloor={option.currentFloor}
                      tableContext={option.tableContext}
                    />
                  </div>
                );
              }
              
              // Handle receive actions
              if (option.isReceiveAction && option.orderedId) {
                return (
                  <div key={option.value}>
                    <MoveMenuItemsOrdered
                      orderedId={option.orderedId}
                    />
                  </div>
                );
              }
              
              // Regular action button
              return (
                <button
                  key={option.value}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center transition-colors ${
                    option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  onMouseDown={(e) => {
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
              );
            })}

            {/* Other grouped options with separators */}
            {Object.entries(groupedOptions).map(([group, groupOptions]) => {
              if (group === 'main') return null;
              return (
                <div key={group}>
                  <div className="border-t border-gray-200 my-1"></div>
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {group}
                  </div>
                  {groupOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center transition-colors ${
                        option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                      onMouseDown={(e) => {
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
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SmartActionDropdown;
