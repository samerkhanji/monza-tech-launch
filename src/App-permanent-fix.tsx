import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from './components/ui/loading-spinner';
import { MockAuthProvider } from '@/contexts/AuthContext';

// Import the fixed CSS files
import '@/styles/z-index.css';
import '@/styles/emergency-click-fix.css';

// Import pages that we've fixed
const EnhancedDashboard = lazy(() => import('@/pages/EnhancedDashboard'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));

// Loading fallback
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

// Overlay neutralizer - removes any blocking overlays
const useOverlayNeutralizer = () => {
  useEffect(() => {
    console.log('🔧 Overlay neutralizer starting...');
    
    const neutralizeOverlays = () => {
      // Kill obvious portals/overlays
      ['modals-root', 'radix-portal', 'drawer-root', 'toast-root'].forEach(id => {
        const n = document.getElementById(id);
        if (n && !n.hasChildNodes()) { // Only if empty
          n.style.pointerEvents = 'none';
          n.style.zIndex = '0';
          n.style.position = 'static';
          n.style.removeProperty('inset');
        }
      });

      // Find any full-screen overlays that are blocking clicks
      [...document.querySelectorAll('*')].forEach(n => {
        const el = n as HTMLElement;
        const s = getComputedStyle(el);
        const isFixed = s.position === 'fixed';
        const isFullScreen = s.inset === '0px' || (el.offsetWidth >= window.innerWidth && el.offsetHeight >= window.innerHeight);
        const hasHighZIndex = parseInt(s.zIndex || '0', 10) >= 1000;
        const isBlocking = s.pointerEvents !== 'none';
        
        if (isFixed && isFullScreen && hasHighZIndex && isBlocking) {
          // Check if it's actually empty or just a backdrop
          const hasRealContent = el.children.length > 0 && 
            Array.from(el.children).some(child => {
              const childStyle = getComputedStyle(child as HTMLElement);
              return childStyle.display !== 'none' && childStyle.visibility !== 'hidden';
            });
          
          if (!hasRealContent) {
            console.log('🚨 Neutralizing blocking overlay:', el);
            el.style.pointerEvents = 'none';
            el.style.zIndex = '0';
          }
        }
      });
    };
    
    // Run immediately
    neutralizeOverlays();
    
    // Run after DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(neutralizeOverlays, 10);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    // Run periodically as backup
    const interval = setInterval(neutralizeOverlays, 5000);
    
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);
};

function AppContent() {
  console.log('🚀 Permanent Fix App rendering...');
  useOverlayNeutralizer();

  return (
    <ErrorBoundary>
      <MockAuthProvider>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<EnhancedDashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="enhanced-dashboard" element={<EnhancedDashboard />} />
              <Route path="*" element={
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <h2>Page Not Found</h2>
                  <p>The requested page doesn't exist.</p>
                  <a href="/" style={{ color: '#007bff' }}>← Back to Dashboard</a>
                </div>
              } />
            </Route>
          </Routes>
        </Suspense>
        <Toaster />
      </MockAuthProvider>
    </ErrorBoundary>
  );
}

function App() {
  console.log('🚀 Permanent Fix Monza TECH App starting...');
  
  // Force body-level fixes immediately
  React.useLayoutEffect(() => {
    document.body.style.setProperty('pointer-events', 'auto', 'important');
    document.body.style.setProperty('cursor', 'auto', 'important');
    
    // Ensure modals-root is inert by default
    const modalsRoot = document.getElementById('modals-root');
    if (modalsRoot) {
      modalsRoot.style.position = 'static';
      modalsRoot.style.pointerEvents = 'none';
      modalsRoot.style.zIndex = '0';
    }
  }, []);
  
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default App;
