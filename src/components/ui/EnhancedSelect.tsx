import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface EnhancedSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: EnhancedSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  maxHeight?: number;
  searchable?: boolean;
  multiple?: boolean;
  values?: string[];
  onValuesChange?: (values: string[]) => void;
}

const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  itemClassName,
  maxHeight = 300,
  searchable = false,
  multiple = false,
  values = [],
  onValuesChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    searchable ? option.label.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );

  // Get selected option(s)
  const selectedOptions = multiple 
    ? options.filter(option => values.includes(option.value))
    : options.filter(option => option.value === value);

  const selectedLabels = selectedOptions.map(option => option.label).join(', ');

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
            const option = filteredOptions[highlightedIndex];
            if (!option.disabled) {
              handleOptionSelect(option.value);
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
        case 'Tab':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredOptions, highlightedIndex]);

  // Handle scroll wheel
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isOpen || !contentRef.current) return;

      const content = contentRef.current;
      const isAtTop = content.scrollTop === 0;
      const isAtBottom = content.scrollTop + content.clientHeight >= content.scrollHeight;

      // Prevent default scroll if we're at the boundaries
      if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
        e.preventDefault();
      }
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener('wheel', handleWheel, { passive: false });
      return () => content.removeEventListener('wheel', handleWheel);
    }
  }, [isOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [isOpen, searchable]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && 
        !triggerRef.current.contains(e.target as Node) &&
        contentRef.current && 
        !contentRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleOptionSelect = (optionValue: string) => {
    if (multiple) {
      const newValues = values.includes(optionValue)
        ? values.filter(v => v !== optionValue)
        : [...values, optionValue];
      onValuesChange?.(newValues);
    } else {
      onValueChange?.(optionValue);
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  };

  const handleTriggerClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-none border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          triggerClassName
        )}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        <span className="truncate">
          {selectedLabels || placeholder}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 opacity-50 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div
          ref={contentRef}
          className={cn(
            "absolute top-full left-0 right-0 z-50 mt-1 max-h-96 min-w-[8rem] overflow-hidden rounded-none border bg-white text-popover-foreground shadow-md",
            contentClassName
          )}
          style={{
            maxHeight: `${maxHeight}px`,
            scrollBehavior: 'smooth',
            overscrollBehavior: 'contain',
            scrollSnapType: 'y proximity',
            WebkitOverflowScrolling: 'touch',
            transform: 'translateZ(0)',
            willChange: 'transform',
            backgroundColor: 'white'
          }}
        >
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-border">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search options..."
                className="w-full px-2 py-1 text-sm border border-input rounded-none focus:outline-none focus:ring-2 focus:ring-ring"
                style={{
                  userSelect: 'none',
                  WebkitUserSelect: 'none'
                }}
              />
            </div>
          )}

          {/* Options List */}
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No options found
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  onClick={() => !option.disabled && handleOptionSelect(option.value)}
                  className={cn(
                    "relative flex w-full cursor-default select-none items-center rounded-none py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                    highlightedIndex === index && "bg-accent text-accent-foreground",
                    option.disabled && "opacity-50 cursor-not-allowed",
                    !option.disabled && "cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    itemClassName
                  )}
                  style={{
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    transition: 'background-color 0.15s ease, color 0.15s ease'
                  }}
                >
                  {/* Check Icon for Multiple Selection */}
                  {multiple && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {values.includes(option.value) && (
                        <Check className="h-4 w-4" />
                      )}
                    </span>
                  )}

                  {/* Check Icon for Single Selection */}
                  {!multiple && (
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      {value === option.value && (
                        <Check className="h-4 w-4" />
                      )}
                    </span>
                  )}

                  <span className="truncate">{option.label}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSelect; 