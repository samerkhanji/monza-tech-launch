import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Eye,
  Edit,
  MapPin,
  Car,
  Battery,
  Calendar,
  DollarSign,
  User,
  Phone,
  Settings,
  Truck,
  Building,
  Wrench,
  Package,
  Warehouse,
  ShoppingCart,
  Navigation
} from 'lucide-react';

interface WorkflowLinkedTabsProps {
  vinNumber?: string;
  currentLocation?: string;
}

type WorkflowLocation = 
  | 'new_arrivals'
  | 'car_inventory'
  | 'garage_inventory'
  | 'showroom_floor_1'
  | 'showroom_floor_2'
  | 'showroom_inventory'
  | 'inventory_floor_2'
  | 'inventory_garage'
  | 'repairs'
  | 'garage_schedule'
  | 'sold'
  | 'shipped';

interface CarStatus {
  id: string;
  vinNumber: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  category: string;
  status: 'in_stock' | 'sold' | 'reserved';
  location: WorkflowLocation;
  pdiCompleted: boolean;
  pdiDate?: string;
  customs: 'paid' | 'not_paid' | 'pending';
  batteryPercentage: number;
  sellingPrice?: number;
  arrivalDate: string;
  clientName?: string;
  clientPhone?: string;
  lastUpdated: string;
  notes?: string;
  issues: string[];
  readyForDelivery: boolean;
  completionPercentage: number;
  nextAction: string;
  estimatedCompletion?: string;
  partsWaiting?: string[];
  repairStatus?: 'completed' | 'in_progress' | 'pending' | 'awaiting_parts';
  garageScheduled?: boolean;
  scheduleDate?: string;
  workType?: string;
}

const LOCATION_CONFIGS = {
  new_arrivals: { 
    name: 'New Car Arrivals', 
    route: '/new-car-arrivals', 
    icon: Car, 
    color: 'bg-blue-50 border-blue-200',
    description: 'Newly arrived vehicles awaiting processing',
    status: 'processing'
  },
  car_inventory: { 
    name: 'Car Inventory', 
    route: '/car-inventory', 
    icon: CheckCircle, 
    color: 'bg-green-50 border-green-200',
    description: 'Main vehicle inventory',
    status: 'ready'
  },
  garage_inventory: { 
    name: 'Inventory Garage', 
    route: '/garage-car-inventory', 
    icon: Wrench, 
    color: 'bg-yellow-50 border-yellow-200',
    description: 'Vehicles in garage for PDI and maintenance',
    status: 'attention'
  },
  showroom_floor_1: { 
    name: 'Showroom Floor 1', 
    route: '/showroom-floor-1', 
    icon: Car, 
    color: 'bg-purple-50 border-purple-200',
    description: 'Display vehicles on main showroom floor',
    status: 'ready'
  },
  showroom_floor_2: { 
    name: 'Showroom Floor 2', 
    route: '/showroom-floor-2', 
    icon: Car, 
    color: 'bg-indigo-50 border-indigo-200',
    description: 'Display vehicles on second showroom floor',
    status: 'ready'
  },
  showroom_inventory: { 
    name: 'Showroom Inventory', 
    route: '/showroom-inventory', 
    icon: Car, 
    color: 'bg-teal-50 border-teal-200',
    description: 'Vehicles ready for showroom display',
    status: 'ready'
  },
  inventory_floor_2: { 
    name: 'Inventory Floor 2', 
    route: '/inventory-floor-2', 
    icon: Package, 
    color: 'bg-cyan-50 border-cyan-200',
    description: 'Additional inventory storage',
    status: 'ready'
  },
  inventory_garage: { 
    name: 'Inventory Garage', 
    route: '/inventory-garage', 
    icon: Car, 
    color: 'bg-orange-50 border-orange-200',
    description: 'Garage inventory storage',
    status: 'attention'
  },
  repairs: { 
    name: 'Repairs', 
    route: '/repairs', 
    icon: AlertTriangle, 
    color: 'bg-red-50 border-red-200',
    description: 'Vehicles requiring repairs',
    status: 'attention'
  },
  garage_schedule: { 
    name: 'Garage Schedule', 
    route: '/garage-schedule', 
    icon: Clock, 
    color: 'bg-gray-50 border-gray-200',
    description: 'Scheduled garage work',
    status: 'attention'
  },
  sold: { 
    name: 'Sold', 
    route: '/car-inventory?status=sold', 
    icon: CheckCircle, 
    color: 'bg-green-50 border-green-200',
    description: 'Sold vehicles awaiting delivery',
    status: 'ready'
  },
  shipped: { 
    name: 'Shipped', 
    route: '/car-inventory?status=delivered', 
    icon: Truck, 
    color: 'bg-blue-50 border-blue-200',
    description: 'Delivered vehicles',
    status: 'processing'
  }
};

const WORKFLOW_PATHS = {
  new_arrivals: ['car_inventory'],
  car_inventory: ['garage_inventory', 'showroom_floor_1', 'showroom_floor_2', 'repairs'],
  garage_inventory: ['car_inventory', 'repairs', 'garage_schedule'],
  showroom_floor_1: ['showroom_floor_2', 'sold'],
  showroom_floor_2: ['showroom_floor_1', 'sold'],
  showroom_inventory: ['showroom_floor_1', 'showroom_floor_2'],
  inventory_floor_2: ['showroom_floor_2', 'showroom_inventory'],
  inventory_garage: ['garage_inventory', 'repairs'],
  repairs: ['garage_inventory', 'car_inventory', 'garage_schedule'],
  garage_schedule: ['repairs', 'garage_inventory'],
  sold: ['shipped'],
  shipped: []
};

export const WorkflowLinkedTabs: React.FC<WorkflowLinkedTabsProps> = ({ 
  vinNumber: initialVin, 
  currentLocation: initialLocation 
}) => {
  const [searchVin, setSearchVin] = useState(initialVin || '');
  const [selectedVin, setSelectedVin] = useState(initialVin || '');
  const [currentLocation, setCurrentLocation] = useState<WorkflowLocation>(
    (initialLocation && Object.keys(LOCATION_CONFIGS).includes(initialLocation)) 
      ? initialLocation as WorkflowLocation 
      : 'new_arrivals'
  );
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showAllCarsDialog, setShowAllCarsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [carToEdit, setCarToEdit] = useState<CarStatus | null>(null);
  const [carToMove, setCarToMove] = useState<CarStatus | null>(null);
  const [allCarsViewType, setAllCarsViewType] = useState<'needing_attention' | 'ready_for_delivery' | 'all'>('all');
  const [selectedCar, setSelectedCar] = useState<CarStatus | null>(null);
  const [allCars, setAllCars] = useState<CarStatus[]>([]);
  const [locationCounts, setLocationCounts] = useState<Record<WorkflowLocation, number>>({} as Record<WorkflowLocation, number>);
  const [needsAttentionCount, setNeedsAttentionCount] = useState(0);
  const [readyForDeliveryCount, setReadyForDeliveryCount] = useState(0);

  const navigate = useNavigate();

  // Load real car data from localStorage and process status
  useEffect(() => {
    const loadCarData = () => {
      // Get cars from different sources
      const carInventory = JSON.parse(localStorage.getItem('carInventory') || '[]');
      const garageCars = JSON.parse(localStorage.getItem('garageCars') || '[]');
      const showroomFloor1 = JSON.parse(localStorage.getItem('showroomFloor1Cars') || '[]');
      const showroomFloor2 = JSON.parse(localStorage.getItem('showroomFloor2Cars') || '[]');
      const garageSchedule = JSON.parse(localStorage.getItem('garageSchedules') || '[]');

      const processCarStatus = (car: any, location: WorkflowLocation): CarStatus => {
        const issues: string[] = [];
        let readyForDelivery = true;
        let nextAction = 'Ready for delivery';
        let completionPercentage = 100;

        // Check PDI status
        if (!car.pdiCompleted) {
          issues.push('PDI not completed');
          readyForDelivery = false;
          nextAction = 'Complete PDI inspection';
          completionPercentage -= 30;
        }

        // Check customs status
        if (car.customs !== 'paid') {
          issues.push(`Customs ${car.customs || 'not paid'}`);
          readyForDelivery = false;
          if (nextAction === 'Ready for delivery') {
            nextAction = 'Complete customs payment';
          }
          completionPercentage -= 25;
        }

        // Check battery level for EVs
        if ((car.category === 'EV' || car.category === 'REV') && (car.batteryPercentage || 0) < 80) {
          issues.push(`Low battery: ${car.batteryPercentage || 0}%`);
          if (readyForDelivery && nextAction === 'Ready for delivery') {
            nextAction = 'Charge battery to 80%+';
          }
          completionPercentage -= 10;
        }

        // Check if waiting for parts
        if (car.garageStatus === 'awaiting_parts' || car.repairStatus === 'awaiting_parts') {
          issues.push('Waiting for parts');
          readyForDelivery = false;
          nextAction = 'Parts delivery pending';
          completionPercentage -= 20;
        }

        // Check repair status
        if (car.garageStatus === 'in_repair' || car.repairStatus === 'in_progress') {
          issues.push('Under repair');
          readyForDelivery = false;
          nextAction = 'Complete repairs';
          completionPercentage -= 15;
        }

        // Check if scheduled in garage
        const isScheduled = garageSchedule.some((schedule: any) => 
          schedule.scheduledCars?.some((scheduledCar: any) => 
            scheduledCar.vinNumber === car.vinNumber || scheduledCar.carCode === car.vinNumber
          )
        );

        let partsWaiting: string[] = [];
        if (car.notes && car.notes.includes('parts')) {
          partsWaiting = ['Charging cable', 'Software update'];
        }

        return {
          id: car.id,
          vinNumber: car.vinNumber || car.vin,
          model: car.model,
          brand: car.brand || 'Unknown',
          year: car.year || new Date().getFullYear(),
          color: car.color || 'Unknown',
          category: car.category || 'EV',
          status: car.status || 'in_stock',
          location,
          pdiCompleted: car.pdiCompleted || false,
          pdiDate: car.pdiDate,
          customs: car.customs || 'not_paid',
          batteryPercentage: car.batteryPercentage || 0,
          sellingPrice: car.sellingPrice,
          arrivalDate: car.arrivalDate || new Date().toISOString(),
          clientName: car.clientName,
          clientPhone: car.clientPhone,
          lastUpdated: car.lastUpdated || new Date().toISOString(),
          notes: car.notes,
          issues,
          readyForDelivery,
          completionPercentage: Math.max(completionPercentage, 0),
          nextAction,
          estimatedCompletion: readyForDelivery ? 'Complete' : getEstimatedCompletion(issues),
          partsWaiting,
          repairStatus: car.repairStatus,
          garageScheduled: isScheduled,
          scheduleDate: isScheduled ? new Date().toISOString() : undefined,
          workType: car.garageStatus
        };
      };

      const getEstimatedCompletion = (issues: string[]): string => {
        if (issues.includes('Waiting for parts')) return '3-5 days';
        if (issues.includes('Under repair')) return '1-2 days';
        if (issues.includes('PDI not completed')) return '1 day';
        if (issues.includes('Customs not paid')) return '2-3 days';
        return '< 1 day';
      };

      // Process all cars
      const processedCars: CarStatus[] = [
        ...carInventory.map((car: any) => processCarStatus(car, 'car_inventory')),
        ...garageCars.map((car: any) => processCarStatus(car, 'garage_inventory')),
        ...showroomFloor1.map((car: any) => processCarStatus(car, 'showroom_floor_1')),
        ...showroomFloor2.map((car: any) => processCarStatus(car, 'showroom_floor_2'))
      ];

      setAllCars(processedCars);

      // Calculate location counts from real data
      const showroomInventory = JSON.parse(localStorage.getItem('showroomInventory') || '[]');
      const inventoryFloor2 = JSON.parse(localStorage.getItem('inventoryFloor2') || '[]');
      const inventoryGarage = JSON.parse(localStorage.getItem('inventoryGarage') || '[]');
      const newCarArrivals = JSON.parse(localStorage.getItem('newCarArrivals') || '[]');
      const garageSchedules = JSON.parse(localStorage.getItem('garageSchedules') || '[]');
      const orderedCars = JSON.parse(localStorage.getItem('orderedCars') || '[]');

      // Calculate garage scheduled cars
      const scheduledCarsCount = garageSchedules.reduce((total: number, schedule: any) => {
        return total + (schedule.scheduledCars?.length || 0);
      }, 0);

      // Calculate shipped/delivered cars (cars with delivered status)
      const shippedCount = orderedCars.filter((car: any) => 
        car.status === 'delivered' || car.status === 'completed'
      ).length;

      // Calculate new arrivals (cars that arrived recently or pending PDI)
      const newArrivalsCount = newCarArrivals.filter((car: any) => 
        !car.pdiCompleted || car.status === 'pending'
      ).length;

      const counts: Record<WorkflowLocation, number> = {
        new_arrivals: newArrivalsCount,
        car_inventory: carInventory.filter((car: any) => car.status !== 'sold' && car.status !== 'reserved').length,
        garage_inventory: garageCars.length,
        showroom_floor_1: showroomFloor1.filter((car: any) => car.status !== 'sold').length,
        showroom_floor_2: showroomFloor2.filter((car: any) => car.status !== 'sold').length,
        showroom_inventory: showroomInventory.length,
        inventory_floor_2: inventoryFloor2.length,
        inventory_garage: inventoryGarage.length,
        repairs: processedCars.filter(car => car.repairStatus === 'in_progress').length,
        garage_schedule: scheduledCarsCount,
        sold: processedCars.filter(car => car.status === 'sold').length,
        shipped: shippedCount
      };

      setLocationCounts(counts);

      // Calculate summary counts
      const needsAttention = processedCars.filter(car => !car.readyForDelivery).length;
      const readyForDelivery = processedCars.filter(car => car.readyForDelivery).length;
      
      setNeedsAttentionCount(needsAttention);
      setReadyForDeliveryCount(readyForDelivery);
    };

    loadCarData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadCarData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = () => {
    if (!searchVin.trim()) {
      toast({
        title: "Please enter a VIN",
        description: "Enter a VIN number to search for a vehicle.",
        variant: "destructive"
      });
      return;
    }

    const foundCar = allCars.find(car => 
      car.vinNumber.toLowerCase().includes(searchVin.toLowerCase())
    );

    if (foundCar) {
      setSelectedVin(searchVin);
      setSelectedCar(foundCar);
      setCurrentLocation(foundCar.location);
      setShowDetailDialog(true);
    } else {
      toast({
        title: "Vehicle not found",
        description: `No vehicle found with VIN: ${searchVin}`,
        variant: "destructive"
      });
    }
  };

  const navigateToLocation = (location: WorkflowLocation, vinNumber?: string) => {
    const config = LOCATION_CONFIGS[location];
    if (!config) {
      console.error(`No configuration found for location: ${location}`);
      toast({
        title: "Navigation Error",
        description: `Unable to navigate to ${location}. Configuration not found.`,
        variant: "destructive"
      });
      return;
    }

    let url = config.route;
    
    // Add VIN as URL parameter if provided
    if (vinNumber) {
      url += `?vin=${encodeURIComponent(vinNumber)}`;
    }
    
    console.log(`Navigating to: ${url} for location: ${location}`);
    
    // Navigate to the page
    try {
      navigate(url);
    } catch (error) {
      console.error('Navigation error:', error);
      toast({
        title: "Navigation Failed",
        description: `Failed to open ${config.name}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (location: WorkflowLocation) => {
    const config = LOCATION_CONFIGS[location];
    const IconComponent = config.icon;
    
    if (config.status === 'attention') {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    } else if (config.status === 'ready') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (config.status === 'processing') {
      return <Clock className="h-4 w-4 text-blue-500" />;
    } else {
      return <IconComponent className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLocationsByStatus = () => {
    const needsAttention: WorkflowLocation[] = [];
    const ready: WorkflowLocation[] = [];
    const processing: WorkflowLocation[] = [];

    Object.entries(LOCATION_CONFIGS).forEach(([key, config]) => {
      const location = key as WorkflowLocation;
      const count = locationCounts[location] || 0;
      
      if (count > 0) {
        if (config.status === 'attention') {
          needsAttention.push(location);
        } else if (config.status === 'ready') {
          ready.push(location);
        } else {
          processing.push(location);
        }
      }
    });

    return { needsAttention, ready, processing };
  };

  const { needsAttention, ready, processing } = getLocationsByStatus();

  const getCarsNeedingAttention = () => {
    return allCars.filter(car => !car.readyForDelivery);
  };

  const getCarsReadyForDelivery = () => {
    return allCars.filter(car => car.readyForDelivery);
  };

  const handleViewAllCars = (type: 'needing_attention' | 'ready_for_delivery' | 'all') => {
    setAllCarsViewType(type);
    setShowAllCarsDialog(true);
  };

  const getAllCarsForView = () => {
    switch (allCarsViewType) {
      case 'needing_attention':
        return getCarsNeedingAttention();
      case 'ready_for_delivery':
        return getCarsReadyForDelivery();
      default:
        return allCars;
    }
  };

  const getDialogTitle = () => {
    switch (allCarsViewType) {
      case 'needing_attention':
        return `Cars Needing Attention (${getCarsNeedingAttention().length})`;
      case 'ready_for_delivery':
        return `Cars Ready for Delivery (${getCarsReadyForDelivery().length})`;
      default:
        return `All Cars in System (${allCars.length})`;
    }
  };

  // Action button handlers
  const handleViewDetails = (car: CarStatus) => {
    setSelectedCar(car);
    setSelectedVin(car.vinNumber);
    setSearchVin(car.vinNumber);
    setShowAllCarsDialog(false);
    setShowDetailDialog(true);
  };

  const handleEditCar = (car: CarStatus) => {
    setCarToEdit(car);
    setShowEditDialog(true);
  };

  const handleMoveCar = (car: CarStatus) => {
    setCarToMove(car);
    setShowMoveDialog(true);
  };

  const handleSaveCarEdit = (carId: string, updates: Partial<CarStatus>) => {
    // Update the car in the appropriate localStorage location
    const updateCarInStorage = (storageKey: string, carId: string, updates: any) => {
      const existingCars = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const updatedCars = existingCars.map((car: any) => 
        car.id === carId ? { ...car, ...updates } : car
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedCars));
      return updatedCars;
    };

    // Update car in all possible storage locations
    const storageKeys = ['carInventory', 'garageCars', 'showroomFloor1Cars', 'showroomFloor2Cars'];
    
    storageKeys.forEach(key => {
      updateCarInStorage(key, carId, updates);
    });

    // Update local state
    setAllCars(prevCars => 
      prevCars.map(car => 
        car.id === carId ? { ...car, ...updates } : car
      )
    );

    setShowEditDialog(false);
    setCarToEdit(null);
  };

  const handleConfirmMove = (destination: WorkflowLocation, notes?: string) => {
    if (!carToMove) return;

    // Here you would implement the actual move logic
    // For now, we'll just show a success message and update the location
    const updatedCar = { ...carToMove, location: destination };
    
    // Update local state
    setAllCars(prevCars => 
      prevCars.map(car => 
        car.id === carToMove.id ? updatedCar : car
      )
    );

    setShowMoveDialog(false);
    setCarToMove(null);

    // Navigate to the destination page
    navigateToLocation(destination, carToMove.vinNumber);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Vehicle Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Vehicle Search & Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="vin-search">Search by VIN</Label>
              <Input
                id="vin-search"
                placeholder="Enter VIN number to see detailed status"
                value={searchVin}
                onChange={(e) => setSearchVin(e.target.value)}
                className="font-mono"
              />
            </div>
            <Button 
              onClick={handleSearch}
              className="mt-6 bg-monza-yellow text-monza-black hover:bg-monza-yellow/90"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs value="locations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="locations">All Locations</TabsTrigger>
          <TabsTrigger value="workflow">Workflow Path</TabsTrigger>
          <TabsTrigger value="history">Movement History</TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-6">
          {/* Summary Cards - No Scroll Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cars Needing Attention */}
            <Card className="border-2 border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="text-lg flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Cars Needing Attention ({getCarsNeedingAttention().length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {getCarsNeedingAttention().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>All cars are ready for delivery!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getCarsNeedingAttention().slice(0, 3).map((car) => (
                      <div key={car.id} className="bg-white border border-red-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                           onClick={() => {
                             setSelectedCar(car);
                             setSelectedVin(car.vinNumber);
                             setSearchVin(car.vinNumber);
                             setShowDetailDialog(true);
                           }}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{car.brand} {car.model}</h4>
                            <p className="text-xs text-gray-600">VIN: {car.vinNumber}</p>
                            <p className="text-xs text-gray-600">{LOCATION_CONFIGS[car.location].name}</p>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {car.completionPercentage}%
                          </Badge>
                        </div>
                        
                        <div className="mb-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-red-500 h-1.5 rounded-full"
                              style={{ width: `${car.completionPercentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-gray-700 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {car.nextAction}
                          </p>
                          
                          {car.issues.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {car.issues.slice(0, 2).map((issue, index) => (
                                <Badge key={index} variant="outline" className="text-xs text-red-600 border-red-300">
                                  {issue}
                                </Badge>
                              ))}
                              {car.issues.length > 2 && (
                                <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                                  +{car.issues.length - 2} more
                                </Badge>
                              )}
                            </div>
                          )}

                          {car.estimatedCompletion && car.estimatedCompletion !== 'Complete' && (
                            <p className="text-xs text-blue-600 font-medium">
                              ETA: {car.estimatedCompletion}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {getCarsNeedingAttention().length > 3 && (
                      <div className="text-center py-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewAllCars('needing_attention')}>
                          View All {getCarsNeedingAttention().length} Cars
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cars Ready for Delivery */}
            <Card className="border-2 border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Ready for Delivery ({getCarsReadyForDelivery().length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {getCarsReadyForDelivery().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-orange-500" />
                    <p>No cars ready for delivery yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getCarsReadyForDelivery().slice(0, 3).map((car) => (
                      <div key={car.id} className="bg-white border border-green-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                           onClick={() => {
                             setSelectedCar(car);
                             setSelectedVin(car.vinNumber);
                             setSearchVin(car.vinNumber);
                             setShowDetailDialog(true);
                           }}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{car.brand} {car.model}</h4>
                            <p className="text-xs text-gray-600">VIN: {car.vinNumber}</p>
                            <p className="text-xs text-gray-600">{LOCATION_CONFIGS[car.location].name}</p>
                          </div>
                          <Badge className="text-xs bg-green-500">
                            ✓ Ready
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center p-1 bg-green-50 rounded">
                            <p className="text-green-700 font-medium">PDI</p>
                            <p className="text-green-600">{car.pdiCompleted ? '✓' : '✗'}</p>
                          </div>
                          <div className="text-center p-1 bg-green-50 rounded">
                            <p className="text-green-700 font-medium">Customs</p>
                            <p className="text-green-600">{car.customs === 'paid' ? '✓' : '✗'}</p>
                          </div>
                          <div className="text-center p-1 bg-green-50 rounded">
                            <p className="text-green-700 font-medium">Battery</p>
                            <p className="text-green-600">{car.batteryPercentage}%</p>
                          </div>
                        </div>

                        {car.clientName && (
                          <div className="mt-2 text-xs text-gray-600">
                            <p>Client: {car.clientName}</p>
                            {car.clientPhone && <p>Phone: {car.clientPhone}</p>}
                          </div>
                        )}

                        {car.sellingPrice && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                              ${car.sellingPrice.toLocaleString()}
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                    {getCarsReadyForDelivery().length > 3 && (
                      <div className="text-center py-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewAllCars('ready_for_delivery')}>
                          View All {getCarsReadyForDelivery().length} Cars
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Locations Grid - Single Layout */}
          <Card>
            <CardHeader>
              <CardTitle>All Location Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Object.entries(LOCATION_CONFIGS).map(([key, config]) => {
                  const location = key as WorkflowLocation;
                  const count = locationCounts[location] || 0;
                  const IconComponent = config.icon;
                  
                  return (
                    <Card 
                      key={location} 
                      className={`cursor-pointer transition-all hover:shadow-md border-2 ${config.color}`}
                      onClick={() => navigateToLocation(location)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(location)}
                            <div className="flex-1">
                              <h3 className="font-medium text-sm">{config.name}</h3>
                              <p className="text-xs text-gray-600 mb-1">{config.description}</p>
                              <Badge variant="secondary" className="text-xs">
                                {count} vehicles
                              </Badge>
                            </div>
                          </div>
                          <IconComponent className="h-6 w-6 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          {selectedVin && selectedCar ? (
            <Card>
              <CardHeader>
                <CardTitle>Workflow Path for {selectedCar.model}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Current Location</Badge>
                    <span className="font-medium">{LOCATION_CONFIGS[currentLocation].name}</span>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Available Next Locations:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(WORKFLOW_PATHS[currentLocation] || []).map(nextLocation => (
                        <Badge 
                          key={nextLocation} 
                          variant="outline"
                          className="cursor-pointer hover:bg-monza-yellow hover:text-monza-black transition-colors"
                          onClick={() => navigateToLocation(nextLocation)}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          {LOCATION_CONFIGS[nextLocation].name}
                        </Badge>
                      ))}
                      {(WORKFLOW_PATHS[currentLocation] || []).length === 0 && (
                        <p className="text-sm text-gray-500">No available moves from current location</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Search for a VIN to see workflow path</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {allCars.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recent Movement History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allCars.slice(0, 10).map((car) => (
                    <div key={car.id} className="flex items-start gap-4 p-3 border rounded-lg bg-gray-50">
                      <ArrowRight className="h-4 w-4 mt-1 text-blue-500" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm mb-1">
                          <Badge variant="outline">{LOCATION_CONFIGS[car.location]?.name}</Badge>
                          <ArrowRight className="h-3 w-3" />
                          <Badge variant="outline">{car.status === 'sold' ? 'Sold' : 'In Stock'}</Badge>
                        </div>
                        <p className="text-sm font-medium text-gray-900">VIN: {car.vinNumber}</p>
                        <p className="text-sm text-gray-600">{car.model}</p>
                        <p className="text-xs text-gray-500">
                          {car.status === 'sold' ? 'Sold' : 'In Stock'} • {new Date(car.lastUpdated).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No movement history available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Car Details Dialog - Keep existing dialog content but remove nested scroll areas */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedCar && `${selectedCar.brand} ${selectedCar.model} (${selectedCar.year}) - Complete Details`}
            </DialogTitle>
            <DialogDescription>
              Comprehensive vehicle information and status overview
            </DialogDescription>
          </DialogHeader>
          
          {selectedCar && (
            <div className="space-y-6 p-4">
              {/* Vehicle Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">VIN Number</Label>
                    <p className="font-mono text-sm font-medium">{selectedCar.vinNumber}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Model</Label>
                    <p className="font-medium">{selectedCar.model}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Brand</Label>
                    <p className="font-medium">{selectedCar.brand}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Year</Label>
                    <p className="font-medium">{selectedCar.year}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-600">Color</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: selectedCar.color?.toLowerCase() }}
                        />
                        <p className="font-medium">{selectedCar.color}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Category</Label>
                      <Badge className="mt-1" variant="outline">{selectedCar.category}</Badge>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Current Location</Label>
                      <p className="font-medium mt-1">{LOCATION_CONFIGS[selectedCar.location]?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Arrival Date</Label>
                      <p className="font-medium mt-1">{selectedCar.arrivalDate ? new Date(selectedCar.arrivalDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Technical Specifications</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-600">Battery Level</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${selectedCar.batteryPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{selectedCar.batteryPercentage}%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Status</Label>
                      <Badge className={`mt-1 ${
                        selectedCar.status === 'in_stock' ? 'bg-green-100 text-green-800' :
                        selectedCar.status === 'sold' ? 'bg-red-100 text-red-800' :
                        selectedCar.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedCar.status === 'in_stock' ? 'Available' : selectedCar.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">PDI Status</Label>
                      <Badge className={`mt-1 ${selectedCar.pdiCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {selectedCar.pdiCompleted ? 'Complete' : 'Pending'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Customs</Label>
                      <Badge className={`mt-1 ${
                        selectedCar.customs === 'paid' ? 'bg-green-100 text-green-800' :
                        selectedCar.customs === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedCar.customs}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                {selectedCar.sellingPrice && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Pricing Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm text-gray-600">Selling Price</Label>
                        <p className="font-bold text-lg text-green-600">${selectedCar.sellingPrice.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-600">Completion</Label>
                        <p className="font-medium">{selectedCar.completionPercentage}%</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress & Next Actions */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Progress & Next Actions</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600">Completion Progress</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full ${selectedCar.readyForDelivery ? 'bg-green-500' : 'bg-orange-500'}`}
                            style={{ width: `${selectedCar.completionPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{selectedCar.completionPercentage}%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Next Action</Label>
                      <p className="font-medium mt-1">{selectedCar.nextAction}</p>
                    </div>
                    {selectedCar.estimatedCompletion && selectedCar.estimatedCompletion !== 'Complete' && (
                      <div>
                        <Label className="text-sm text-gray-600">Estimated Completion</Label>
                        <p className="font-medium mt-1">{selectedCar.estimatedCompletion}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Client Information (if applicable) */}
              {selectedCar.clientName && (
                <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg border-b border-amber-200 pb-2">Client Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Client Name</Label>
                      <p className="font-medium">{selectedCar.clientName}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Phone Number</Label>
                      <p className="font-medium">{selectedCar.clientPhone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Issues Requiring Attention */}
              {selectedCar.issues.length > 0 && (
                <div className="space-y-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg border-b border-red-200 pb-2 text-red-700">Issues Requiring Attention</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCar.issues.map((issue, index) => (
                      <Badge key={index} variant="outline" className="text-red-600 border-red-300 bg-red-100">
                        {issue}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Parts Waiting */}
              {selectedCar.partsWaiting && selectedCar.partsWaiting.length > 0 && (
                <div className="space-y-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg border-b border-yellow-200 pb-2 text-yellow-700">Parts Waiting</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCar.partsWaiting.map((part, index) => (
                      <Badge key={index} variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-100">
                        {part}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Notes */}
              {selectedCar.notes && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Additional Notes</h3>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedCar.notes}</p>
                  </div>
                </div>
              )}

              {/* Important Dates */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Important Dates</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Arrival Date</Label>
                    <p className="font-medium">{selectedCar.arrivalDate ? new Date(selectedCar.arrivalDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  {selectedCar.pdiDate && (
                    <div>
                      <Label className="text-sm text-gray-600">PDI Completed</Label>
                      <p className="font-medium">{new Date(selectedCar.pdiDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm text-gray-600">Last Updated</Label>
                    <p className="font-medium">{new Date(selectedCar.lastUpdated).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  onClick={() => {
                    setCarToEdit(selectedCar);
                    setShowEditDialog(true);
                    setShowDetailDialog(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Car
                </Button>
                <Button 
                  onClick={() => {
                    setCarToMove(selectedCar);
                    setShowMoveDialog(true);
                    setShowDetailDialog(false);
                  }}
                  variant="outline"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Move Car
                </Button>
                <Button 
                  onClick={() => navigateToLocation(selectedCar.location, selectedCar.vinNumber)}
                  variant="outline"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Go to Location
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* All Cars Dialog - Scrollable View */}
      <Dialog open={showAllCarsDialog} onOpenChange={setShowAllCarsDialog}>
        <DialogContent className="max-w-7xl max-h-[95vh] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Car className="h-6 w-6 text-monza-yellow" />
              {getDialogTitle()}
            </DialogTitle>
            <DialogDescription>
              {allCarsViewType === 'all' ? 'Complete list of all cars in the system' : 
               allCarsViewType === 'needing_attention' ? 'Cars that require attention before delivery' :
               'Cars that are ready for delivery to customers'}
            </DialogDescription>
          </DialogHeader>
          
          {/* Scrollable Cars List */}
          <div className="max-h-[70vh] overflow-y-auto pr-4" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#ffd700 #f8fafc'
          }}>
            <div className="space-y-4">
              {getAllCarsForView().map((car) => (
                <Card key={car.id} className={`hover:shadow-md transition-shadow cursor-pointer border-2 ${
                  car.readyForDelivery ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
                onClick={() => {
                  setSelectedCar(car);
                  setSelectedVin(car.vinNumber);
                  setSearchVin(car.vinNumber);
                  setShowAllCarsDialog(false);
                  setShowDetailDialog(true);
                }}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      {/* Car Basic Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-500" />
                          <h3 className="font-semibold text-lg">{car.brand} {car.model}</h3>
                          <Badge className={car.readyForDelivery ? 'bg-green-500' : 'bg-red-500'}>
                            {car.readyForDelivery ? '✓ Ready' : '⚠ Needs Attention'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 font-mono">VIN: {car.vinNumber}</p>
                        <p className="text-sm text-gray-600">Year: {car.year} • Color: {car.color}</p>
                        <p className="text-sm text-blue-600">{LOCATION_CONFIGS[car.location].name}</p>
                      </div>

                      {/* Status & Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Status</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Completion</span>
                            <span className="text-sm font-medium">{car.completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${car.readyForDelivery ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${car.completionPercentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {car.nextAction}
                          </p>
                        </div>
                      </div>

                      {/* Technical Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Battery className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Technical</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-center p-2 bg-gray-100 rounded">
                            <p className="text-gray-600">Category</p>
                            <Badge variant="outline" className="text-xs mt-1">{car.category}</Badge>
                          </div>
                          <div className="text-center p-2 bg-gray-100 rounded">
                            <p className="text-gray-600">Battery</p>
                            <p className="font-medium">{car.batteryPercentage}%</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-center p-2 bg-gray-100 rounded">
                            <p className="text-gray-600">PDI</p>
                            <p className={`font-medium ${car.pdiCompleted ? 'text-green-600' : 'text-red-600'}`}>
                              {car.pdiCompleted ? '✓ Done' : '✗ Pending'}
                            </p>
                          </div>
                          <div className="text-center p-2 bg-gray-100 rounded">
                            <p className="text-gray-600">Customs</p>
                            <p className={`font-medium ${car.customs === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                              {car.customs === 'paid' ? '✓ Paid' : '✗ Pending'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Client & Financial */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">Financial</span>
                        </div>
                        {car.sellingPrice && (
                          <div className="text-center p-2 bg-green-100 rounded">
                            <p className="text-gray-600">Price</p>
                            <p className="font-bold text-green-700">${car.sellingPrice.toLocaleString()}</p>
                          </div>
                        )}
                        {car.clientName && (
                          <div className="space-y-1 p-2 bg-blue-100 rounded">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <p className="text-sm font-medium">{car.clientName}</p>
                            </div>
                            {car.clientPhone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <p className="text-xs text-gray-600">{car.clientPhone}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {car.estimatedCompletion && car.estimatedCompletion !== 'Complete' && (
                          <div className="text-center p-2 bg-orange-100 rounded">
                            <p className="text-gray-600">ETA</p>
                            <p className="font-medium text-orange-700">{car.estimatedCompletion}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Issues Section */}
                    {car.issues.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <span className="font-medium text-orange-700">Issues Requiring Attention</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {car.issues.map((issue, index) => (
                            <Badge key={index} variant="outline" className="text-red-600 border-red-300">
                              {issue}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(car);
                      }}>
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleEditCar(car);
                      }}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        handleMoveCar(car);
                      }}>
                        <MapPin className="h-3 w-3 mr-1" />
                        Move
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {getAllCarsForView().length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Car className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Cars Found</h3>
                  <p>No cars match the current filter criteria.</p>
                </div>
              )}
            </div>
          </div>

          {/* Dialog Footer */}
          <div className="mt-6 pt-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {getAllCarsForView().length} car{getAllCarsForView().length !== 1 ? 's' : ''}
              {allCarsViewType !== 'all' && ` (${allCarsViewType.replace('_', ' ')})`}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAllCarsViewType('all')}>
                Show All Cars
              </Button>
              <Button variant="outline" onClick={() => setAllCarsViewType('needing_attention')}>
                Needs Attention
              </Button>
              <Button variant="outline" onClick={() => setAllCarsViewType('ready_for_delivery')}>
                Ready for Delivery
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Car Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Car Information
            </DialogTitle>
            <DialogDescription>
              {carToEdit && `Update details for ${carToEdit.brand} ${carToEdit.model} (VIN: ${carToEdit.vinNumber})`}
            </DialogDescription>
          </DialogHeader>
          
          {carToEdit && (
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" defaultValue={carToEdit.brand} />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" defaultValue={carToEdit.model} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" defaultValue={carToEdit.year} />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" defaultValue={carToEdit.color} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select id="category" className="w-full p-2 border rounded" defaultValue={carToEdit.category}>
                    <option value="EV">Electric Vehicle (EV)</option>
                    <option value="REV">Range Extended Vehicle (REV)</option>
                    <option value="ICEV">Internal Combustion Engine Vehicle (ICEV)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="batteryPercentage">Battery Percentage</Label>
                  <Input id="batteryPercentage" type="number" min="0" max="100" defaultValue={carToEdit.batteryPercentage} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customs">Customs Status</Label>
                  <select id="customs" className="w-full p-2 border rounded" defaultValue={carToEdit.customs}>
                    <option value="not_paid">Not Paid</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="sellingPrice">Selling Price</Label>
                  <Input id="sellingPrice" type="number" defaultValue={carToEdit.sellingPrice || ''} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input id="clientName" defaultValue={carToEdit.clientName || ''} />
                </div>
                <div>
                  <Label htmlFor="clientPhone">Client Phone</Label>
                  <Input id="clientPhone" defaultValue={carToEdit.clientPhone || ''} />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea 
                  id="notes" 
                  className="w-full p-2 border rounded min-h-[80px]" 
                  defaultValue={carToEdit.notes || ''}
                  placeholder="Additional notes about this vehicle..."
                />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={() => {
                    const form = document.querySelector('#editCarForm') as HTMLFormElement;
                    const formData = new FormData(form);
                    const updates = {
                      brand: (document.getElementById('brand') as HTMLInputElement).value,
                      model: (document.getElementById('model') as HTMLInputElement).value,
                      year: parseInt((document.getElementById('year') as HTMLInputElement).value),
                      color: (document.getElementById('color') as HTMLInputElement).value,
                      category: (document.getElementById('category') as HTMLSelectElement).value,
                      batteryPercentage: parseInt((document.getElementById('batteryPercentage') as HTMLInputElement).value),
                      customs: (document.getElementById('customs') as HTMLSelectElement).value as 'paid' | 'not_paid' | 'pending',
                      sellingPrice: parseFloat((document.getElementById('sellingPrice') as HTMLInputElement).value) || undefined,
                      clientName: (document.getElementById('clientName') as HTMLInputElement).value || undefined,
                      clientPhone: (document.getElementById('clientPhone') as HTMLInputElement).value || undefined,
                      notes: (document.getElementById('notes') as HTMLTextAreaElement).value || undefined,
                      lastUpdated: new Date().toISOString()
                    };
                    handleSaveCarEdit(carToEdit.id, updates);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Move Car Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Move Car to Different Location
            </DialogTitle>
            <DialogDescription>
              {carToMove && `Select a new location for ${carToMove.brand} ${carToMove.model} (VIN: ${carToMove.vinNumber})`}
            </DialogDescription>
          </DialogHeader>
          
          {carToMove && (
            <div className="space-y-4 p-4">
              <div>
                <Label htmlFor="currentLocation">Current Location</Label>
                <div className="p-2 bg-gray-100 rounded font-medium">
                  {LOCATION_CONFIGS[carToMove.location].name}
                </div>
              </div>

              <div>
                <Label htmlFor="newLocation">New Location</Label>
                <select id="newLocation" className="w-full p-2 border rounded">
                  <option value="">Select destination...</option>
                  {Object.entries(LOCATION_CONFIGS).map(([key, config]) => (
                    <option key={key} value={key} disabled={key === carToMove.location}>
                      {config.name}
                      {key === carToMove.location ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="moveNotes">Notes (Optional)</Label>
                <textarea 
                  id="moveNotes" 
                  className="w-full p-2 border rounded min-h-[80px]" 
                  placeholder="Reason for move, special instructions, etc..."
                />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  onClick={() => {
                    const newLocation = (document.getElementById('newLocation') as HTMLSelectElement).value as WorkflowLocation;
                    const notes = (document.getElementById('moveNotes') as HTMLTextAreaElement).value;
                    if (newLocation) {
                      handleConfirmMove(newLocation, notes);
                    } else {
                      toast({
                        title: "Please select a destination",
                        description: "You must select a destination location to move the car.",
                        variant: "destructive"
                      });
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Confirm Move
                </Button>
                <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowLinkedTabs;
