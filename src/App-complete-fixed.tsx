import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from './components/ui/loading-spinner';

// Import ALL your original pages
const EnhancedDashboard = lazy(() => import('@/pages/EnhancedDashboard'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
import MessageCenter from '@/components/MessageCenter';
const CarInventory = lazy(() => import('@/pages/CarInventory'));
const Repairs = lazy(() => import('@/pages/Repairs'));
const Inventory = lazy(() => import('@/pages/InventoryGarage'));
const DataUpload = lazy(() => import('@/pages/DataUpload'));
import ScanVIN from '@/pages/ScanVIN';
const ScanPart = lazy(() => import('@/pages/ScanPart'));
const Sales = lazy(() => import('@/pages/Sales'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Reports = lazy(() => import('@/pages/Reports'));
const EmployeeManagement = lazy(() => import('@/pages/EmployeeManagement'));
const EmployeeProfile = lazy(() => import('@/pages/EmployeeProfile'));
const EmployeeAnalytics = lazy(() => import('@/pages/EmployeeAnalytics'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const RequestCenter = lazy(() => import('@/pages/RequestCenter'));
const MessagingCenter = lazy(() => import('@/pages/MessagingCenter'));
const NewRequest = lazy(() => import('@/pages/RequestCenter/NewRequest'));
const OrderedCars = lazy(() => import('@/pages/OrderedCars'));
const OrderedParts = lazy(() => import('@/pages/OrderedParts'));
const RepairHistory = lazy(() => import('@/pages/RepairHistory'));
const EnhancedRepairHistory = lazy(() => import('@/pages/EnhancedRepairHistory'));
const InventoryHistory = lazy(() => import('@/pages/InventoryHistory'));
const InventoryFloor2 = lazy(() => import('@/pages/InventoryFloor2/SimpleIndex'));
const GarageSchedule = lazy(() => import('@/pages/GarageSchedule'));
const FinancialDashboardPage = lazy(() => import('@/pages/FinancialDashboard'));
const Calendar = lazy(() => import('@/pages/Calendar'));
const BusinessCalendar = lazy(() => import('@/pages/BusinessCalendar'));
const MarketingCalendar = lazy(() => import('@/pages/MarketingCalendar'));
const ApiDocumentation = lazy(() => import('@/pages/ApiDocumentation'));
const ApiKeyManagement = lazy(() => import('@/pages/ApiKeyManagement'));
import ShowroomFloor1Page from '@/pages/ShowroomFloor1';
const ShowroomFloor2Page = lazy(() => import('@/pages/ShowroomFloor2'));
const OwnerFinances = lazy(() => import('@/pages/OwnerFinances'));
const AuditLogPage = lazy(() => import('@/pages/AuditLog'));
const EmployeeAuditPage = lazy(() => import('@/pages/EmployeeAudit'));
const SystemSettings = lazy(() => import('@/pages/SystemSettings'));
const GarageCarInventory = lazy(() => import('@/pages/GarageCarInventory'));
const UserActivityDashboard = lazy(() => import('@/pages/UserActivityDashboard'));
const DataLinkingSummaryPage = lazy(() => import('@/pages/DataLinkingSummary'));
const TestDriveLogsPage = lazy(() => import('@/pages/TestDriveLogs'));
const NewTestDrivePage = lazy(() => import('@/pages/test-drives/NewTestDrivePage'));
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

// Import ONLY the emergency CSS
import '@/styles/emergency-click-fix.css';

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

// Loading fallback
const RouteLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

// App Content with comprehensive error handling
function AppContent() {
  console.log('🚀 Complete Fixed App rendering...');
  useComprehensiveClickFix();

  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<EnhancedDashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="enhanced-dashboard" element={<EnhancedDashboard />} />
            <Route path="message-center" element={<MessageCenter />} />
            <Route path="request-center" element={<MessageCenter />} />
            <Route path="messaging-center" element={<MessageCenter />} />
            <Route path="car-inventory" element={<CarInventory />} />
            <Route path="repairs" element={<Repairs />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="inventory-garage" element={<Inventory />} />
            <Route path="data-upload" element={<DataUpload />} />
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
            <Route path="requests/new" element={<NewRequest />} />
            <Route path="ordered-cars" element={<OrderedCars />} />
            <Route path="ordered-parts" element={<OrderedParts />} />
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
            <Route path="test-drives/new" element={<NewTestDrivePage />} />
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
    </ErrorBoundary>
  );
}

function App() {
  console.log('🚀 Complete Monza TECH App starting...');
  
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default App;
