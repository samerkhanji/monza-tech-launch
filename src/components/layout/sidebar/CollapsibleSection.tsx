
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
  headerRight?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  items,
  icon: SectionIcon,
  isExpanded,
  onToggle,
  isMobile,
  onClose,
  headerRight
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
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log(`🔽 Dropdown clicked: ${title}`);
          onToggle();
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log(`🖱️ Dropdown mouse down: ${title}`);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log(`📱 Dropdown touch start: ${title}`);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log(`📱 Dropdown touch end: ${title}`);
          onToggle();
        }}
        className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
        style={{ 
          pointerEvents: 'auto',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <SectionIcon className="mr-3 h-4 w-4" />
        <span className="flex-1 text-left flex items-center gap-2">
          {title}
          {headerRight}
        </span>
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
