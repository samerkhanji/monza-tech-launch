import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Zap, 
  Plus, 
  Car, 
  Wrench, 
  DollarSign, 
  Users, 
  Calendar,
  BarChart3,
  Search,
  Settings,
  Clock,
  FileText,
  Smartphone,
  Activity
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  shortcut?: string;
  category: 'create' | 'navigate' | 'tools' | 'reports';
  roles?: string[];
}

const quickActions: QuickAction[] = [
  // Create Actions
  {
    id: 'new-car',
    label: 'Add New Car',
    description: 'Quick car entry to inventory',
    icon: <Car className="h-4 w-4" />,
    path: '/car-inventory',
    shortcut: 'Ctrl+N',
    category: 'create'
  },
  {
    id: 'new-repair',
    label: 'Create Repair',
    description: 'Start new repair ticket',
    icon: <Wrench className="h-4 w-4" />,
    path: '/repairs',
    shortcut: 'Ctrl+Shift+N',
    category: 'create'
  },
  {
    id: 'schedule-appointment',
    label: 'Schedule Appointment',
    description: 'Book garage slot',
    icon: null,
    path: '/garage-schedule',
    category: 'create'
  },

  // Navigate Actions
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Main overview',
    icon: <BarChart3 className="h-4 w-4" />,
    path: '/enhanced-dashboard',
    shortcut: 'Alt+D',
    category: 'navigate'
  },
  {
    id: 'inventory',
    label: 'Car Inventory',
    description: 'Vehicle management',
    icon: <Car className="h-4 w-4" />,
    path: '/car-inventory',
    shortcut: 'Alt+I',
    category: 'navigate'
  },
  {
    id: 'finances',
    label: 'Finances',
    description: 'Financial dashboard',
    icon: <DollarSign className="h-4 w-4" />,
    path: '/financial-dashboard',
    shortcut: 'Alt+F',
    category: 'navigate'
  },
  {
    id: 'employees',
    label: 'Employees',
    description: 'Staff management',
    icon: <Users className="h-4 w-4" />,
    path: '/employee-management',
    category: 'navigate',
    roles: ['OWNER', 'MANAGER']
  },

  // Tools
  {
    id: 'search',
    label: 'Global Search',
    description: 'Search anything',
    icon: <Search className="h-4 w-4" />,
    path: '#search',
    shortcut: 'Ctrl+/',
    category: 'tools'
  },
  {
    id: 'system-status',
    label: 'System Status',
    description: 'Health overview',
    icon: <Activity className="h-4 w-4" />,
    path: '/system-status',
    shortcut: 'Alt+S',
    category: 'tools'
  },
  {
    id: 'performance',
    label: 'Performance',
    description: 'Monitor metrics',
    icon: <Zap className="h-4 w-4" />,
    path: '/performance',
    shortcut: 'Alt+P',
    category: 'tools'
  },
  {
    id: 'customization',
    label: 'Customize',
    description: 'Personalize system',
    icon: <Settings className="h-4 w-4" />,
    path: '/customization',
    shortcut: 'Alt+C',
    category: 'tools'
  },

  // Reports
  {
    id: 'reports',
    label: 'Reports',
    description: 'Generate reports',
    icon: <FileText className="h-4 w-4" />,
    path: '/reports',
    category: 'reports'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Business insights',
    icon: <BarChart3 className="h-4 w-4" />,
    path: '/analytics',
    category: 'reports'
  }
];

export function QuickActionsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [recentActions, setRecentActions] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Load recent actions from localStorage
    const recent = localStorage.getItem('monza-recent-actions');
    if (recent) {
      setRecentActions(JSON.parse(recent));
    }

    // Hide/show based on scroll (optional)
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY <= lastScrollY || currentScrollY < 100);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAction = (action: QuickAction) => {
    if (action.path === '#search') {
      // Trigger global search
      const event = new CustomEvent('global-search');
      window.dispatchEvent(event);
    } else {
      navigate(action.path);
      
      // Update recent actions
      const newRecent = [action.id, ...recentActions.filter(id => id !== action.id)].slice(0, 5);
      setRecentActions(newRecent);
      localStorage.setItem('monza-recent-actions', JSON.stringify(newRecent));
    }
    setIsOpen(false);
  };

  const filterActionsByRole = (actions: QuickAction[]) => {
    return actions.filter(action => 
      !action.roles || action.roles.includes(user?.role || 'USER')
    );
  };

  const getActionsByCategory = (category: string) => {
    return filterActionsByRole(quickActions.filter(action => action.category === category));
  };

  const getRecentActionsData = () => {
    return recentActions
      .map(id => quickActions.find(action => action.id === id))
      .filter(Boolean) as QuickAction[];
  };

  const categoryIcons = {
    create: <Plus className="h-4 w-4" />,
    navigate: <Smartphone className="h-4 w-4" />,
    tools: <Settings className="h-4 w-4" />,
    reports: <FileText className="h-4 w-4" />
  };

  const categoryColors = {
    create: 'bg-green-500 hover:bg-green-600',
    navigate: 'bg-blue-500 hover:bg-blue-600',
    tools: 'bg-purple-500 hover:bg-purple-600',
    reports: 'bg-orange-500 hover:bg-orange-600'
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            title="Quick Actions (Power User Panel)"
          >
            <Zap className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-96 p-0" 
          side="right" 
          align="end"
          sideOffset={10}
        >
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Quick Actions
              </h3>
              <Badge variant="outline" className="text-xs">
                {user?.role}
              </Badge>
            </div>

            {/* Recent Actions */}
            {recentActions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent
                </h4>
                <div className="grid grid-cols-1 gap-1">
                  {getRecentActionsData().slice(0, 3).map((action) => (
                    <Button
                      key={action.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAction(action)}
                      className="justify-start h-8 text-xs"
                    >
                      {action.icon}
                      <span className="ml-2">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Categories */}
            <div className="space-y-3">
              {(['create', 'navigate', 'tools', 'reports'] as const).map((category) => {
                const actions = getActionsByCategory(category);
                if (actions.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-600 flex items-center gap-2 capitalize">
                      {categoryIcons[category]}
                      {category}
                    </h4>
                    <div className="grid grid-cols-1 gap-1">
                      {actions.map((action) => (
                        <div key={action.id} className="group">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(action)}
                            className="w-full justify-start h-auto p-2 text-left"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <div className={`p-1 rounded ${categoryColors[category]} text-white group-hover:scale-110 transition-transform`}>
                                {action.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-sm">{action.label}</span>
                                  {action.shortcut && (
                                    <Badge variant="outline" className="text-xs font-mono">
                                      {action.shortcut}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                  {action.description}
                                </p>
                              </div>
                            </div>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer tip */}
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 text-center">
                💡 Press <Badge variant="outline" className="font-mono text-xs">Alt + H</Badge> for all keyboard shortcuts
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
