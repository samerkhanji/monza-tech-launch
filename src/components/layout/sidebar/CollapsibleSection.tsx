
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  ownerOnly?: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  items: NavItem[];
  icon: any;
  isExpanded: boolean;
  onToggle: () => void;
  isMobile: boolean;
  onClose: () => void;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  items,
  icon: SectionIcon,
  isExpanded,
  onToggle,
  isMobile,
  onClose
}) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  // Launch 1.0: Show all items to everyone (owner restrictions removed)
  const filteredItems = items;
  
  if (filteredItems.length === 0) return null;

  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
      >
        <SectionIcon className="mr-3 h-4 w-4" />
        <span className="flex-1 text-left">{title}</span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      
      {isExpanded && (
        <div className="ml-6 space-y-1">
          {filteredItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => isMobile && onClose()}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive(item.href)
                  ? 'bg-monza-yellow text-monza-black'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
