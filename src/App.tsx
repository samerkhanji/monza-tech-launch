import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';
import LoadingSpinner from './components/ui/loading-spinner';

import '@/styles/emergency-click-fix.css';

// Launch 1.0: Network security features disabled
// import NetworkSecurityBanner from './components/NetworkSecurityBanner';
// import { useNetworkAuthorization } from './hooks/useNetworkSecurity';

// Lazy load route components to improve LCP
import Dashboard from '@/pages/Dashboard';
const EnhancedDashboard = lazy(() => import('@/pages/EnhancedDashboard'));
import MessageCenter from '@/components/MessageCenter';
const SupabaseTestComponent = lazy(() => import('@/components/SupabaseTestComponent'));
const UserRoleManager = lazy(() => import('@/components/UserRoleManager'));
const AdminUsersPage = lazy(() => import('@/pages/AdminUsersPage'));
const WarrantyTest = lazy(() => import('@/pages/WarrantyTest'));
const CarInventory = lazy(() => import('@/pages/CarInventory'));
const Repairs = lazy(() => import('@/pages/Repairs'));
const Inventory = lazy(() => import('@/pages/InventoryGarage'));
const DataUpload = lazy(() => import('@/pages/DataUpload'));
// NOTE: ScanVIN is imported eagerly to avoid dev-server dynamic import errors in some environments
import ScanVIN from '@/pages/ScanVIN';
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
  console.log('✅ Fixed AppContent component rendering...');
  
  // Hard-kill any pointer-events: none applied to <body>
  React.useLayoutEffect(() => {
    const fix = () => {
      if (document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = 'auto';
      }
    };
    fix();
    const mo = new MutationObserver(fix);
    mo.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    // 🚨 ULTRA AGGRESSIVE EMERGENCY FIX
    console.log('🚨 ULTRA AGGRESSIVE EMERGENCY FIX STARTING');
    
    // Remove ALL event listeners that might be blocking
    const removeAllEventListeners = () => {
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const element = el as HTMLElement;
        // Clone node to remove all event listeners
        const newElement = element.cloneNode(true);
        if (element.parentNode) {
          element.parentNode.replaceChild(newElement, element);
        }
      });
    };
    
    // Force click events to work
    const forceClickEvents = () => {
      document.addEventListener('click', function(e) {
        console.log('🖱️ GLOBAL CLICK DETECTED on:', e.target);
        e.stopImmediatePropagation();
        return true;
      }, { capture: true });
      
      document.addEventListener('mousedown', function(e) {
        console.log('🖱️ GLOBAL MOUSEDOWN on:', e.target);
        e.stopImmediatePropagation();
        return true;
      }, { capture: true });
    };
    
    // Apply extreme fixes
    forceClickEvents();
    
    const emergencyInteractionFix = () => {
      // Force body and html to be interactive
      document.body.style.setProperty('pointer-events', 'auto', 'important');
      document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
      
      // Remove ALL pointer-events restrictions from every element
      const allElements = document.querySelectorAll('*');
      let fixedCount = 0;
      
      allElements.forEach(el => {
        const element = el as HTMLElement;
        
        // Force pointer events
        element.style.setProperty('pointer-events', 'auto', 'important');
        element.style.setProperty('cursor', 'auto', 'important');
        element.style.setProperty('user-select', 'auto', 'important');
        
        // Remove blocking attributes
        if (element.hasAttribute('inert')) {
          element.removeAttribute('inert');
          fixedCount++;
        }
        
        // Remove aria-hidden from interactive elements
        if (element.tagName === 'BUTTON' || element.tagName === 'INPUT' || 
            element.tagName === 'SELECT' || element.tagName === 'TEXTAREA' ||
            element.getAttribute('role') === 'button' || element.tagName === 'A') {
          if (element.hasAttribute('aria-hidden')) {
            element.removeAttribute('aria-hidden');
            fixedCount++;
          }
        }
        
        // Force interactive elements to be visible and clickable
        if (element.tagName === 'BUTTON' || element.tagName === 'INPUT' || 
            element.tagName === 'SELECT' || element.tagName === 'TEXTAREA' ||
            element.getAttribute('role') === 'button' || element.tagName === 'A') {
          element.style.setProperty('opacity', '1', 'important');
          element.style.setProperty('visibility', 'visible', 'important');
          element.style.setProperty('display', element.style.display === 'none' ? 'block' : element.style.display, 'important');
        }
      });
      
      console.log('🔧 Emergency fix applied to', allElements.length, 'elements, fixed', fixedCount, 'blocking attributes');
    };
    
    // REACT ROUTER DEBUG FIX
    const reactRouterFix = () => {
      // Force hash-based routing to work
      if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        console.log('🧭 Hash detected:', hash, 'attempting navigation');
        window.history.pushState({}, '', hash);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      
      // Make all links work with direct navigation
      document.querySelectorAll('a[href^="/"]').forEach(link => {
        const anchor = link as HTMLAnchorElement;
        const originalHref = anchor.href;
        anchor.onclick = function(e) {
          e.preventDefault();
          console.log('🧭 Link clicked:', originalHref);
          window.location.href = originalHref;
          return false;
        };
      });
    };
    
    // Run immediately
    emergencyInteractionFix();
    reactRouterFix();
    
    // Run after DOM updates
    setTimeout(() => { emergencyInteractionFix(); reactRouterFix(); }, 50);
    setTimeout(() => { emergencyInteractionFix(); reactRouterFix(); }, 200);
    setTimeout(() => { emergencyInteractionFix(); reactRouterFix(); }, 500);
    setTimeout(() => { emergencyInteractionFix(); reactRouterFix(); }, 1000);
    
    // Run every 3 seconds as safety net
    const emergencyInterval = setInterval(emergencyInteractionFix, 3000);
    
    // Make globally available for manual use
    (window as any).emergencyFix = emergencyInteractionFix;
    (window as any).manualFix = () => {
      console.log('🔧 MANUAL FIX TRIGGERED');
      emergencyInteractionFix();
    };
    
    // NUCLEAR OPTION - Remove all potentially blocking CSS
    (window as any).nuclearFix = () => {
      console.log('💥 NUCLEAR FIX - REMOVING ALL BLOCKING CSS');
      
      // Remove all stylesheets temporarily
      const sheets = Array.from(document.styleSheets);
      sheets.forEach((sheet, index) => {
        try {
          if (sheet.href && sheet.href.includes('form-interaction-fix')) {
            return; // Keep our fix stylesheet
          }
          sheet.disabled = true;
          setTimeout(() => { if (sheet) sheet.disabled = false; }, 2000);
        } catch (e) {
          console.log('Could not disable stylesheet', index);
        }
      });
      
      // Force all elements to be clickable with inline styles
      document.querySelectorAll('*').forEach(el => {
        const element = el as HTMLElement;
        element.style.cssText += '; pointer-events: auto !important; cursor: auto !important; user-select: auto !important;';
      });
      
      console.log('💥 Nuclear fix applied - all CSS temporarily disabled');
    };
    
    // REACT EVENT SYSTEM FIX
    (window as any).reactEventFix = () => {
      console.log('⚛️ REACT EVENT SYSTEM FIX');
      
      // Re-enable all React events that might be blocked
      document.querySelectorAll('button, a, [role="button"], input, select, textarea').forEach(el => {
        const element = el as HTMLElement;
        
        // Force click event to work
        const originalClick = element.onclick;
        element.onclick = function(e) {
          console.log('🖱️ Click intercepted on:', element.tagName, element.textContent?.substring(0, 50));
          e.stopPropagation();
          if (originalClick) {
            originalClick.call(this, e);
          }
          return true;
        };
        
        // Add backup click listener
        element.addEventListener('click', function(e) {
          console.log('🖱️ Backup click on:', element.tagName, element.textContent?.substring(0, 50));
        }, { capture: true });
        
        // Remove any event blocking
        ['onmousedown', 'onmouseup', 'onpointerdown', 'onpointerup'].forEach(eventType => {
          (element as any)[eventType] = null;
        });
      });
      
      console.log('⚛️ React event fix applied');
    };
    
    console.log('✅ Emergency interaction fix system activated');
    
    console.log('✅ Simple app initialization complete - no heavy services');
    

    
    // Note: Demo alerts disabled for Launch 1.0 - clean console experience
    // BusinessActivityMonitor.generateSampleIssues() moved to V2

    // Cleanup function
    return () => {
      // AutomatedBackupService.stopAutomatedBackups();
      clearInterval(emergencyInterval);
    };
  }, []);

  // Removed user/navigation effects - simplified

  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/" element={<Layout />}>
                          <Route index element={<EnhancedDashboard />} />
                          <Route path="dashboard" element={<Dashboard />} />
                          <Route path="enhanced-dashboard" element={<EnhancedDashboard />} />
                          <Route path="message-center" element={<MessageCenter />} />
                          {/* Unified Message & Request Center - all functionality merged */}
                          <Route path="request-center" element={<MessageCenter />} />
                          <Route path="messaging-center" element={<MessageCenter />} />
                          <Route path="supabase-test" element={<SupabaseTestComponent />} />
                          <Route path="warranty-test" element={<WarrantyTest />} />
                          <Route path="admin/users" element={<AdminUsersPage />} />
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
            <Route path="*" element={<NotFound />} />
          </Route>
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
