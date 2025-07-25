
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Request } from '@/types';
import { GarageCar } from '@/pages/Repairs/types';

// Mock data collections that would come from a real backend
const MOCK_REQUESTS: Request[] = [
  {
    id: '1',
    requestType: 'Inventory',
    message: 'Need more brake pads for Voyah Free models',
    priority: 'medium',
    status: 'submitted',
    submittedBy: 'Mark',
    submittedAt: '2025-05-19T14:30:00',
    details: 'We are completely out of the standard brake pads for Voyah Free. The next maintenance is scheduled for tomorrow.',
    comments: [
      { 
        author: 'Khalil', 
        text: 'I have contacted the supplier, they will deliver by tomorrow morning.', 
        timestamp: '2025-05-19T15:45:00' 
      }
    ]
  },
  {
    id: '2',
    requestType: 'Approval',
    message: 'Customer discount approval for fleet purchase',
    priority: 'high',
    status: 'reviewed',
    submittedBy: 'Khalil',
    submittedAt: '2025-05-18T09:15:00',
    details: 'Customer wants to purchase 5 Voyah Free vehicles for their company fleet. Requesting 10% discount approval.',
    comments: [
      { 
        author: 'Tamara', 
        text: 'I reviewed the proposal. This looks acceptable given our current sales targets.', 
        timestamp: '2025-05-18T11:30:00' 
      }
    ]
  },
  {
    id: '3', 
    requestType: 'Question',
    message: 'When will the new marketing materials arrive?',
    priority: 'low',
    status: 'answered',
    submittedBy: 'Tamara',
    submittedAt: '2025-05-17T11:45:00',
    details: 'We need the new brochures for the trade show next week. Have they been shipped yet?',
    comments: [
      { 
        author: 'Mark', 
        text: 'Marketing department confirmed they will arrive on Monday.', 
        timestamp: '2025-05-17T13:20:00' 
      }
    ]
  },
  {
    id: '4',
    requestType: 'Inventory',
    message: 'Low on oil filters',
    priority: 'high',
    status: 'submitted',
    submittedBy: 'Ali',
    submittedAt: '2025-05-20T10:15:00',
    details: 'We have less than 5 oil filters left in stock. Need to order more urgently.',
    comments: []
  },
  {
    id: '5',
    requestType: 'Question',
    message: 'Customer refund policy clarification',
    priority: 'medium',
    status: 'submitted',
    submittedBy: 'Tamara',
    submittedAt: '2025-05-21T09:30:00',
    details: 'Need clarification on the refund policy for custom parts that were ordered but not installed.',
    comments: []
  }
];

// Mock garage cars
const MOCK_GARAGE_CARS: GarageCar[] = [
  {
    id: '1',
    carModel: 'Voyah Free 2024',
    carCode: 'VF2401',
    customerName: 'Ahmad Khalil',
    entryDate: '2025-05-18',
    expectedExitDate: '2025-05-21',
    status: 'in_repair',
    assignedEmployee: 'Mark',
    notes: 'Brake system issue',
    lastUpdated: '2025-05-19T10:30:00',
    startTimestamp: '2025-05-18T14:30:00',
    endTimestamp: '',
    repairDuration: '2 hours, 30 minutes'
  },
  {
    id: '2',
    carModel: 'Voyah Dream 2024',
    carCode: 'VD2403',
    customerName: 'Maya Nassar',
    entryDate: '2025-05-19',
    expectedExitDate: '2025-05-22',
    status: 'in_diagnosis',
    assignedEmployee: 'Ali',
    notes: 'Engine check light on',
    lastUpdated: '2025-05-19T09:15:00',
    startTimestamp: '',
    endTimestamp: '',
  },
  {
    id: '3',
    carModel: 'MHero 917 2024',
    carCode: 'MH2402',
    customerName: 'Karim Abboud',
    entryDate: '2025-05-17',
    expectedExitDate: '2025-05-20',
    status: 'ready',
    assignedEmployee: 'Mark',
    notes: 'Regular maintenance complete',
    lastUpdated: '2025-05-20T11:45:00',
    startTimestamp: '2025-05-17T10:00:00',
    endTimestamp: '2025-05-20T11:45:00',
    repairDuration: '3 days, 1 hour, 45 minutes'
  }
];

// Mock scheduled appointments for today
const MOCK_SCHEDULED_TODAY = [
  {
    id: '1',
    customerName: 'Rami Haddad',
    carModel: 'Voyah Courage 2025',
    time: '14:30',
    type: 'Maintenance'
  },
  {
    id: '2',
    customerName: 'Layla Khoury',
    carModel: 'MHero 917 2024',
    time: '16:00',
    type: 'Diagnostic'
  },
  {
    id: '3',
    customerName: 'Omar Saab',
    carModel: 'Voyah Free 2024',
    time: '17:30',
    type: 'Tire Replacement'
  }
];

// Mock inventory items with low stock
const MOCK_LOW_STOCK_ITEMS = [
  { 
    id: '1', 
    name: 'Voyah Free Brake Pads', 
    currentStock: 3, 
    minStockLevel: 10 
  },
  { 
    id: '2', 
    name: 'Oil Filters Type A', 
    currentStock: 4, 
    minStockLevel: 15 
  },
  { 
    id: '3', 
    name: 'MHero Wiper Blades', 
    currentStock: 5, 
    minStockLevel: 10 
  },
  { 
    id: '4', 
    name: 'Voyah Dream Headlights', 
    currentStock: 2, 
    minStockLevel: 5 
  }
];

export const useDashboardData = () => {
  const { user } = useAuth();
  
  // State for various dashboard metrics
  const [pendingRequests, setPendingRequests] = useState(0);
  const [scheduledToday, setScheduledToday] = useState(0);
  const [carsInGarage, setCarsInGarage] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [roleSpecificMetrics, setRoleSpecificMetrics] = useState<any>({});
  
  // Generate role-specific metrics
  const generateRoleSpecificMetrics = (userRole: string) => {
    switch (userRole) {
      case 'owner':
        return {
          totalRevenue: 1250000,
          activeEmployees: 12,
          monthlySales: 24,
          quarterlyGrowth: 15.3
        };
      case 'garage_manager':
        return {
          teamEfficiency: 87,
          completedRepairs: 156,
          avgRepairTime: 2.4,
          mechanicsAvailable: 4
        };
      case 'sales':
        return {
          personalSales: 8,
          activeLeads: 15,
          availableCars: 32,
          targetProgress: 73,
          conversionRate: 24.5
        };
      case 'assistant':
        return {
          pendingTasks: 7,
          newArrivals: 5,
          scheduledAppointments: 12,
          processedToday: 8
        };
      default:
        return {
          activeTasks: 3,
          completedTasks: 12
        };
    }
  };

  // Generate role-specific activity
  const generateRoleSpecificActivity = (userRole: string) => {
    const baseActivity = [
      {
        type: 'system',
        message: 'System backup completed',
        details: '2 hours ago',
        link: '/dashboard'
      }
    ];

    const roleActivity = {
      owner: [
        {
          type: 'request',
          message: 'New approval request from Khalil',
          details: 'High priority • 30 minutes ago',
          link: '/requests'
        },
        {
          type: 'analytics',
          message: 'Monthly sales report ready',
          details: '1 hour ago',
          link: '/analytics'
        },
        {
          type: 'employee',
          message: 'New employee onboarding scheduled',
          details: 'Yesterday',
          link: '/employee-management'
        }
      ],
      garage_manager: [
        {
          type: 'repair',
          message: 'Repair VF2401 completed by Mark',
          details: '45 minutes ago',
          link: '/repairs'
        },
        {
          type: 'schedule',
          message: 'Tomorrow schedule updated',
          details: '2 hours ago',
          link: '/garage-schedule'
        },
        {
          type: 'inventory',
          message: 'Low stock alert: Brake pads',
          details: '3 hours ago',
          link: '/inventory'
        }
      ],
      sales: [
        {
          type: 'lead',
          message: 'New lead from website inquiry',
          details: '1 hour ago',
          link: '/sales'
        },
        {
          type: 'showroom',
          message: 'Customer viewing Voyah Dream',
          details: '2 hours ago',
          link: '/showroom-floor-1'
        },
        {
          type: 'sale',
          message: 'Sale completed: MHero 917',
          details: 'Yesterday',
          link: '/car-inventory'
        }
      ],
      assistant: [
        {
          type: 'arrival',
          message: 'New car arrival: Voyah Free',
          details: '1 hour ago',
          link: '/new-car-arrivals'
        },
        {
          type: 'appointment',
          message: 'Customer appointment scheduled',
          details: '2 hours ago',
          link: '/calendar'
        },
        {
          type: 'vin',
          message: 'VIN scan completed for MH2405',
          details: '3 hours ago',
          link: '/scan-vin'
        }
      ]
    };

    return [...(roleActivity[userRole as keyof typeof roleActivity] || []), ...baseActivity];
  };
  
  // This would be replaced with actual API calls in a real app
  useEffect(() => {
    // Calculate pending requests
    const pendingCount = MOCK_REQUESTS.filter(
      req => req.status === 'submitted' || req.status === 'reviewed'
    ).length;
    setPendingRequests(pendingCount);
    
    // Get scheduled appointments for today
    setScheduledToday(MOCK_SCHEDULED_TODAY.length);
    
    // Count cars currently in garage (not delivered)
    const garageCars = MOCK_GARAGE_CARS.filter(
      car => car.status !== 'delivered'
    ).length;
    setCarsInGarage(garageCars);
    
    // Count items with low stock
    setLowStockItems(MOCK_LOW_STOCK_ITEMS.length);
    
    // Generate role-specific metrics and activity
    if (user?.role) {
      setRoleSpecificMetrics(generateRoleSpecificMetrics(user.role));
      setRecentActivity(generateRoleSpecificActivity(user.role));
    }

    // Set up an interval to refresh data every 5 minutes
    const intervalId = setInterval(() => {
      console.log("Dashboard data refreshed");
    }, 300000); // 5 minutes in milliseconds
    
    return () => clearInterval(intervalId);
  }, [user?.role]);
  
  return {
    pendingRequests,
    scheduledToday,
    carsInGarage,
    lowStockItems,
    recentActivity,
    roleSpecificMetrics
  };
};
