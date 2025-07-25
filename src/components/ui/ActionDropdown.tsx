import React from 'react';

interface ActionOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ActionDropdownProps {
  options: ActionOption[];
  onAction: (action: string) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({
  options,
  onAction,
  className = '',
  disabled = false,
  ariaLabel = 'Actions'
}) => {
  return (
    <div className="relative">
      <select
        onChange={(e) => {
          const action = e.target.value;
          if (action) {
            onAction(action);
            e.target.value = '';
          }
        }}
        disabled={disabled}
        className={`w-28 h-9 px-3 border-2 border-gray-300 rounded-lg bg-white cursor-pointer text-sm font-medium hover:bg-gray-50 hover:border-monza-yellow focus:ring-2 focus:ring-monza-yellow focus:border-monza-yellow transition-all duration-200 shadow-sm ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
        style={{ 
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 8px center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '20px'
        }}
        aria-label={ariaLabel}
      >
        <option value="">Actions</option>
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ActionDropdown; 