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
  Truck,
  ShoppingCart
} from 'lucide-react';
import { CustomCalendarIcon } from '../../icons/CustomCalendarIcon';

// 🚀 LAUNCH 1.0 - SIMPLIFIED SIDEBAR NAVIGATION
// Only shows the features specifically requested by the user
export const sidebarSections = [
  {
    title: 'Main',
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'Showroom & Garage',
    items: [
      { href: '/showroom-floor-1', label: 'Floor 1', icon: Building },
      { href: '/showroom-floor-2', label: 'Floor 2', icon: Building2 },
      { href: '/repairs', label: 'Garage View', icon: Wrench },
      { href: '/garage-schedule', label: 'Schedule', icon: CustomCalendarIcon },
      { href: '/repair-history', label: 'Repair History', icon: History },
      { href: '/inventory-garage', label: 'Garage Inventory', icon: Package }
    ]
  },
  {
    title: 'Vehicle Management',
    items: [
      { href: '/car-inventory', label: 'Car Inventory', icon: Car },
      { href: '/scan-vin', label: 'Car Scanner', icon: QrCode },
      { href: '/test-drive-logs', label: 'Test Drive', icon: Timer },
      { href: '/test-drive-scanner', label: 'Test Drive Scanner', icon: Timer }
    ]
  },
  {
    title: 'Inventory System',
    items: [
      { href: '/scan-part', label: 'Part Scanner', icon: QrCode },
      { href: '/inventory-floor-2', label: 'Floor 2 Inventory', icon: Package },
      { href: '/inventory-history', label: 'Inventory History', icon: History }
    ]
  },
  {
    title: 'Orders',
    items: [
      { href: '/ordered-cars', label: 'Ordered Cars', icon: Car },
      { href: '/ordered-parts', label: 'Ordered Parts', icon: Package },
      { href: '/shipping-eta', label: 'Shipping ETA', icon: Truck }
    ]
  },
  {
    title: 'User & Employee Management',
    items: [
      { href: '/user-activity-dashboard', label: 'User Activity Monitor', icon: BarChart3 },
      { href: '/employee-management', label: 'Employee Management', icon: Users },
      { href: '/employee-profile', label: 'Employee Profile', icon: UserCircle },
      { href: '/wstacy-employee-management', label: 'Wstacy Employee Management', icon: Users }
    ]
  },
  {
    title: 'System & Admin',
    items: [
      { href: '/system-settings', label: 'System Settings', icon: Settings },
      { href: '/part-management', label: 'Part Management', icon: Package }
    ]
  },
  {
    title: 'CRM & Scheduling',
    items: [
      { href: '/marketing-crm', label: 'Marketing CRM', icon: Users },
      { href: '/business-calendar', label: 'Calendar', icon: CustomCalendarIcon }
    ]
  },
  {
    title: 'Integrations',
    items: [
      { href: '/api-documentation', label: 'API Documentation', icon: ClipboardList },
      { href: '/api-key-management', label: 'Key Management', icon: Settings }
    ]
  },
  {
    title: 'Financial',
    items: [
      { href: '/financial-dashboard', label: 'Financial Dashboard', icon: DollarSign }
    ]
  }
]; 