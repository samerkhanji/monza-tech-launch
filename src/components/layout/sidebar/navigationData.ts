import { 
  LayoutDashboard, 
  Car, 
  Building, 
  Building2,
  Wrench, 
  Package, 
  QrCode, 
  Calendar, 
  ClipboardList, 
  Users, 
  UserCircle, 
  Settings, 
  History,
  BarChart3,
  Timer,
  DollarSign,
  Truck
} from 'lucide-react';
import { CustomCalendarIcon } from '../../icons/CustomCalendarIcon';

// Main navigation items
export const mainNavItems = [
  {
    title: 'Dashboard',
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
];

// 🏢 Showroom & Garage - Launch 1.0 Features Only
export const showroomItems = [
  {
    title: 'Floor 1',
    label: 'Floor 1',
    href: '/showroom-floor-1',
    icon: Building,
  },
  {
    title: 'Floor 2', 
    label: 'Floor 2',
    href: '/showroom-floor-2',
    icon: Building2,
  },
];

export const garageItems = [
  {
    title: 'Garage View',
    label: 'Garage View',
    href: '/repairs',
    icon: Wrench,
  },
  {
    title: 'Schedule',
    label: 'Schedule',
    href: '/garage-schedule',
    icon: CustomCalendarIcon,
  },
  {
    title: 'Repair History',
    label: 'Repair History',
    href: '/repair-history',
    icon: History,
  },
  {
    title: 'Garage Inventory',
    label: 'Garage Inventory',
    href: '/inventory-garage',
    icon: Package,
  },
];

// 🚗 Vehicle Management - Launch 1.0 Features Only
export const vehiclesItems = [
  {
    title: 'Car Inventory',
    label: 'Car Inventory',
    href: '/car-inventory',
    icon: Car,
  },
  {
    title: 'Car Scanner',
    label: 'Car Scanner',
    href: '/scan-vin',
    icon: QrCode,
  },
  {
    title: 'Test Drive',
    label: 'Test Drive',
    href: '/test-drive-logs',
    icon: Timer,
  },
  {
    title: 'Test Drive Scanner',
    label: 'Test Drive Scanner',
    href: '/test-drive-scanner',
    icon: Timer,
  },
];

// 🧰 Inventory System - Launch 1.0 Features Only (All 4 Tabs)
export const inventoryItems = [
  {
    title: 'Part Scanner',
    label: 'Part Scanner',
    href: '/scan-part',
    icon: QrCode,
  },
  {
    title: 'Floor 2 Inventory',
    label: 'Floor 2 Inventory',
    href: '/inventory-floor-2',
    icon: Package,
  },
  {
    title: 'Inventory History',
    label: 'Inventory History',
    href: '/inventory-history',
    icon: History,
  },
];

// 📦 Orders - Launch 1.0 Features Only
export const ordersItems = [
  {
    title: 'Ordered Cars',
    label: 'Ordered Cars',
    href: '/ordered-cars',
    icon: Car,
  },
  {
    title: 'Ordered Parts',
    label: 'Ordered Parts',
    href: '/ordered-parts',
    icon: Package,
  },
  {
    title: 'Shipping ETA',
    label: 'Shipping ETA',
    href: '/shipping-eta',
    icon: Truck,
  },
];

// 👥 User & Employee Management - Launch 1.0 Features Only
export const employeeItems = [
  {
    title: 'User Activity Monitor',
    label: 'User Activity Monitor',
    href: '/user-activity-dashboard',
    icon: BarChart3,
  },
  {
    title: 'Employee Management',
    label: 'Employee Management',
    href: '/employee-management',
    icon: Users,
  },
  {
    title: 'Employee Profile',
    label: 'Employee Profile',
    href: '/employee-profile',
    icon: UserCircle,
  },
  {
    title: 'Wstacy Employee Management',
    label: 'Wstacy Employee Management',
    href: '/wstacy-employee-management',
    icon: Users,
  },
];

// ⚙️ System & Admin - Launch 1.0 Features Only
export const systemItems = [
  {
    title: 'System Settings',
    label: 'System Settings',
    href: '/system-settings',
    icon: Settings,
  },
  {
    title: 'Part Management',
    label: 'Part Management',
    href: '/part-management',
    icon: Package,
  },
];

// 📢 CRM & Scheduling - Launch 1.0 Features Only
export const crmItems = [
  {
    title: 'Marketing CRM',
    label: 'Marketing CRM',
    href: '/marketing-crm',
    icon: Users,
  },
  {
    title: 'Calendar',
    label: 'Calendar',
    href: '/business-calendar',
    icon: CustomCalendarIcon,
  },
];

// 🌐 Integrations - Launch 1.0 Features Only
export const apiItems = [
  {
    title: 'API Documentation',
    label: 'API Documentation',
    href: '/api-documentation',
    icon: ClipboardList,
  },
  {
    title: 'Key Management',
    label: 'Key Management',
    href: '/api-key-management',
    icon: Settings,
  },
];

// 💰 Financial - Single Tab for ALL Financial Data
export const financialItems = [
  {
    title: 'Financial Dashboard',
    label: 'Financial Dashboard',
    href: '/financial-dashboard',
    icon: DollarSign,
  },
];

// Launch 1.0 Navigation Data (Only Essential Features)
export const navigationData = {
  main: mainNavItems,
  showroom: showroomItems,
  garage: garageItems,
  vehicles: vehiclesItems,
  inventory: inventoryItems,
  orders: ordersItems,
  employees: employeeItems,
  system: systemItems,
  crm: crmItems,
  api: apiItems,
  financial: financialItems,
};

// Legacy aliases for backward compatibility
export const businessItems = employeeItems;
export const marketingItems = crmItems;
