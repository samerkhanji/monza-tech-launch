import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from './components/ui/loading-spinner';

// Import original pages - lazy loading for better performance
const EnhancedDashboard = lazy(() => import('@/pages/EnhancedDashboard'));
const CarInventory = lazy(() => import('@/pages/CarInventory'));
const Repairs = lazy(() => import('@/pages/Repairs'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Sales = lazy(() => import('@/pages/Sales'));
const EmployeeManagement = lazy(() => import('@/pages/EmployeeManagement'));
const GarageSchedule = lazy(() => import('@/pages/GarageSchedule'));

// Import ONLY the essential CSS
import '@/styles/emergency-click-fix.css';

// Simple loading component
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

// Working layout (copied from ultra-simple but with better styling)
const WorkingLayout = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
    {/* Sidebar */}
    <div style={{ 
      width: '260px', 
      background: '#ffffff', 
      borderRight: '1px solid #e5e7eb',
      boxShadow: '1px 0 3px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: '#FFD700', 
          padding: '12px',
          borderRadius: '6px',
          textAlign: 'center',
          fontWeight: 'bold',
          marginBottom: '24px'
        }}>
          🚗 MONZA S.A.L.
        </div>
        
        {/* Main Navigation */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#6b7280', 
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>Main</h3>
          <Link 
            to="/" 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#FFD700',
              color: '#000',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px'
            }}
            onMouseOver={(e) => e.target.style.background = '#F1C40F'}
            onMouseOut={(e) => e.target.style.background = '#FFD700'}
          >
            🏠 Dashboard
          </Link>
        </div>
        
        {/* Vehicle Section */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#6b7280', 
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>Vehicles</h3>
          <Link 
            to="/car-inventory" 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px'
            }}
            onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
            onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
          >
            🚗 Car Inventory
          </Link>
        </div>
        
        {/* Garage Section */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#6b7280', 
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>Garage</h3>
          <Link 
            to="/repairs" 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px'
            }}
            onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
            onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
          >
            🔧 Repairs
          </Link>
          <Link 
            to="/garage-schedule" 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px'
            }}
            onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
            onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
          >
            📅 Garage Schedule
          </Link>
        </div>
        
        {/* Business Section */}
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#6b7280', 
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>Business</h3>
          <Link 
            to="/sales" 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px'
            }}
            onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
            onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
          >
            💼 Sales
          </Link>
          <Link 
            to="/analytics" 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px'
            }}
            onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
            onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
          >
            📊 Analytics
          </Link>
          <Link 
            to="/employee-management" 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px'
            }}
            onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
            onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
          >
            👥 Employee Management
          </Link>
        </div>
      </div>
    </div>
    
    {/* Main content area */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ 
        height: '64px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          background: '#FFD700',
          padding: '8px 12px',
          borderRadius: '6px',
          fontWeight: 'bold',
          fontSize: '12px'
        }}>
          MONZA S.A.L.
        </div>
        
        <div style={{ 
          background: '#dcfce7',
          color: '#166534',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Samer (OWNER)
        </div>
      </header>
      
      {/* Main content */}
      <main style={{ 
        flex: 1, 
        padding: '24px',
        background: '#f9fafb',
        overflow: 'auto'
      }}>
        {children}
      </main>
    </div>
  </div>
);

function App() {
  console.log('🚀 Restored App with original pages rendering...');
  
  return (
    <Router>
      <ErrorBoundary>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={
              <WorkingLayout>
                <EnhancedDashboard />
              </WorkingLayout>
            } />
            <Route path="/car-inventory" element={
              <WorkingLayout>
                <CarInventory />
              </WorkingLayout>
            } />
            <Route path="/repairs" element={
              <WorkingLayout>
                <Repairs />
              </WorkingLayout>
            } />
            <Route path="/garage-schedule" element={
              <WorkingLayout>
                <GarageSchedule />
              </WorkingLayout>
            } />
            <Route path="/sales" element={
              <WorkingLayout>
                <Sales />
              </WorkingLayout>
            } />
            <Route path="/analytics" element={
              <WorkingLayout>
                <Analytics />
              </WorkingLayout>
            } />
            <Route path="/employee-management" element={
              <WorkingLayout>
                <EmployeeManagement />
              </WorkingLayout>
            } />
            <Route path="*" element={
              <WorkingLayout>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <h2>Page Not Found</h2>
                  <Link to="/" style={{ color: '#3b82f6' }}>← Back to Dashboard</Link>
                </div>
              </WorkingLayout>
            } />
          </Routes>
        </Suspense>
        <Toaster />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
