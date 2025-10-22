import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';

// Import ONLY the emergency CSS
import '@/styles/emergency-click-fix.css';

// Simple test page that doesn't use any auth
function SimpleDashboard() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚗 Monza TECH Dashboard</h1>
        <p className="text-gray-600">Welcome to your complete automotive management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cars</p>
              <p className="text-2xl font-bold text-gray-900">124</p>
            </div>
            <div className="text-blue-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Repairs</p>
              <p className="text-2xl font-bold text-gray-900">18</p>
            </div>
            <div className="text-green-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Schedule</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div className="text-orange-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$48.2K</p>
            </div>
            <div className="text-purple-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">🚗</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">New car added to inventory</p>
                <p className="text-xs text-gray-500">2024 BMW X5 - VIN: 1234567890</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-medium">🔧</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Repair completed</p>
                <p className="text-xs text-gray-500">BMW X3 brake service finished</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 text-sm font-medium">📅</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Appointment scheduled</p>
                <p className="text-xs text-gray-500">Service appointment for tomorrow</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="text-blue-600 mb-2">🚗</div>
              <div className="text-sm font-medium text-gray-900">Add Car</div>
              <div className="text-xs text-gray-500">Add new vehicle</div>
            </button>
            <button className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="text-green-600 mb-2">🔧</div>
              <div className="text-sm font-medium text-gray-900">New Repair</div>
              <div className="text-xs text-gray-500">Start repair ticket</div>
            </button>
            <button className="p-4 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              <div className="text-orange-600 mb-2">📅</div>
              <div className="text-sm font-medium text-gray-900">Schedule</div>
              <div className="text-xs text-gray-500">Book appointment</div>
            </button>
            <button className="p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="text-purple-600 mb-2">📊</div>
              <div className="text-sm font-medium text-gray-900">Reports</div>
              <div className="text-xs text-gray-500">View analytics</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add comprehensive click fix
const useComprehensiveClickFix = () => {
  useEffect(() => {
    console.log('🔧 Comprehensive click fix initializing...');
    
    const makeEverythingClickable = () => {
      // Force all elements to be clickable
      document.querySelectorAll('*').forEach(element => {
        const el = element as HTMLElement;
        el.style.setProperty('pointer-events', 'auto', 'important');
        el.style.setProperty('cursor', 'auto', 'important');
        el.style.setProperty('user-select', 'auto', 'important');
        
        // Remove blocking attributes
        if (el.hasAttribute('inert')) el.removeAttribute('inert');
        if (el.hasAttribute('aria-hidden') && 
            (el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button')) {
          el.removeAttribute('aria-hidden');
        }
      });
      
      // Force body and html
      document.body.style.setProperty('pointer-events', 'auto', 'important');
      document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
    };
    
    // Run immediately and on DOM changes
    makeEverythingClickable();
    setTimeout(makeEverythingClickable, 100);
    setTimeout(makeEverythingClickable, 500);
    
    // Run periodically
    const interval = setInterval(makeEverythingClickable, 3000);
    
    // Global click listener for debugging
    document.addEventListener('click', (e) => {
      console.log('🖱️ Click detected on:', e.target);
    }, { capture: true });
    
    return () => clearInterval(interval);
  }, []);
};

// App Content with comprehensive error handling
function AppContent() {
  console.log('🚀 Working Simple App rendering...');
  useComprehensiveClickFix();

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SimpleDashboard />} />
          <Route path="dashboard" element={<SimpleDashboard />} />
          <Route path="*" element={<SimpleDashboard />} />
        </Route>
      </Routes>
      <Toaster />
    </ErrorBoundary>
  );
}

function App() {
  console.log('🚀 Working Simple Monza TECH App starting...');
  
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default App;
