import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  Building, 
  Building2,
  Wrench, 
  Package, 
  QrCode, 
  Timer,
  Users, 
  UserCircle, 
  FileText, 
  Settings, 
  BarChart3,
  History,
  Truck,
  DollarSign,
  Shield,
  Activity,
  CheckSquare,
  Link as LinkIcon,
  Key,
  ClipboardList,
  Ship
} from 'lucide-react';

// Import all the page components
import Dashboard from './src/pages/Dashboard';
import ShowroomFloor1Page from './src/pages/ShowroomFloor1';
import ShowroomFloor2Page from './src/pages/ShowroomFloor2';
import CarInventory from './src/pages/CarInventory';
import TestDriveScannerPage from './src/pages/TestDriveScanner';
import TestDriveLogsPage from './src/pages/TestDriveLogs';
import ScanVIN from './src/pages/ScanVIN';
import GarageCarInventory from './src/pages/GarageCarInventory';
import SystemSettings from './src/pages/SystemSettings';
import UserManagement from './src/pages/UserManagement';
import Inventory from './src/pages/Inventory';
import InventoryFloor2 from './src/pages/InventoryFloor2';
import ScanPart from './src/pages/ScanPart';
import InventoryHistory from './src/pages/InventoryHistory';
import OrderedCars from './src/pages/OrderedCars';
import OrderedParts from './src/pages/OrderedParts';
import EmployeeProfile from './src/pages/EmployeeProfile';
import EmployeeManagement from './src/pages/EmployeeManagement';
import ApiDocumentation from './src/pages/ApiDocumentation';
import ApiKeyManagement from './src/pages/ApiKeyManagement';

// Sidebar navigation items for the standalone app
const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Main dashboard overview'
  },
  {
    title: 'Showroom Floor 1',
    href: '/showroom-floor-1',
    icon: Building,
    description: 'First floor showroom management'
  },
  {
    title: 'Showroom Floor 2',
    href: '/showroom-floor-2',
    icon: Building2,
    description: 'Second floor showroom management'
  },
  {
    title: 'Car Inventory',
    href: '/car-inventory',
    icon: Car,
    description: 'Main vehicle inventory system'
  },
  {
    title: 'Test Drive Scanner',
    href: '/test-drive-scanner',
    icon: Timer,
    description: 'Test drive scanning and management'
  },
  {
    title: 'Test Drive History',
    href: '/test-drive-logs',
    icon: History,
    description: 'Test drive logs and history'
  },
  {
    title: 'Scan VIN',
    href: '/scan-vin',
    icon: QrCode,
    description: 'VIN scanning and processing'
  },
  {
    title: 'Garage Car Inventory',
    href: '/garage-car-inventory',
    icon: Wrench,
    description: 'Garage vehicle inventory'
  },
  {
    title: 'System Settings',
    href: '/system-settings',
    icon: Settings,
    description: 'System configuration and settings'
  },
  {
    title: 'User Management',
    href: '/user-management',
    icon: Users,
    description: 'User account management'
  },
  {
    title: 'Garage Inventory',
    href: '/inventory',
    icon: Package,
    description: 'Garage parts and equipment inventory'
  },
  {
    title: 'Floor 2 Inventory',
    href: '/inventory-floor-2',
    icon: Package,
    description: 'Second floor inventory management'
  },
  {
    title: 'Part Scanner',
    href: '/scan-part',
    icon: QrCode,
    description: 'Parts scanning and tracking'
  },
  {
    title: 'Inventory History',
    href: '/inventory-history',
    icon: History,
    description: 'Inventory movement history'
  },
  {
    title: 'Ordered Cars',
    href: '/ordered-cars',
    icon: Car,
    description: 'Ordered vehicles tracking'
  },
  {
    title: 'Ordered Parts',
    href: '/ordered-parts',
    icon: Package,
    description: 'Ordered parts tracking'
  },
  {
    title: 'Employee Profile',
    href: '/employee-profile',
    icon: UserCircle,
    description: 'Employee profile management'
  },
  {
    title: 'Employee Management',
    href: '/employee-management',
    icon: Users,
    description: 'Employee management system'
  },
  {
    title: 'Documentation',
    href: '/api-documentation',
    icon: FileText,
    description: 'API and system documentation'
  },
  {
    title: 'Key Management',
    href: '/api-key-management',
    icon: Key,
    description: 'API key management system'
  }
];

// Sidebar Component
const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation();

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Monza TECH</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => onClose()}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p>Monza S.A.L.</p>
            <p>Vehicle Management System</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile Menu Button
const MobileMenuButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white border border-gray-200 shadow-sm"
  >
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>
);

// Main Layout Component
const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileMenuButton onClick={() => setSidebarOpen(true)} />
      
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

// Standalone App Component
const MonzaStandaloneApp = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/showroom-floor-1" element={<ShowroomFloor1Page />} />
          <Route path="/showroom-floor-2" element={<ShowroomFloor2Page />} />
          <Route path="/car-inventory" element={<CarInventory />} />
          <Route path="/test-drive-scanner" element={<TestDriveScannerPage />} />
          <Route path="/test-drive-logs" element={<TestDriveLogsPage />} />
          <Route path="/scan-vin" element={<ScanVIN />} />
          <Route path="/garage-car-inventory" element={<GarageCarInventory />} />
          <Route path="/system-settings" element={<SystemSettings />} />
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/inventory-floor-2" element={<InventoryFloor2 />} />
          <Route path="/scan-part" element={<ScanPart />} />
          <Route path="/inventory-history" element={<InventoryHistory />} />
          <Route path="/ordered-cars" element={<OrderedCars />} />
          <Route path="/ordered-parts" element={<OrderedParts />} />
          <Route path="/employee-profile" element={<EmployeeProfile />} />
          <Route path="/employee-management" element={<EmployeeManagement />} />
          <Route path="/api-documentation" element={<ApiDocumentation />} />
          <Route path="/api-key-management" element={<ApiKeyManagement />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default MonzaStandaloneApp; 