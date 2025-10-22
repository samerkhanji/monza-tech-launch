import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import Logo from '@/components/ui/logo';
import InstallAndNotifsCluster from '@/components/InstallAndNotifsCluster';
import { Menu, LogOut } from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout();
        // Don't manually navigate - let the Layout component handle the redirect
        // when it detects that user is null
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-monza-grey/10 bg-white shadow-sm">
      <div className="container flex h-16 md:h-16 items-center justify-between px-3 md:px-4">
        <div className="flex items-center gap-2 md:gap-3">
          {user && onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Hamburger button clicked');
                onMenuClick();
              }}
              className="lg:hidden p-2 h-10 w-10 hover:bg-gray-100 active:bg-gray-200 z-50 relative"
              style={{ pointerEvents: 'auto' }}
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </Button>
          )}
          <Logo size="sm" className="py-1" />
        </div>
        
                         {user && (
                   <div className="flex items-center gap-2 md:gap-4">
                     {/* Install App + Notification Bells Cluster */}
                     <InstallAndNotifsCluster />
                     
                     {/* Logout Button */}
                     <Button 
                       variant="outline" 
                       onClick={handleLogout} 
                       size="sm"
                       className="border-monza-yellow hover:bg-monza-yellow/10 text-monza-black text-xs md:text-sm px-3 md:px-4 py-2 h-10 flex items-center gap-2"
                     >
                       <LogOut className="h-4 w-4" />
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
