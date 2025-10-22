import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
// import TermsAgreementDialog from '@/components/TermsAgreementDialog'; // Disabled
import ErrorBoundary from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
// import SmartMonzaBotInterface from '@/components/SmartMonzaBotInterface'; // Removed per user request
// import { useTermsAgreement } from '@/hooks/useTermsAgreement'; // Temporarily disabled
// import { useActivityTracking } from '@/hooks/useActivityTracking'; // Temporarily disabled

const Layout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile); // open on desktop, closed on mobile
  
  // Debug log state changes
  console.log('🔍 Layout state - sidebarOpen:', sidebarOpen, 'isMobile:', isMobile);
  const location = useLocation();
  
  // Chat state management
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Terms agreement functionality - DISABLED
  const showTermsDialog = false;
  const termsLoading = false;
  const termsChecking = false;

  // Activity tracking - DISABLED
  
  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Update sidebar state when screen size changes
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  // Anti-ghosting prevention
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const overlays = Array.from(document.querySelectorAll('[data-radix-dialog-overlay], .fixed.inset-0.bg-black, .fixed.inset-0.bg-black\\/50, .fixed.inset-0.bg-black\\/70')) as HTMLElement[];
        const hasDialog = !!document.querySelector('[role="dialog"]');
        if (!hasDialog) overlays.forEach((el) => (el.style.display = 'none'));
      } catch {
        // no-op
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Legacy dialog cleanup
  useEffect(() => {
    try {
      const overlays = Array.from(document.querySelectorAll('[data-radix-dialog-overlay], .fixed.inset-0.bg-black, .fixed.inset-0.bg-black\\/50, .fixed.inset-0.bg-black\\/70')) as HTMLElement[];
      const hasDialog = !!document.querySelector('[role="dialog"]');
      if (!hasDialog) overlays.forEach((el) => (el.style.display = 'none'));
    } catch {
      // no-op
    }
  }, [location.pathname]);
  
  if (isLoading || termsChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-800 text-sm md:text-base">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => {
            console.log('🔧 Layout onClose called - current sidebarOpen:', sidebarOpen);
            // Force state change even if already false
            setSidebarOpen(true); // First set to true
            setTimeout(() => setSidebarOpen(false), 10); // Then immediately to false
            console.log('🔧 Layout FORCED state change: true -> false');
          }}
          isMobile={isMobile}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar onMenuClick={() => {
            console.log('Hamburger clicked - opening sidebar');
            setSidebarOpen(true);
          }} />
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 transition-all duration-300">
            <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6 max-w-7xl">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>

      {/* Terms Agreement Dialog - DISABLED */}
      
      {/* MonzaBot Interface - Removed per user request */}
      {/* <SmartMonzaBotInterface /> */}
    </ErrorBoundary>
  );
};

export default Layout;
