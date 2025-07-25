import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTutorial } from '@/contexts/TutorialContext';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/ui/notification-bell';
import Logo from '@/components/ui/logo';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { Menu, GraduationCap } from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { startTutorial } = useTutorial();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-monza-grey/10 bg-white shadow-sm">
      <div className="container flex h-16 md:h-16 items-center justify-between px-3 md:px-4">
        <div className="flex items-center gap-2 md:gap-3">
          {user && onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden p-2 h-10 w-10"
            >
              <Menu className="h-6 w-6" />
            </Button>
          )}
          <Logo size="sm" className="py-1" />
        </div>
        
        {user && (
          <div className="flex items-center gap-2 md:gap-4">
            {/* User Role Indicator */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {user.name} ({user.role?.toUpperCase()})
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={startTutorial}
              className="p-2 h-10 w-10 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Start Employee Training"
            >
              <GraduationCap className="h-5 w-5" />
            </Button>
            <NotificationBell />
            <PWAInstallButton />
            <div className="text-xs md:text-sm hidden sm:block max-w-[120px] md:max-w-none truncate">
              <span className="text-monza-grey mr-1 md:mr-2">Welcome,</span>
              <span className="font-medium text-monza-black">{user.name}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              size="sm"
              className="border-monza-yellow hover:bg-monza-yellow/10 text-monza-black text-xs md:text-sm px-3 md:px-4 py-2 h-10"
            >
              <span className="hidden sm:inline">Logout</span>
              <span className="sm:hidden">Exit</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
