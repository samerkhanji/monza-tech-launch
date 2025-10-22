import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from './components/ui/loading-spinner';

// Essential pages - imported directly to avoid lazy loading issues
import Dashboard from '@/pages/Dashboard';
import MessageCenter from '@/components/MessageCenter';
import ScanVIN from '@/pages/ScanVIN';

// Lazy load other components
const EnhancedDashboard = lazy(() => import('@/pages/EnhancedDashboard'));
const CarInventory = lazy(() => import('@/pages/CarInventory'));
const Repairs = lazy(() => import('@/pages/Repairs'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const EmployeeManagement = lazy(() => import('@/pages/EmployeeManagement'));
const GarageSchedule = lazy(() => import('@/pages/GarageSchedule'));
const Sales = lazy(() => import('@/pages/Sales'));

// Loading fallback component
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

// Simplified App Content without problematic providers
function AppContent() {
  console.log('🚀 Fixed AppContent component rendering...');

  // Minimal setup without complex services
  useEffect(() => {
    console.log('✅ Fixed app initialization complete');
  }, []);

  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<EnhancedDashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="enhanced-dashboard" element={<EnhancedDashboard />} />
            <Route path="message-center" element={<MessageCenter />} />
            <Route path="car-inventory" element={<CarInventory />} />
            <Route path="repairs" element={<Repairs />} />
            <Route path="scan-vin" element={<ScanVIN />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="employee-management" element={<EmployeeManagement />} />
            <Route path="garage-schedule" element={<GarageSchedule />} />
            <Route path="sales" element={<Sales />} />
          </Routes>
        </Routes>
      </Suspense>
      <Toaster />
    </ErrorBoundary>
  );
}

function App() {
  console.log('🚀 Fixed main App component rendering...');
  
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default App;
