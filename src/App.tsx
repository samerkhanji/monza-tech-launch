import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { QueryClient } from '@/contexts/QueryContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import { TutorialProvider } from './contexts/TutorialContext';
import TutorialModal from './components/TutorialModal';
import TutorialButton from './components/TutorialButton';
import { CarDataProvider } from './contexts/CarDataContext';
import LoadingSpinner from './components/ui/loading-spinner';
import GlobalKeyboardShortcuts from './components/GlobalKeyboardShortcuts';
import { initPerformanceMonitoring, preloadCriticalResources, markAppInteractive } from '@/utils/performance';
import { BusinessActivityMonitor } from '@/services/businessActivityMonitor';
import PWAService from '@/services/pwaService';
import AutomatedBackupService from '@/services/automatedBackupService';
import { AutomatedNotificationService } from '@/services/automatedNotificationService';
// Launch 1.0: Network security features disabled
// import NetworkSecurityBanner from './components/NetworkSecurityBanner';
// import { useNetworkAuthorization } from './hooks/useNetworkSecurity';

// Lazy load all route components to improve LCP
import { LazyDashboard } from '@/components/LazyLoader';
const CarInventory = lazy(() => import('@/pages/CarInventory'));
const Repairs = lazy(() => import('@/pages/Repairs'));
const Inventory = lazy(() => import('@/pages/InventoryGarage'));
const ScanVIN = lazy(() => import('@/pages/ScanVIN'));
const ScanPart = lazy(() => import('@/pages/ScanPart'));
const Sales = lazy(() => import('@/pages/Sales'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Reports = lazy(() => import('@/pages/Reports'));
const EmployeeManagement = lazy(() => import('@/pages/EmployeeManagement'));
const EmployeeProfile = lazy(() => import('@/pages/EmployeeProfile'));
const EmployeeAnalytics = lazy(() => import('@/pages/EmployeeAnalytics'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const Login = lazy(() => import('@/pages/Login'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const RequestCenter = lazy(() => import('@/pages/RequestCenter'));
const MessagingCenter = lazy(() => import('@/pages/MessagingCenter'));
const NewRequest = lazy(() => import('@/pages/RequestCenter/NewRequest'));
const OrderedCars = lazy(() => import('@/pages/OrderedCars'));
const OrderedParts = lazy(() => import('@/pages/OrderedParts'));
const ShippingETA = lazy(() => import('@/pages/ShippingETA'));
const RepairHistory = lazy(() => import('@/pages/RepairHistory'));
const EnhancedRepairHistory = lazy(() => import('@/pages/EnhancedRepairHistory'));
const InventoryHistory = lazy(() => import('@/pages/InventoryHistory'));
const InventoryFloor2 = lazy(() => import('@/pages/InventoryFloor2'));
const GarageSchedule = lazy(() => import('@/pages/GarageSchedule'));
const FinancialDashboardPage = lazy(() => import('@/pages/FinancialDashboard'));
const Calendar = lazy(() => import('@/pages/Calendar'));
const BusinessCalendar = lazy(() => import('@/pages/BusinessCalendar'));
const MarketingCalendar = lazy(() => import('@/pages/MarketingCalendar'));
const ApiDocumentation = lazy(() => import('@/pages/ApiDocumentation'));
const ApiKeyManagement = lazy(() => import('@/pages/ApiKeyManagement'));
const ShowroomFloor1Page = lazy(() => import('@/pages/ShowroomFloor1'));
const ShowroomFloor2Page = lazy(() => import('@/pages/ShowroomFloor2'));
const OwnerFinances = lazy(() => import('@/pages/OwnerFinances'));
const AuditLogPage = lazy(() => import('@/pages/AuditLog'));
const EmployeeAuditPage = lazy(() => import('@/pages/EmployeeAudit'));
const SystemSettings = lazy(() => import('@/pages/SystemSettings'));
const GarageCarInventory = lazy(() => import('@/pages/GarageCarInventory'));
const UserActivityDashboard = lazy(() => import('@/pages/UserActivityDashboard'));
const DataLinkingSummaryPage = lazy(() => import('@/pages/DataLinkingSummary'));
const TestDriveLogsPage = lazy(() => import('@/pages/TestDriveLogs'));
const TestDriveScannerPage = lazy(() => import('@/pages/TestDriveScanner'));
const NewCarArrivals = lazy(() => import('@/pages/NewCarArrivals'));
const ShowroomInventory = lazy(() => import('@/pages/ShowroomInventory'));
const ToolsEquipment = lazy(() => import('@/pages/ToolsEquipment'));
const FinancialManagement = lazy(() => import('@/pages/FinancialManagement'));
const FinancialAnalytics = lazy(() => import('@/pages/FinancialAnalytics'));
const MarketingBudgetCalendar = lazy(() => import('@/pages/FinancialManagement/components/MarketingBudgetCalendar'));
const NetworkAuthTest = lazy(() => import('@/pages/NetworkAuthTest'));
const MarketingCRM = lazy(() => import('@/pages/MarketingCRM'));
const PartManagement = lazy(() => import('@/pages/PartManagement'));
const WstacyEmployeeManagement = lazy(() => import('@/pages/WstacyEmployeeManagement'));

// Add error logging for debugging
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Loading fallback component for better UX
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

// Protected Route Component (Launch 1.0: Simplified)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Launch 1.0: No network authorization required
  return <>{children}</>;
};

function AppContent() {
  console.log('AppContent component rendering...');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Mark app as interactive immediately to prevent delays
    markAppInteractive();
    
    // Initialize PWA service
    PWAService.getInstance();
    console.log('🚀 PWA Service initialized');
    
    // Start automated backups
    AutomatedBackupService.startAutomatedBackups();
    console.log('📦 Automated backup service started');
    
    // Initialize comprehensive business monitoring (Launch 1.0 - Demo alerts disabled)
    BusinessActivityMonitor.initialize();
    
    // Initialize automated notification service
    AutomatedNotificationService.getInstance().initialize();
    console.log('🚨 Automated Notification Service initialized');
    
    // Note: Demo alerts disabled for Launch 1.0 - clean console experience
    // BusinessActivityMonitor.generateSampleIssues() moved to V2

    // Cleanup function
    return () => {
      AutomatedBackupService.stopAutomatedBackups();
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      // Initialize the old tour service (we will replace this)
    }
  }, [user, navigate]);

  return (
    <ErrorBoundary>
      <QueryClient>
              <ErrorBoundary>
                <NotificationProvider>
                  <ErrorBoundary>
                    <Suspense fallback={<RouteLoadingFallback />}>
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<Layout />}>
                                  <Route index element={<LazyDashboard />} />
        <Route path="dashboard" element={<LazyDashboard />} />
                          <Route path="car-inventory" element={<CarInventory />} />
                          <Route path="repairs" element={<Repairs />} />
                          <Route path="inventory" element={<Inventory />} />
                          <Route path="inventory-garage" element={<Inventory />} />
                          <Route path="inventory-floor-2" element={<InventoryFloor2 />} />
                          <Route path="inventory-history" element={<InventoryHistory />} />
                          <Route path="scan-vin" element={<ScanVIN />} />
                          <Route path="scan-part" element={<ScanPart />} />
                          <Route path="sales" element={<Sales />} />
                          <Route path="analytics" element={<Analytics />} />
                          <Route path="reports" element={<Reports />} />
                          <Route path="employee-management" element={<EmployeeManagement />} />
                          <Route path="employee-profile" element={<EmployeeProfile />} />
                          <Route path="employee-analytics" element={<EmployeeAnalytics />} />
                          <Route path="user-management" element={<UserManagement />} />
                          <Route path="requests" element={<RequestCenter />} />
                          <Route path="messaging-center" element={<MessagingCenter />} />
                          <Route path="requests/new" element={<NewRequest />} />
                          <Route path="ordered-cars" element={<OrderedCars />} />
                          <Route path="ordered-parts" element={<OrderedParts />} />
                          <Route path="shipping-eta" element={<ShippingETA />} />
                          <Route path="repair-history" element={<RepairHistory />} />
                          <Route path="enhanced-repair-history" element={<EnhancedRepairHistory />} />
                          <Route path="garage-schedule" element={<GarageSchedule />} />
                          <Route path="calendar" element={<Calendar />} />
                          <Route path="business-calendar" element={<BusinessCalendar />} />
                          <Route path="marketing-calendar" element={<MarketingCalendar />} />
                          <Route path="api-documentation" element={<ApiDocumentation />} />
                          <Route path="api-key-management" element={<ApiKeyManagement />} />
                          <Route path="showroom-floor-1" element={<ShowroomFloor1Page />} />
                          <Route path="showroom-floor-2" element={<ShowroomFloor2Page />} />
                          <Route path="financial-dashboard" element={<FinancialDashboardPage />} />
                          <Route path="finances" element={<OwnerFinances />} />
                          <Route path="owner-finances" element={<OwnerFinances />} />
                          <Route path="audit-log" element={<AuditLogPage />} />
                          <Route path="employee-audit/:userId" element={<EmployeeAuditPage />} />
                          <Route path="system-settings" element={<SystemSettings />} />
                          <Route path="garage-car-inventory" element={<GarageCarInventory />} />
                          <Route path="user-activity-dashboard" element={<UserActivityDashboard />} />
                          <Route path="data-linking-summary" element={<DataLinkingSummaryPage />} />
                          <Route path="test-drive-logs" element={<TestDriveLogsPage />} />
                          <Route path="test-drive-scanner" element={<TestDriveScannerPage />} />
                          <Route path="new-car-arrivals" element={<NewCarArrivals />} />
                          <Route path="showroom-inventory" element={<ShowroomInventory />} />
                          <Route path="tools-equipment" element={<ToolsEquipment />} />
                          <Route path="financial-management" element={<FinancialManagement />} />
                          <Route path="financial-analytics" element={<FinancialAnalytics />} />
                          <Route path="marketing-budget-calendar" element={<MarketingBudgetCalendar />} />
                          <Route path="marketing-crm" element={<MarketingCRM />} />
                          <Route path="part-management" element={<PartManagement />} />
                          <Route path="wstacy-employee-management" element={<WstacyEmployeeManagement />} />
                          <Route path="network-auth-test" element={<NetworkAuthTest />} />
              <Route path="*" element={<NotFound />} />
                        </Route>
                      </Routes>
                    </Suspense>
                    <Toaster />
                  </ErrorBoundary>
                </NotificationProvider>
              </ErrorBoundary>
      </QueryClient>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <style>
        {`
          /* EMERGENCY DATE PICKER FIX - HIGHEST PRIORITY OVERRIDE */
          input[type="date"]::-webkit-calendar-picker-indicator,
          input[type="datetime-local"]::-webkit-calendar-picker-indicator,
          *::-webkit-calendar-picker-indicator,
          input::-webkit-calendar-picker-indicator {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            cursor: pointer !important;
            width: 20px !important;
            height: 20px !important;
            background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>') no-repeat center !important;
            background-size: 16px 16px !important;
            margin: 0 0 0 4px !important;
            padding: 2px !important;
            border: 1px solid #d1d5db !important;
            border-radius: 3px !important;
            outline: none !important;
            position: static !important;
            left: auto !important;
            top: auto !important;
            right: auto !important;
            bottom: auto !important;
            transform: none !important;
            z-index: 1 !important;
            pointer-events: auto !important;
            user-select: none !important;
            -webkit-appearance: auto !important;
            -moz-appearance: auto !important;
            appearance: auto !important;
          }

          /* Firefox date picker support */
          input[type="date"]::-moz-calendar-picker,
          input[type="datetime-local"]::-moz-calendar-picker,
          *::-moz-calendar-picker {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            cursor: pointer !important;
          }

          /* Ensure date inputs are fully functional */
          input[type="date"],
          input[type="datetime-local"] {
            cursor: pointer !important;
            position: relative !important;
            background-color: white !important;
            color: #000 !important;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
          }

          /* PDI and all date input classes */
          input[type="date"].pdi-date-input,
          input[type="date"].calendar-fix,
          input[type="date"].mt-1,
          input[type="date"].w-full,
          input[type="datetime-local"].pdi-date-input,
          input[type="datetime-local"].calendar-fix,
          input[type="datetime-local"].mt-1,
          input[type="datetime-local"].w-full {
            background-color: white !important;
            color: #000 !important;
            cursor: pointer !important;
          }

          /* Enhanced focus and hover states */
          input[type="date"]:focus,
          input[type="datetime-local"]:focus {
            outline: 2px solid #3b82f6 !important;
            outline-offset: 2px !important;
            border-color: #3b82f6 !important;
          }

          input[type="date"]:hover,
          input[type="datetime-local"]:hover {
            border-color: #94a3b8 !important;
          }

          /* Remove any pseudo-element calendar emojis */
          input[type="date"]::after,
          input[type="datetime-local"]::after {
            display: none !important;
            content: "" !important;
          }

          /* Force calendar picker to be clickable in all contexts */
          input[type="date"]::-webkit-calendar-picker-indicator:hover {
            background-color: #f3f4f6 !important;
          }

          /* EMERGENCY FIX: Radix Select Dropdown Visibility */
          [data-radix-select-content] {
            z-index: 999999 !important;
            position: fixed !important;
            background: white !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 8px !important;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
            min-width: 200px !important;
            max-height: 300px !important;
            overflow-y: auto !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }

          [data-radix-select-item] {
            display: flex !important;
            align-items: center !important;
            padding: 8px 12px !important;
            cursor: pointer !important;
            pointer-events: auto !important;
            color: #1f2937 !important;
            background: white !important;
          }

          [data-radix-select-item]:hover {
            background-color: #f3f4f6 !important;
          }

          [data-radix-select-trigger] {
            cursor: pointer !important;
            pointer-events: auto !important;
            background: white !important;
            border: 2px solid #d1d5db !important;
          }

          [data-radix-select-trigger]:hover {
            border-color: #6b7280 !important;
          }

          /* Force dialog to allow overflow for dropdowns */
          [role="dialog"] {
            overflow: visible !important;
          }

          [data-radix-dialog-content] {
            overflow: visible !important;
          }

          /* Emergency Select Portal Fix */
          [data-radix-popper-content-wrapper] {
            z-index: 999999 !important;
          }

          /* ULTIMATE SELECT FIX - NUCLEAR OPTION */
          .customs-select-trigger {
            position: relative !important;
            z-index: 1 !important;
          }

          .customs-select-content {
            position: fixed !important;
            z-index: 999999 !important;
            background: white !important;
            border: 1px solid #ccc !important;
            border-radius: 6px !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
            min-width: 200px !important;
            padding: 4px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }

          .customs-select-item {
            padding: 8px 12px !important;
            cursor: pointer !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            border-radius: 4px !important;
            margin: 2px 0 !important;
          }

          .customs-select-item:hover {
            background: #f1f5f9 !important;
          }
        `}
      </style>
      <AuthProvider>
        <CarDataProvider>
          <TutorialProvider>
            <AppContent />
            <TutorialModal />
            <TutorialButton />
            <GlobalKeyboardShortcuts />
          </TutorialProvider>
        </CarDataProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
