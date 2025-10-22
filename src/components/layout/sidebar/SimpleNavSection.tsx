
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Temporarily disabled
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  ownerOnly?: boolean;
}

interface SimpleNavSectionProps {
  title: string;
  items: NavItem[];
  isMobile: boolean;
  onClose: () => void;
}

const SimpleNavSection: React.FC<SimpleNavSectionProps> = ({
  title,
  items,
  isMobile,
  onClose
}) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="space-y-1">
      <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {title}
      </h3>
      {items
        // Launch 1.0: Show all items to everyone (owner restrictions removed)
      // .filter(item => !item.ownerOnly || user?.role === 'owner')
        .map((item) => (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => isMobile && onClose()}
            className={cn(
              'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
              isActive(item.href)
                ? 'bg-monza-yellow text-monza-black'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <item.icon className="mr-3 h-4 w-4" />
            {item.label}
          </Link>
        ))}
    </div>
  );
};

export default SimpleNavSection;
