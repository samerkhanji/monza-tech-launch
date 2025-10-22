import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from './components/ui/loading-spinner';
import { EnhancedMockAuthProvider } from '@/contexts/RealAuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { CarDataProvider } from '@/contexts/CarDataContext';
import { QueryClient } from '@/contexts/QueryContext';
import { RealtimeProvider } from '@/contexts/RealtimeProvider';

// Custom hook for safer dynamic imports with retry logic
const useSafeLazyImport = (importFn: () => Promise<any>, fallbackName: string, maxRetries: number = 3) => {
  return lazy(() => {
    const attemptImport = async (retryCount: number = 0): Promise<any> => {
      try {
        console.log(`🔄 Attempting to load ${fallbackName} (attempt ${retryCount + 1}/${maxRetries + 1})`);
        return await importFn();
      } catch (error) {
        console.error(`🚨 Failed to load ${fallbackName} (attempt ${retryCount + 1}):`, error);
        
        if (retryCount < maxRetries) {
          console.log(`⏳ Retrying ${fallbackName} in 1 second...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptImport(retryCount + 1);
        }
        
        // Final failure - return fallback component
        console.error(`💥 Final failure loading ${fallbackName} after ${maxRetries + 1} attempts`);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        
        return {
          default: () => (
            <div className="flex items-center justify-center min-h-screen bg-yellow-50">
              <div className="text-center max-w-md mx-auto p-6">
                <div className="text-yellow-500 text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-semibold text-yellow-700 mb-2">Component Load Error</h2>
                <p className="text-yellow-600 mb-4">
                  Failed to load {fallbackName} after multiple attempts. Please try refreshing the page.
                </p>
                <p className="text-xs text-yellow-500 mb-4">
                  Error: {error.message}
                </p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )
        };
      }
    };
    
    return attemptImport();
  });
};

// Floating buttons removed per user request
// import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
// import { ShortcutsHelp } from '@/components/ShortcutsHelp';
// import { WelcomeTour } from '@/components/WelcomeTour';
// import { QuickActionsPanel } from '@/components/QuickActionsPanel';

// Import fixed CSS files
import '@/styles/z-index.css';
import '@/styles/emergency-click-fix.css';
import '@/styles/remove-floating-buttons.css';

// === CORE BUSINESS PAGES ===
const EnhancedDashboard = useSafeLazyImport(() => import('@/pages/EnhancedDashboard'), 'EnhancedDashboard');
const Dashboard = useSafeLazyImport(() => import('@/pages/Dashboard'), 'Dashboard');
const Login = useSafeLazyImport(() => import('@/pages/Login'), 'Login');

// === VEHICLE MANAGEMENT ===
const CarInventory = useSafeLazyImport(() => import('@/pages/CarInventory'), 'Car Inventory');
const NewCarArrivals = useSafeLazyImport(() => import('@/pages/NewCarArrivals'), 'New Car Arrivals');
const ScanVIN = useSafeLazyImport(() => import('@/pages/ScanVIN'), 'Scan VIN');
const TestDriveLogsPage = useSafeLazyImport(() => import('@/pages/TestDriveLogs'), 'Test Drive Logs');
const NewTestDrivePage = useSafeLazyImport(() => import('@/pages/test-drives/NewTestDrivePage'), 'New Test Drive');
const TestDriveScannerPage = useSafeLazyImport(() => import('@/pages/TestDriveScanner'), 'Test Drive Scanner');

// === GARAGE OPERATIONS ===
const Repairs = useSafeLazyImport(() => import('@/pages/Repairs'), 'Repairs');
const GarageSchedule = useSafeLazyImport(() => import('@/pages/GarageSchedule'), 'Garage Schedule');
const GarageCarInventory = useSafeLazyImport(() => import('@/pages/GarageCarInventory'), 'Garage Car Inventory');
const RepairHistory = useSafeLazyImport(() => import('@/pages/RepairHistory'), 'Repair History');
const EnhancedRepairHistory = useSafeLazyImport(() => import('@/pages/EnhancedRepairHistory'), 'Enhanced Repair History');

// === INVENTORY MANAGEMENT ===
const InventoryGarage = useSafeLazyImport(() => import('@/pages/InventoryGarage'), 'Inventory Garage');
const InventoryFloor2 = useSafeLazyImport(() => import('@/pages/InventoryFloor2/SimpleIndex'), 'Inventory Floor 2');
const InventoryHistory = useSafeLazyImport(() => import('@/pages/InventoryHistory'), 'Inventory History');
const PartManagement = useSafeLazyImport(() => import('@/pages/PartManagement'), 'Part Management');
const ScanPart = useSafeLazyImport(() => import('@/pages/ScanPart'), 'Scan Part');
const ToolsEquipment = useSafeLazyImport(() => import('@/pages/ToolsEquipment'), 'Tools Equipment');

// === SHOWROOM OPERATIONS ===
const ShowroomFloor1Page = useSafeLazyImport(() => import('@/pages/ShowroomFloor1'), 'Showroom Floor 1');
const ShowroomFloor2Page = useSafeLazyImport(() => import('@/pages/ShowroomFloor2'), 'Showroom Floor 2');
const ShowroomInventory = useSafeLazyImport(() => import('@/pages/ShowroomInventory'), 'Showroom Inventory');

// === FINANCIAL MANAGEMENT ===
const FinancialManagement = useSafeLazyImport(() => import('@/pages/FinancialManagement'), 'Financial Management');
const FinancialDashboardPage = useSafeLazyImport(() => import('@/pages/FinancialDashboard'), 'Financial Dashboard');
const OwnerFinances = useSafeLazyImport(() => import('@/pages/OwnerFinances'), 'Owner Finances');
const FinancialAnalytics = useSafeLazyImport(() => import('@/pages/FinancialAnalytics'), 'Financial Analytics');

// === SALES & MARKETING ===
const Sales = useSafeLazyImport(() => import('@/pages/Sales'), 'Sales');
const MarketingCRM = useSafeLazyImport(() => import('@/pages/MarketingCRM'), 'Marketing CRM');
const OrderedCars = useSafeLazyImport(() => import('@/pages/OrderedCars'), 'Ordered Cars');
const OrderedParts = useSafeLazyImport(() => import('@/pages/OrderedParts'), 'Ordered Parts');

// === EMPLOYEE MANAGEMENT ===
const EmployeeManagement = useSafeLazyImport(() => import('@/pages/EmployeeManagement'), 'Employee Management');
const WstacyEmployeeManagement = useSafeLazyImport(() => import('@/pages/WstacyEmployeeManagement'), 'Employee Management');
const EmployeeProfile = useSafeLazyImport(() => import('@/pages/EmployeeProfile'), 'Employee Profile');
const EmployeeAnalytics = useSafeLazyImport(() => import('@/pages/EmployeeAnalytics'), 'Employee Analytics');
const UserManagement = useSafeLazyImport(() => import('@/pages/UserManagement'), 'User Management');
const UserActivityDashboard = useSafeLazyImport(() => import('@/pages/UserActivityDashboard'), 'User Activity Dashboard');

// === COMMUNICATION ===
const MessagingCenter = useSafeLazyImport(() => import('@/pages/MessagingCenter'), 'Messaging Center');
const RequestCenter = useSafeLazyImport(() => import('@/pages/RequestCenter'), 'Request Center');
const NewRequest = useSafeLazyImport(() => import('@/pages/RequestCenter/NewRequest'), 'New Request');
import MessageCenter from '@/components/MessageCenter';

// === SCHEDULING & CALENDAR ===
const Calendar = useSafeLazyImport(() => import('@/pages/Calendar'), 'Calendar');
const BusinessCalendar = useSafeLazyImport(() => import('@/pages/BusinessCalendar'), 'Business Calendar');
const MarketingCalendar = useSafeLazyImport(() => import('@/pages/MarketingCalendar'), 'Marketing Calendar');

// === ANALYTICS & REPORTS ===
const Analytics = useSafeLazyImport(() => import('@/pages/Analytics'), 'Analytics');
const Reports = useSafeLazyImport(() => import('@/pages/Reports'), 'Reports');
const DataLinkingSummaryPage = useSafeLazyImport(() => import('@/pages/DataLinkingSummary'), 'Data Linking Summary');
const DataUpload = useSafeLazyImport(() => import('@/pages/DataUpload'), 'Data Upload');

// === SYSTEM & ADMIN ===
const SystemSettings = useSafeLazyImport(() => import('@/pages/SystemSettings'), 'System Settings');
const SystemStatus = useSafeLazyImport(() => import('@/pages/SystemStatus'), 'System Status');
const AuditLogPage = useSafeLazyImport(() => import('@/pages/AuditLog'), 'Audit Log');
const SystemAuditLog = useSafeLazyImport(() => import('@/pages/SystemAuditLog'), 'System Audit Log');
const EmployeeAuditPage = useSafeLazyImport(() => import('@/pages/EmployeeAudit'), 'Employee Audit');
const AdminUsersPage = useSafeLazyImport(() => import('@/pages/AdminUsersPage'), 'Admin Users');
const LoginTracking = useSafeLazyImport(() => import('@/pages/LoginTracking'), 'Login Tracking');
const DeveloperOverview = useSafeLazyImport(() => import('@/pages/DeveloperOverview'), 'Developer Overview');
const ApiDocumentation = useSafeLazyImport(() => import('@/pages/ApiDocumentation'), 'API Documentation');
const ApiKeyManagement = useSafeLazyImport(() => import('@/pages/ApiKeyManagement'), 'API Key Management');
const NetworkAuthTest = useSafeLazyImport(() => import('@/pages/NetworkAuthTest'), 'Network Auth Test');

// === CUSTOMIZATION & PERFORMANCE ===
import { CustomizationPanel } from '@/components/CustomizationPanel';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
const FeatureShowcase = useSafeLazyImport(() => import('@/pages/FeatureShowcase'), 'Feature Showcase');

// Loading fallback
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

// Overlay neutralizer - removes any blocking overlays
const useOverlayNeutralizer = () => {
  useEffect(() => {
    console.log('🔧 Overlay neutralizer active...');
    
    const neutralizeOverlays = () => {
      // Kill obvious portals/overlays that are empty
      ['modals-root', 'radix-portal', 'drawer-root', 'toast-root'].forEach(id => {
        const n = document.getElementById(id);
        if (n && !n.hasChildNodes()) {
          n.style.pointerEvents = 'none';
          n.style.zIndex = '0';
          n.style.position = 'static';
          n.style.removeProperty('inset');
        }
      });

      // Find any problematic full-screen overlays
      [...document.querySelectorAll('*')].forEach(n => {
        const el = n as HTMLElement;
        const s = getComputedStyle(el);
        const isFixed = s.position === 'fixed';
        const isFullScreen = s.inset === '0px' || (el.offsetWidth >= window.innerWidth && el.offsetHeight >= window.innerHeight);
        const hasHighZIndex = parseInt(s.zIndex || '0', 10) >= 1000;
        const isBlocking = s.pointerEvents !== 'none';
        
        if (isFixed && isFullScreen && hasHighZIndex && isBlocking) {
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
    
    neutralizeOverlays();
    
    const observer = new MutationObserver(() => {
      setTimeout(neutralizeOverlays, 10);
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
    
    const interval = setInterval(neutralizeOverlays, 10000);
    
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);
};

function AppContent() {
  // App rendering...
  
  // Development mode debugging (use window.enableVerboseLogs() to see details)
  
  useOverlayNeutralizer();
  // useKeyboardShortcuts(); // Removed floating buttons

  return (
    <ErrorBoundary>
      <QueryClient>
        <RealtimeProvider>
          <EnhancedMockAuthProvider>
            <NotificationProvider>
              <CarDataProvider>
              <Suspense fallback={<RouteLoadingFallback />}>
                <ErrorBoundary fallback={<div>Page Component Error</div>}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Layout />}>
                      {/* === DASHBOARD ROUTES === */}
                      <Route index element={<EnhancedDashboard />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="enhanced-dashboard" element={<EnhancedDashboard />} />

                      {/* === COMMUNICATION ROUTES === */}
                      <Route path="message-center" element={<MessageCenter />} />
                      <Route path="request-center" element={<MessageCenter />} />
                      <Route path="messaging-center" element={<MessagingCenter />} />
                      <Route path="requests/new" element={<NewRequest />} />

                      {/* === VEHICLE MANAGEMENT ROUTES === */}
                      <Route path="car-inventory" element={<CarInventory />} />
                      <Route path="new-car-arrivals" element={<NewCarArrivals />} />
                      <Route path="scan-vin" element={<ScanVIN />} />
                      <Route path="test-drive-logs" element={<TestDriveLogsPage />} />
                      <Route path="test-drives/new" element={<NewTestDrivePage />} />
                      <Route path="test-drive-scanner" element={<TestDriveScannerPage />} />

                      {/* === GARAGE OPERATIONS ROUTES === */}
                      <Route path="repairs" element={<Repairs />} />
                      <Route path="garage-schedule" element={<GarageSchedule />} />
                      <Route path="garage-car-inventory" element={<GarageCarInventory />} />
                      <Route path="repair-history" element={<RepairHistory />} />
                      <Route path="enhanced-repair-history" element={<EnhancedRepairHistory />} />

                      {/* === INVENTORY MANAGEMENT ROUTES === */}
                      <Route path="inventory" element={<InventoryGarage />} />
                      <Route path="inventory-garage" element={<InventoryGarage />} />
                      <Route path="inventory-floor-2" element={<InventoryFloor2 />} />
                      <Route path="inventory-history" element={<InventoryHistory />} />
                      <Route path="part-management" element={<PartManagement />} />
                      <Route path="scan-part" element={<ScanPart />} />
                      <Route path="tools-equipment" element={<ToolsEquipment />} />

                      {/* === SHOWROOM OPERATIONS ROUTES === */}
                      <Route path="showroom-floor-1" element={<ShowroomFloor1Page />} />
                      <Route path="showroom-floor-2" element={<ShowroomFloor2Page />} />
                      <Route path="showroom-inventory" element={<ShowroomInventory />} />

                      {/* === FINANCIAL MANAGEMENT ROUTES === */}
                      <Route path="financial-management" element={<FinancialManagement />} />
                      <Route path="financial-dashboard" element={<FinancialDashboardPage />} />
                      <Route path="finances" element={<OwnerFinances />} />
                      <Route path="owner-finances" element={<OwnerFinances />} />
                      <Route path="financial-analytics" element={<FinancialAnalytics />} />

                      {/* === SALES & MARKETING ROUTES === */}
                      <Route path="sales" element={<Sales />} />
                      <Route path="marketing-crm" element={<MarketingCRM />} />
                      <Route path="ordered-cars" element={<OrderedCars />} />
                      <Route path="ordered-parts" element={<OrderedParts />} />

                      {/* === EMPLOYEE MANAGEMENT ROUTES === */}
                      <Route path="employee-management" element={<EmployeeManagement />} />
                      <Route path="wstacy-employee-management" element={<WstacyEmployeeManagement />} />
                      <Route path="employee-profile" element={<EmployeeProfile />} />
                      <Route path="employee-analytics" element={<EmployeeAnalytics />} />
                      <Route path="user-management" element={<UserManagement />} />
                      <Route path="user-activity-dashboard" element={<UserActivityDashboard />} />

                      {/* === SCHEDULING & CALENDAR ROUTES === */}
                      <Route path="calendar" element={<Calendar />} />
                      <Route path="business-calendar" element={<BusinessCalendar />} />
                      <Route path="marketing-calendar" element={<MarketingCalendar />} />

                      {/* === ANALYTICS & REPORTS ROUTES === */}
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="data-linking-summary" element={<DataLinkingSummaryPage />} />
                      <Route path="data-upload" element={<DataUpload />} />

                      {/* === SYSTEM & ADMIN ROUTES === */}
                      <Route path="system-settings" element={<SystemSettings />} />
                      <Route path="system-status" element={<SystemStatus />} />
                      <Route path="audit-log" element={<AuditLogPage />} />
                      <Route path="system-audit-log" element={<SystemAuditLog />} />
                      <Route path="employee-audit/:userId" element={<EmployeeAuditPage />} />
                      <Route path="admin/users" element={<AdminUsersPage />} />
                      <Route path="login-tracking" element={<LoginTracking />} />
                      <Route path="developer-overview" element={<DeveloperOverview />} />
                      <Route path="api-documentation" element={<ApiDocumentation />} />
                      <Route path="api-key-management" element={<ApiKeyManagement />} />
                      <Route path="network-auth-test" element={<NetworkAuthTest />} />
                      
                      {/* === CUSTOMIZATION & PERFORMANCE ROUTES === */}
                      <Route path="customization" element={<CustomizationPanel />} />
                      <Route path="performance" element={<PerformanceMonitor />} />
                      <Route path="showcase" element={<FeatureShowcase />} />

                      {/* === FALLBACK ROUTE === */}
                      <Route path="*" element={
                        <div style={{ padding: '20px', textAlign: 'center' }}>
                          <h2>🚗 Monza TECH - Page Not Found</h2>
                          <p>The requested page doesn't exist in the system.</p>
                          <a href="/" style={{ color: '#007bff', textDecoration: 'underline' }}>
                            ← Back to Dashboard
                          </a>
                        </div>
                      } />
                    </Route>
                  </Routes>
                </ErrorBoundary>
              </Suspense>
              <Toaster />
              {/* Floating buttons removed per user request */}
              {/* <ShortcutsHelp /> */}
              {/* <QuickActionsPanel /> */}
              {/* <WelcomeTour /> */}
              </CarDataProvider>
            </NotificationProvider>
          </EnhancedMockAuthProvider>
        </RealtimeProvider>
      </QueryClient>
    </ErrorBoundary>
  );
}

function App() {
  // Monza TECH App starting...
  
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
