import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from './components/ui/loading-spinner';

// Import emergency CSS only
import '@/styles/emergency-click-fix.css';

// Import the original EnhancedDashboard
const EnhancedDashboard = lazy(() => import('@/pages/EnhancedDashboard'));

// Loading fallback
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  console.log('🧪 Testing EnhancedDashboard with original Layout...');
  
  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<EnhancedDashboard />} />
            </Route>
          </Routes>
        </Suspense>
        <Toaster />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
