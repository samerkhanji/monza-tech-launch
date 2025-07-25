import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import LazyLoadErrorBoundary from './LazyLoadErrorBoundary';

interface LazyLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const DefaultFallback = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    <span className="ml-2 text-sm text-gray-600">Loading...</span>
  </div>
);

export const LazyLoader: React.FC<LazyLoaderProps> = ({ 
  children, 
  fallback = <DefaultFallback /> 
}) => {
  return (
    <LazyLoadErrorBoundary>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </LazyLoadErrorBoundary>
  );
};

// Lazy load heavy components
export const LazyDashboard = lazy(() => import('@/pages/Dashboard-simple'));
export const LazyAnalytics = lazy(() => import('@/pages/Analytics'));
export const LazyCarInventory = lazy(() => import('@/pages/CarInventory'));
export const LazyGarageCarInventory = lazy(() => import('@/pages/GarageCarInventory'));
export const LazyShowroomFloor1 = lazy(() => import('@/pages/ShowroomFloor1'));
export const LazyShowroomFloor2 = lazy(() => import('@/pages/ShowroomFloor2'));
export const LazyRepairs = lazy(() => import('@/pages/Repairs'));
export const LazyGarageSchedule = lazy(() => import('@/pages/GarageSchedule'));
export const LazyFinancialManagement = lazy(() => import('@/pages/FinancialManagement'));
export const LazyNewCarArrivals = lazy(() => import('@/pages/NewCarArrivals'));
export const LazyTestDriveLogs = lazy(() => import('@/pages/TestDriveLogs'));
export const LazyUserActivityDashboard = lazy(() => import('@/pages/UserActivityDashboard'));
export const LazyTimeTrackingDashboard = lazy(() => import('@/pages/TimeTrackingDashboard'));
export const LazyToolsEquipment = lazy(() => import('@/pages/ToolsEquipment'));
export const LazyRequestCenter = lazy(() => import('@/pages/RequestCenter'));
export const LazyMessagingCenter = lazy(() => import('@/pages/MessagingCenter'));
export const LazyQualityControl = lazy(() => import('@/pages/QualityControl'));
export const LazyReportGenerator = lazy(() => import('@/pages/ReportGenerator'));
export const LazySystemSettings = lazy(() => import('@/pages/SystemSettings'));
export const LazyApiDocumentation = lazy(() => import('@/pages/ApiDocumentation'));
export const LazyApiKeyManagement = lazy(() => import('@/pages/ApiKeyManagement'));
export const LazyAuditLog = lazy(() => import('@/pages/AuditLog'));
export const LazyCarFinancial = lazy(() => import('@/pages/CarFinancial'));
export const LazyCarFinancialTracking = lazy(() => import('@/pages/CarFinancialTracking'));
export const LazyDataLinkingSummary = lazy(() => import('@/pages/DataLinkingSummary'));
export const LazyEmployeeAudit = lazy(() => import('@/pages/EmployeeAudit'));
export const LazyEnhancedRepairHistory = lazy(() => import('@/pages/EnhancedRepairHistory'));
export const LazyInventoryFloor2 = lazy(() => import('@/pages/InventoryFloor2'));
export const LazyInventoryGarage = lazy(() => import('@/pages/InventoryGarage'));
export const LazyInventoryHistory = lazy(() => import('@/pages/InventoryHistory'));
export const LazyOwnerFinances = lazy(() => import('@/pages/OwnerFinances'));
export const LazyRepairHistory = lazy(() => import('@/pages/RepairHistory'));
export const LazyScanPart = lazy(() => import('@/pages/ScanPart'));
export const LazyScanVIN = lazy(() => import('@/pages/ScanVIN'));
export const LazyShippingETA = lazy(() => import('@/pages/ShippingETA'));
export const LazyShowroom = lazy(() => import('@/pages/Showroom'));
export const LazyShowroomInventory = lazy(() => import('@/pages/ShowroomInventory'));
export const LazyTestDriveScanner = lazy(() => import('@/pages/TestDriveScanner')); 