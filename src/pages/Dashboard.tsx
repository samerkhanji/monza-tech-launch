import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '@/contexts/AuthContext'; // Temporarily disabled
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Car,
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  Ship,
  Settings,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Timer,
  Play,
  Pause,
  RefreshCw,
  ClipboardList,
  Save,
  X,
  FileText,
  Shield,
  Zap,
  MapPin,
  Gauge,
  BarChart3,
  Target,
  User,
  Package,
  Brain,
  TrendingDown,
  Eye,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';

import { dashboardDataService } from '@/services/dashboardDataService';
import { TabDataLinkingStatus } from '@/components/TabDataLinkingStatus';
import FormSaveTestComponent from '@/components/FormSaveTestComponent';

interface WorkChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  required: boolean;
  category: 'inspection' | 'repair' | 'testing' | 'documentation';
}

interface WorkChecklist {
  carId: string;
  carVin: string;
  carModel: string;
  workType: string;
  mechanic: string;
  items: WorkChecklistItem[];
  notes: string;
  lastUpdated: string;
}

const Dashboard: React.FC = () => {
  // const { user } = useAuth(); // Temporarily disabled
  const user = { id: 1, name: 'Samer', role: 'OWNER' }; // Mock user
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Enhanced dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalCars: 0,
    availableCars: 0,
    soldCars: 0,
    inProgressCars: 0,
    // Additional metrics
    totalRevenue: 0,
    monthlySales: 0,
    activeEmployees: 0,
    pendingRequests: 0,
    scheduledToday: 0,
    carsInGarage: 0,
    lowStockItems: 0,
    efficiencyScore: 0,
    customerSatisfaction: 0,
    recentActivities: [] as any[]
  });

  // New dashboard data sections
  const [inventoryByModel, setInventoryByModel] = useState<any[]>([]);
  const [garageBacklog, setGarageBacklog] = useState<any[]>([]);
  const [salesPipeline, setSalesPipeline] = useState<any[]>([]);
  const [todaysSchedule, setTodaysSchedule] = useState<any[]>([]);
  const [lowStockParts, setLowStockParts] = useState<any[]>([]);

  // Role-specific metrics
  const [roleMetrics, setRoleMetrics] = useState(dashboardDataService.getRoleSpecificMetrics());

  // Search function
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      // Search across all car data sources
      const allCars: any[] = [];
      
      // Get cars from different sources
      const inventoryCars = JSON.parse(localStorage.getItem('carInventory') || '[]');
      const garageCars = JSON.parse(localStorage.getItem('garageInventory') || '[]');
      const showroomCars = JSON.parse(localStorage.getItem('showroomFloor1') || '[]');
      const floor2Cars = JSON.parse(localStorage.getItem('showroomFloor2') || '[]');
      const garageScheduleCars = JSON.parse(localStorage.getItem('garageSchedule') || '[]');
      
      // Combine all cars with source information
      allCars.push(...inventoryCars.map((car: any) => ({ ...car, source: 'Inventory' })));
      allCars.push(...garageCars.map((car: any) => ({ ...car, source: 'Garage' })));
      allCars.push(...showroomCars.map((car: any) => ({ ...car, source: 'Showroom Floor 1' })));
      allCars.push(...floor2Cars.map((car: any) => ({ ...car, source: 'Showroom Floor 2' })));
      allCars.push(...garageScheduleCars.map((car: any) => ({ ...car, source: 'Garage Schedule' })));

      // Filter cars based on search query
      const filteredCars = allCars.filter((car: any) => {
        const searchTerm = query.toLowerCase();
        return (
          (car.vinNumber || car.vin || '').toLowerCase().includes(searchTerm) ||
          (car.model || car.carModel || '').toLowerCase().includes(searchTerm) ||
          (car.customerName || car.clientName || '').toLowerCase().includes(searchTerm) ||
          (car.year || '').toString().includes(searchTerm) ||
          (car.color || '').toLowerCase().includes(searchTerm) ||
          (car.brand || '').toLowerCase().includes(searchTerm) ||
          (car.status || '').toLowerCase().includes(searchTerm) ||
          (car.category || '').toLowerCase().includes(searchTerm)
        );
      });

      setSearchResults(filteredCars);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "An error occurred while searching for cars",
        variant: "destructive"
      });
    }
  };

  const handleCarClick = (car: any) => {
    // Navigate to appropriate page based on car source
    switch (car.source) {
      case 'Inventory':
        navigate('/car-inventory');
        break;
      case 'Garage':
        navigate('/garage-car-inventory');
        break;
      case 'Showroom Floor 1':
        navigate('/showroom-floor1');
        break;
      case 'Showroom Floor 2':
        navigate('/showroom-floor2');
        break;
      case 'Garage Schedule':
        navigate('/garage-schedule');
        break;
      default:
        navigate('/car-inventory');
    }
  };

  // Load comprehensive data using the service
  useEffect(() => {
    const loadComprehensiveData = async () => {
      try {
        const metrics = await dashboardDataService.getComprehensiveMetrics();
        
        setDashboardData({
          totalCars: metrics.totalCars,
          availableCars: metrics.availableCars,
          soldCars: metrics.soldCars,
          inProgressCars: metrics.inProgressCars,
          totalRevenue: metrics.totalRevenue,
          monthlySales: metrics.monthlySales,
          activeEmployees: metrics.activeEmployees,
          pendingRequests: metrics.pendingRequests,
          scheduledToday: metrics.scheduledToday,
          carsInGarage: metrics.carsInGarage,
          lowStockItems: metrics.lowStockItems,
          efficiencyScore: metrics.efficiencyScore,
          customerSatisfaction: metrics.customerSatisfaction,
          recentActivities: metrics.recentActivities.map(activity => ({
            ...activity,
            icon: getActivityIcon(activity.type)
          }))
        });
        
        // Load additional dashboard data sections
        const [inventoryData, garageData, salesData] = await Promise.all([
          dashboardDataService.getInventoryByModel(),
          dashboardDataService.getGarageBacklog(),
          dashboardDataService.getSalesPipeline()
        ]);
        
        setInventoryByModel(inventoryData);
        setGarageBacklog(garageData);
        setSalesPipeline(salesData);
        
        // Set sample data for sections that don't have service methods yet
        setTodaysSchedule([
          { type: 'Test Drive', customer: 'John Doe', model: 'Voyah FREE', time: '10:00 AM' },
          { type: 'Service', customer: 'Jane Smith', model: 'BMW X5', time: '2:00 PM' }
        ]);
        
        setLowStockParts([
          { partNumber: 'BMW001', name: 'Brake Pads', stock: 2, min: 5 },
          { partNumber: 'VYH002', name: 'Battery Pack', stock: 1, min: 3 }
        ]);
        
        console.log(`📊 Enhanced dashboard loaded ${metrics.totalCars} cars total`);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadComprehensiveData();
  }, [user?.role]);

  // Helper function to get activity icons
  const getActivityIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      car_arrival: Car,
      repair_complete: Wrench,
      sale_complete: DollarSign,
      appointment: Clock,
      maintenance: Settings,
      inventory: Package
    };
    
    return icons[type] || Activity;
  };

  // Update current time every minute for real-time tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Work checklist dialog state
  const [selectedCarForChecklist, setSelectedCarForChecklist] = useState<any>(null);
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [currentChecklist, setCurrentChecklist] = useState<WorkChecklist | null>(null);

  // Generate default checklist based on work type
  const generateDefaultChecklist = (car: any): WorkChecklist => {
    const baseItems: WorkChecklistItem[] = [
      { id: '1', task: 'Initial vehicle inspection', completed: false, required: true, category: 'inspection' },
      { id: '2', task: 'Check fluid levels', completed: false, required: true, category: 'inspection' },
      { id: '3', task: 'Battery status check', completed: false, required: true, category: 'inspection' },
      { id: '4', task: 'Document initial condition', completed: false, required: true, category: 'documentation' }
    ];

    return {
      carId: car.id,
      carVin: car.vinNumber,
      carModel: car.model,
      workType: 'General Service',
      mechanic: 'Available Mechanic',
      items: baseItems,
      notes: '',
      lastUpdated: new Date().toISOString()
    };
  };

  // Load or create checklist based on work type
  const saveChecklist = () => {
    if (!currentChecklist) return;
    
    const savedChecklists = localStorage.getItem('workChecklists');
    let checklists = savedChecklists ? JSON.parse(savedChecklists) : [];
    
    const existingIndex = checklists.findIndex((c: any) => c.carId === currentChecklist.carId);
    
    if (existingIndex >= 0) {
      checklists[existingIndex] = currentChecklist;
    } else {
      checklists.push(currentChecklist);
    }
    
    localStorage.setItem('workChecklists', JSON.stringify(checklists));
    
    toast({
      title: "Checklist Saved",
      description: "Work checklist has been saved successfully.",
    });
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!currentChecklist) return;
    
    setCurrentChecklist({
      ...currentChecklist,
      items: currentChecklist.items.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    });
  };

  const updateNotes = (notes: string) => {
    if (!currentChecklist) return;
    
    setCurrentChecklist({
      ...currentChecklist,
      notes
    });
  };

  const getCompletionPercentage = (checklist: WorkChecklist): number => {
    const completedItems = checklist.items.filter(item => item.completed).length;
    return Math.round((completedItems / checklist.items.length) * 100);
  };

  const formatDuration = (startTime: Date | string | undefined): string => {
    if (!startTime) return 'N/A';
    
    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) return 'N/A';
    
    const currentTime = new Date();
    const diffMs = currentTime.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string): string => {
    switch (status) {
      case 'available': return 'Available';
      case 'sold': return 'Sold';
      case 'reserved': return 'Reserved';
      default: return 'Unknown';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Real-time overview of your automotive operations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Time</p>
            <p className="text-lg font-semibold">{currentTime.toLocaleTimeString()}</p>
          </div>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>


        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-md">
        <Search className="h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search cars..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch(searchQuery);
            }
          }}
          className="flex-1 bg-transparent focus-visible:ring-0"
        />
        <Button variant="ghost" onClick={() => handleSearch(searchQuery)}>
          <Search className="h-4 w-4 text-gray-500" />
        </Button>
      </div>

      {/* Search Results */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-2">Search Results</h3>
          <div className="space-y-2">
            {searchResults.map((car, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => handleCarClick(car)}
              >
                <div className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{car.model}</p>
                    <p className="text-xs text-gray-500">
                      {car.vinNumber || car.vin} - {car.year} {car.color}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: <Badge className={getStatusColor(car.status)}>{getStatusDisplayName(car.status)}</Badge>
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{car.source}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
      {showSearchResults && searchResults.length === 0 && (
        <p className="mt-4 text-center text-gray-500">No cars found matching your search.</p>
      )}

      {/* Enhanced Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-green-50 border-green-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Available Cars</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{dashboardData.availableCars}</div>
            <p className="text-xs text-green-600">Ready for sale</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Sold Cars</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{dashboardData.soldCars}</div>
            <p className="text-xs text-blue-600">Completed sales</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Efficiency</CardTitle>
            <Gauge className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{dashboardData.efficiencyScore}%</div>
            <p className="text-xs text-purple-600">Team efficiency</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200 cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{dashboardData.customerSatisfaction}%</div>
            <p className="text-xs text-orange-600">Customer satisfaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-indigo-50 border-indigo-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-indigo-800 flex items-center gap-1">
              <Car className="h-3 w-3" />
              In Garage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-indigo-900">{dashboardData.carsInGarage}</div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-red-800 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-900">{dashboardData.pendingRequests}</div>
          </CardContent>
        </Card>

        <Card className="bg-teal-50 border-teal-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-teal-800 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-teal-900">{dashboardData.scheduledToday}</div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-amber-800 flex items-center gap-1">
              <Package className="h-3 w-3" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-amber-900">{dashboardData.lowStockItems}</div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-emerald-800 flex items-center gap-1">
              <User className="h-3 w-3" />
              Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-emerald-900">{dashboardData.activeEmployees}</div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50 border-rose-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-rose-800 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Monthly Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-rose-900">{dashboardData.monthlySales}</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Role-specific metrics */}
          {user?.role && roleMetrics[user.role as keyof typeof roleMetrics] && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(roleMetrics[user.role as keyof typeof roleMetrics]).map(([key, value]) => (
                <Card key={key} className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-blue-900">
                      {typeof value === 'number' && key.includes('Rate') ? `${value}%` : 
                       typeof value === 'number' && key.includes('Revenue') ? `$${(value / 1000000).toFixed(1)}M` :
                       typeof value === 'number' && key.includes('Time') ? `${value}h` :
                       value}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Performance indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Efficiency Score</span>
                  <div className="flex items-center gap-2">
                    <Progress value={dashboardData.efficiencyScore} className="w-20" />
                    <span className="text-sm font-medium">{dashboardData.efficiencyScore}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Customer Satisfaction</span>
                  <div className="flex items-center gap-2">
                    <Progress value={dashboardData.customerSatisfaction} className="w-20" />
                    <span className="text-sm font-medium">{dashboardData.customerSatisfaction}%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Inventory Turnover</span>
                  <div className="flex items-center gap-2">
                    <Progress value={Math.min(100, (dashboardData.soldCars / Math.max(1, dashboardData.totalCars)) * 100)} className="w-20" />
                    <span className="text-sm font-medium">{Math.round((dashboardData.soldCars / Math.max(1, dashboardData.totalCars)) * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Sales Targets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Goal</span>
                  <span className="text-sm font-medium">25 cars</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Sales</span>
                  <span className="text-sm font-medium">{dashboardData.monthlySales} cars</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Progress</span>
                  <div className="flex items-center gap-2">
                    <Progress value={(dashboardData.monthlySales / 25) * 100} className="w-20" />
                    <span className="text-sm font-medium">{Math.round((dashboardData.monthlySales / 25) * 100)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Revenue Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Revenue</span>
                    <span className="font-medium">${(dashboardData.totalRevenue / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Monthly Sales</span>
                    <span className="font-medium">{dashboardData.monthlySales} cars</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Average Price</span>
                    <span className="font-medium">${Math.round(dashboardData.totalRevenue / Math.max(1, dashboardData.soldCars)).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Operational Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Cars in Garage</span>
                    <span className="font-medium">{dashboardData.carsInGarage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pending Requests</span>
                    <span className="font-medium">{dashboardData.pendingRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Scheduled Today</span>
                    <span className="font-medium">{dashboardData.scheduledToday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Low Stock Items</span>
                    <span className="font-medium">{dashboardData.lowStockItems}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <activity.icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-blue-600" />
                  Car Inventory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Manage your vehicle inventory</p>
                <Button onClick={() => navigate('/car-inventory')} className="w-full">
                  View Inventory
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-orange-600" />
                  Garage Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Schedule and track repairs</p>
                <Button onClick={() => navigate('/garage-schedule')} className="w-full">
                  View Schedule
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">Track sales and customer data</p>
                <Button onClick={() => navigate('/sales')} className="w-full">
                  View Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* New Dashboard Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Inventory by Model */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-blue-600" />
                Inventory by Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inventoryByModel.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-500 border-b pb-2">
                    <span>Model</span>
                    <span>Trim</span>
                    <span>Total</span>
                    <span>S1</span>
                    <span>S2</span>
                  </div>
                  {inventoryByModel.map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 text-sm">
                      <span className="font-medium">{item.model}</span>
                      <span>{item.trim}</span>
                      <span>{item.total}</span>
                      <span>{item.s1}</span>
                      <span>{item.s2}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Garage Backlog */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-600" />
                Garage Backlog (Next 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {garageBacklog.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-6 gap-2 text-xs font-medium text-gray-500 border-b pb-2">
                    <span>VIN</span>
                    <span>Model</span>
                    <span>Status</span>
                    <span>Assigned</span>
                    <span>ETA</span>
                    <span>SLA</span>
                  </div>
                  {garageBacklog.map((item, index) => (
                    <div key={index} className="grid grid-cols-6 gap-2 text-sm">
                      <span className="font-mono text-xs">{item.vin}</span>
                      <span>{item.model}</span>
                      <span>{item.status}</span>
                      <span>{item.assigned}</span>
                      <span>{item.eta}</span>
                      <span className={item.sla === 'On track' ? 'text-green-600' : 'text-red-600'}>
                        {item.sla}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysSchedule.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-500 border-b pb-2">
                    <span>Type</span>
                    <span>Customer</span>
                    <span>Model</span>
                    <span>Time</span>
                  </div>
                  {todaysSchedule.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 text-sm">
                      <span>{item.type}</span>
                      <span>{item.customer}</span>
                      <span>{item.model}</span>
                      <span>{item.time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Sales Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Sales Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesPipeline.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium text-gray-500 border-b pb-2">
                    <span>Stage</span>
                    <span>Quantity</span>
                  </div>
                  {salesPipeline.map((item, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2 text-sm">
                      <span>{item.stage}</span>
                      <span className="font-medium">{item.quantity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Low-Stock Parts Alert */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Low-Stock Parts Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockParts.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-500 border-b pb-2">
                    <span>Part #</span>
                    <span>Name</span>
                    <span>Stock</span>
                    <span>Min</span>
                  </div>
                  {lowStockParts.map((item, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 text-sm">
                      <span className="font-mono text-xs">{item.partNumber}</span>
                      <span>{item.name}</span>
                      <span className={item.stock < item.min ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {item.stock}
                      </span>
                      <span>{item.min}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Form Save Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test various form saving scenarios to ensure data persistence works correctly across the application.
              </p>
              <FormSaveTestComponent />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tab Data Linking Status */}
      <div className="mt-6">
        <TabDataLinkingStatus showDetails={false} />
      </div>

      {/* Work Checklist Dialog */}
      <Dialog open={showChecklistDialog} onOpenChange={setShowChecklistDialog}>
        <DialogContent className="max-w-2xl" aria-describedby="work-checklist-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Work Checklist
              {selectedCarForChecklist && (
                <span className="text-sm text-gray-500">
                  - {selectedCarForChecklist.model} ({selectedCarForChecklist.vinNumber})
                </span>
              )}
            </DialogTitle>
            <p id="work-checklist-description" className="text-sm text-gray-600">
              Complete the work checklist items for this vehicle
            </p>
          </DialogHeader>
          
          {currentChecklist && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Progress</p>
                  <Progress value={getCompletionPercentage(currentChecklist)} className="w-full" />
                </div>
                <Badge variant="secondary">
                  {getCompletionPercentage(currentChecklist)}% Complete
                </Badge>
              </div>
              
              <div className="space-y-2">
                {currentChecklist.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                    />
                    <Label className={`flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                      {item.task}
                    </Label>
                    {item.required && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                ))}
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={currentChecklist.notes}
                  onChange={(e) => updateNotes(e.target.value)}
                  placeholder="Add work notes..."
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowChecklistDialog(false)}>
                  Close
                </Button>
                <Button onClick={saveChecklist}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Checklist
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
