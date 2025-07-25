import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Car, Clock, AlertTriangle } from 'lucide-react';
import { Car as CarInventoryType } from '@/pages/CarInventory/types';
import { useNavigate } from 'react-router-dom';

// Local interface for garage car data
interface GarageCar {
  id: string;
  garageStatus?: string;
  pdiCompleted?: boolean;
}

interface InventoryStats {
  carInventory: {
    total: number;
    pdiCompleted: number;
    inStock: number;
    reserved: number;
    sold: number;
  };
  showroomFloor1: {
    total: number;
    inStock: number;
    pdiCompleted: number;
    testDrivesActive: number;
  };
  showroomFloor2: {
    total: number;
    inStock: number;
    pdiCompleted: number;
    testDrivesActive: number;
  };
  garageInventory: {
    total: number;
    inStock: number;
    pdiCompleted: number;
    stored: number;
    inRepair: number;
    readyForPickup: number;
  };
}

// Function to initialize showroom data if not present
const initializeShowroomData = () => {
  // Initialize ShowroomFloor1 data if not present
  if (!localStorage.getItem('showroomFloor1Cars')) {
    const floor1MockData = [
      {
        id: 'showroom1-001',
        vinNumber: 'VF1SF1A2B3C456789',
        model: 'Voyah Free',
        year: 2024,
        color: 'Pearl White',
        price: 75000,
        status: 'in_stock',
        batteryPercentage: 95,
        range: 520,
        pdiCompleted: false,
        customs: 'paid',
        manufacturingDate: '2024-10-15',
        rangeExtenderNumber: 'RE-2024-VOY-6789',
        highVoltageBatteryNumber: 'HVB-2024-6789',
        frontMotorNumber: 'FM-2024-VOY-6789',
        rearMotorNumber: 'RM-2024-VOY-6789',
        testDriveInfo: {
          isOnTestDrive: false
        }
      },
      {
        id: 'showroom1-002',
        vinNumber: 'VF1SF2D4E5F678901',
        model: 'Voyah Dream',
        year: 2024,
        color: 'Midnight Silver',
        price: 89000,
        status: 'reserved',
        batteryPercentage: 88,
        range: 465,
        pdiCompleted: true,
        pdiDate: '2024-12-18T14:30:00Z',
        pdiTechnician: 'Tech-SF1-001',
        customs: 'paid',
        manufacturingDate: '2024-11-22',
        rangeExtenderNumber: 'RE-2024-VOY-8901',
        highVoltageBatteryNumber: 'HVB-2024-8901',
        frontMotorNumber: 'FM-2024-VOY-8901',
        rearMotorNumber: 'RM-2024-VOY-8901',
        testDriveInfo: {
          isOnTestDrive: true,
          testDriveStartTime: '2024-12-21T13:00:00Z',
          testDriverName: 'Fatima Al-Zahra',
          testDriverPhone: '+971-54-765-4321',
          isClientTestDrive: true
        }
      },
      {
        id: 'showroom1-003',
        vinNumber: 'VF1SF3G6H7I890123',
        model: 'Mhero 917',
        year: 2024,
        color: 'Desert Sand',
        price: 120000,
        status: 'in_stock',
        batteryPercentage: 72,
        range: 420,
        pdiCompleted: true,
        pdiDate: '2024-12-19T10:15:00Z',
        pdiTechnician: 'Tech-SF1-002',
        customs: 'paid',
        manufacturingDate: '2024-09-30',
        rangeExtenderNumber: 'RE-2024-MHE-0123',
        highVoltageBatteryNumber: 'HVB-2024-0123',
        frontMotorNumber: 'FM-2024-MHE-0123',
        rearMotorNumber: 'RM-2024-MHE-0123',
        testDriveInfo: {
          isOnTestDrive: false
        }
      },
      {
        id: 'showroom1-004',
        vinNumber: 'VF1SF4J8K9L234567',
        model: 'Voyah Passion',
        year: 2024,
        color: 'Deep Blue',
        price: 95000,
        status: 'sold',
        batteryPercentage: 100,
        range: 480,
        pdiCompleted: true,
        pdiDate: '2024-12-17T16:45:00Z',
        pdiTechnician: 'Tech-SF1-003',
        customs: 'paid',
        manufacturingDate: '2024-08-20',
        rangeExtenderNumber: 'RE-2024-VOY-4567',
        highVoltageBatteryNumber: 'HVB-2024-4567',
        frontMotorNumber: 'FM-2024-VOY-4567',
        rearMotorNumber: 'RM-2024-VOY-4567',
        testDriveInfo: {
          isOnTestDrive: false
        },
        soldTo: 'Omar Khalil',
        soldDate: '2024-12-20T11:30:00Z'
      }
    ];
    localStorage.setItem('showroomFloor1Cars', JSON.stringify(floor1MockData));
  }

  // Initialize ShowroomFloor2 data if not present
  if (!localStorage.getItem('showroomFloor2Cars')) {
    const floor2MockData = [
      {
        id: 'floor2-001',
        vinNumber: '2HGBH41JXMN109187',
        model: 'Porsche Taycan',
        year: 2024,
        color: 'Miami Blue',
        price: 110000,
        status: 'in_stock',
        batteryPercentage: 95,
        range: 450,
        features: ['Sport Chrono', 'Premium Sound', 'Air Suspension'],
        arrivalDate: new Date().toISOString(),
        pdiCompleted: true,
        pdiTechnician: 'Mike Johnson',
        pdiDate: new Date().toISOString(),
        pdiNotes: 'Vehicle passed all inspection points. Ready for display.',
        testDriveInfo: {
          isOnTestDrive: false
        }
      },
      {
        id: 'floor2-002',
        vinNumber: 'WBXHT910X0L123457',
        model: 'Audi e-tron GT',
        year: 2024,
        color: 'Daytona Gray',
        price: 105000,
        status: 'reserved',
        batteryPercentage: 88,
        range: 480,
        features: ['Bang & Olufsen', 'Air Suspension', 'Sport Seats'],
        arrivalDate: new Date().toISOString(),
        pdiCompleted: false,
        testDriveInfo: {
          isOnTestDrive: false
        }
      },
      {
        id: 'floor2-003',
        vinNumber: 'VF2SF1A2B3C789012',
        model: 'BMW iX',
        year: 2024,
        color: 'Storm Bay',
        price: 125000,
        status: 'in_stock',
        batteryPercentage: 92,
        range: 520,
        features: ['xDrive', 'Panoramic Roof', 'Harman Kardon'],
        arrivalDate: new Date().toISOString(),
        pdiCompleted: true,
        pdiTechnician: 'Sarah Wilson',
        pdiDate: new Date().toISOString(),
        pdiNotes: 'All systems checked and operational.',
        testDriveInfo: {
          isOnTestDrive: true,
          testDriveStartTime: new Date().toISOString(),
          testDriverName: 'Ahmed Al-Mansouri',
          testDriverPhone: '+971-50-123-4567',
          isClientTestDrive: true
        }
      },
      {
        id: 'floor2-004',
        vinNumber: 'VF2SF2D4E5F890123',
        model: 'Mercedes EQS',
        year: 2024,
        color: 'Obsidian Black',
        price: 130000,
        status: 'in_stock',
        batteryPercentage: 85,
        range: 580,
        features: ['MBUX', 'Air Suspension', 'Massage Seats'],
        arrivalDate: new Date().toISOString(),
        pdiCompleted: true,
        pdiTechnician: 'David Chen',
        pdiDate: new Date().toISOString(),
        pdiNotes: 'Premium features tested and verified.',
        testDriveInfo: {
          isOnTestDrive: false
        }
      },
      {
        id: 'floor2-005',
        vinNumber: 'VF2SF3G6H7I901234',
        model: 'Lucid Air',
        year: 2024,
        color: 'Stellar White',
        price: 140000,
        status: 'sold',
        batteryPercentage: 100,
        range: 650,
        features: ['Dream Drive', 'Glass Canopy', 'Surreal Sound'],
        arrivalDate: new Date().toISOString(),
        pdiCompleted: true,
        pdiTechnician: 'Emma Rodriguez',
        pdiDate: new Date().toISOString(),
        pdiNotes: 'Luxury vehicle inspection completed successfully.',
        testDriveInfo: {
          isOnTestDrive: false
        },
        soldTo: 'Khalid Al-Zahra',
        soldDate: new Date().toISOString()
      }
    ];
    localStorage.setItem('showroomFloor2Cars', JSON.stringify(floor2MockData));
  }

  // Initialize Garage data if not present
  if (!localStorage.getItem('garageCars')) {
    const garageMockData = [
      {
        id: 'garage-001',
        carModel: 'Voyah Free',
        carCode: 'VF-GAR-001',
        customerName: 'Ahmed Al-Rashid',
        entryDate: '2024-12-18T10:00:00Z',
        status: 'in_repair',
        assignedEmployee: 'Tech-001',
        mechanics: ['Mike Johnson', 'Sarah Wilson'],
        notes: 'Battery diagnostic and software update',
        workNotes: 'Performing comprehensive battery health check',
        issueDescription: 'Customer reported reduced range',
        statusComments: 'In progress - 60% complete',
        expectedExitDate: '2024-12-22T16:00:00Z',
        lastUpdated: '2024-12-21T14:30:00Z',
        pdiCompleted: true
      },
      {
        id: 'garage-002',
        carModel: 'Mhero 917',
        carCode: 'MH-GAR-002',
        customerName: 'Fatima Al-Zahra',
        entryDate: '2024-12-15T09:30:00Z',
        status: 'ready',
        assignedEmployee: 'Tech-002',
        mechanics: ['David Chen'],
        notes: 'Routine maintenance completed',
        workNotes: 'All systems checked and verified',
        issueDescription: 'Scheduled maintenance',
        statusComments: 'Ready for customer pickup',
        expectedExitDate: '2024-12-21T10:00:00Z',
        lastUpdated: '2024-12-20T15:45:00Z',
        pdiCompleted: true
      },
      {
        id: 'garage-003',
        carModel: 'Voyah Dream',
        carCode: 'VD-GAR-003',
        customerName: 'Hassan Al-Mahmoud',
        entryDate: '2024-12-19T14:20:00Z',
        status: 'in_diagnosis',
        assignedEmployee: 'Tech-003',
        mechanics: ['Emma Rodriguez'],
        notes: 'Initial diagnostic assessment',
        workNotes: 'Running comprehensive system diagnostics',
        issueDescription: 'Charging system irregularities',
        statusComments: 'Diagnosis in progress',
        expectedExitDate: '2024-12-23T12:00:00Z',
        lastUpdated: '2024-12-21T11:20:00Z',
        pdiCompleted: false
      }
    ];
    localStorage.setItem('garageCars', JSON.stringify(garageMockData));
  }
};

export const TestDataSummary: React.FC = () => {
  const [stats, setStats] = useState<InventoryStats>({
    carInventory: { total: 0, pdiCompleted: 0, inStock: 0, reserved: 0, sold: 0 },
    showroomFloor1: { total: 0, inStock: 0, pdiCompleted: 0, testDrivesActive: 0 },
    showroomFloor2: { total: 0, inStock: 0, pdiCompleted: 0, testDrivesActive: 0 },
    garageInventory: { total: 0, inStock: 0, pdiCompleted: 0, stored: 0, inRepair: 0, readyForPickup: 0 }
  });

  const navigate = useNavigate();

  useEffect(() => {
    const calculateStats = () => {
      // Initialize showroom data if not present
      initializeShowroomData();

      // Load Car Inventory data
      const carInventoryData = localStorage.getItem('carInventory');
      const carInventory: CarInventoryType[] = carInventoryData ? JSON.parse(carInventoryData) : [];

      // Load Garage Inventory data (check multiple garage storage keys)
      const garageData = localStorage.getItem('garageCars') || localStorage.getItem('garageInventory') || localStorage.getItem('garageCarInventory');
      const garageCars: any[] = garageData ? JSON.parse(garageData) : [];

      // Load Showroom Floor 1 data
      const showroom1Data = localStorage.getItem('showroomFloor1Cars');
      const showroom1Cars: any[] = showroom1Data ? JSON.parse(showroom1Data) : [];

      // Load Showroom Floor 2 data
      const showroom2Data = localStorage.getItem('showroomFloor2Cars');
      const showroom2Cars: any[] = showroom2Data ? JSON.parse(showroom2Data) : [];

      // Calculate Car Inventory stats - Show ALL cars regardless of status
      const carInventoryStats = {
        total: carInventory.length, // Total of ALL cars regardless of status
        pdiCompleted: carInventory.filter(car => car.pdiCompleted).length,
        inStock: carInventory.filter(car => car.status === 'in_stock' || (!car.status)).length, // Only available cars
        reserved: carInventory.filter(car => car.status === 'reserved').length,
        sold: carInventory.filter(car => car.status === 'sold').length
      };

      // Calculate real Showroom Floor 1 stats from localStorage data - Show ALL cars
      const showroom1InStock = showroom1Cars.filter(car => 
        car.status === 'in_stock' || car.status === 'available' || !car.status
      );
      const showroom1Stats = {
        total: showroom1Cars.length, // Total of ALL cars regardless of status
        inStock: showroom1InStock.length, // Only available cars
        pdiCompleted: showroom1Cars.filter(car => car.pdiCompleted).length,
        testDrivesActive: showroom1Cars.filter(car => car.testDriveInfo?.isOnTestDrive).length
      };

      // Calculate real Showroom Floor 2 stats from localStorage data - Show ALL cars
      const showroom2InStock = showroom2Cars.filter(car => 
        car.status === 'in_stock' || car.status === 'available' || !car.status
      );
      const showroom2Stats = {
        total: showroom2Cars.length, // Total of ALL cars regardless of status
        inStock: showroom2InStock.length, // Only available cars
        pdiCompleted: showroom2Cars.filter(car => car.pdiCompleted).length,
        testDrivesActive: showroom2Cars.filter(car => car.testDriveInfo?.isOnTestDrive).length
      };

      // Calculate Garage Inventory stats - Show ALL cars in garage
      const garageInStock = garageCars.filter(car => {
        // Exclude sold/delivered cars, include all others as "in stock"
        return !(car.status === 'sold' || car.status === 'delivered' || car.status === 'picked_up');
      });
      const garageStats = {
        total: garageCars.length, // Total of ALL cars regardless of status
        inStock: garageInStock.length, // Only cars not sold/delivered
        pdiCompleted: garageCars.filter(car => car.pdiCompleted).length,
        // Handle both garage systems:
        // 1. GarageCarInventory system uses 'garageStatus' property
        // 2. Repairs system uses 'status' property  
        stored: garageCars.filter(car => 
          car.garageStatus === 'stored' || 
          car.status === 'in_diagnosis' ||
          car.status === 'ready'
        ).length,
        inRepair: garageCars.filter(car => 
          car.garageStatus === 'in_repair' || 
          car.status === 'in_repair' ||
          car.status === 'in_quality_check'
        ).length,
        readyForPickup: garageCars.filter(car => 
          car.garageStatus === 'ready_for_pickup' || 
          car.status === 'ready' ||
          car.status === 'delivered'
        ).length
      };

      setStats({
        carInventory: carInventoryStats,
        showroomFloor1: showroom1Stats,
        showroomFloor2: showroom2Stats,
        garageInventory: garageStats
      });
    };

    // Calculate initial stats
    calculateStats();

    // Listen for localStorage changes to update stats in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (['carInventory', 'garageCars', 'showroomFloor1Cars', 'showroomFloor2Cars'].includes(e.key || '')) {
        calculateStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also recalculate periodically in case of same-tab updates
    const interval = setInterval(calculateStats, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 transform hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 border-2 hover:border-blue-300"
        onClick={() => navigate('/car-inventory')}
        title="Click to view Car Inventory"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Car Inventory</CardTitle>
          <Car className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Cars in Stock</span>
              <Badge variant="secondary">{stats.carInventory.inStock} cars</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">PDI Complete</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs">{stats.carInventory.pdiCompleted}/{stats.carInventory.total}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Amount of Cars</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                  {stats.carInventory.total} Cars
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 transform hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 border-2 hover:border-green-300"
        onClick={() => navigate('/showroom-floor-1')}
        title="Click to view Showroom Floor 1"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Showroom Floor 1</CardTitle>
          <Car className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Cars in Stock</span>
              <Badge variant="secondary">{stats.showroomFloor1.inStock} cars</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">PDI Complete</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs">{stats.showroomFloor1.pdiCompleted}/{stats.showroomFloor1.total}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Amount of Cars</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                  {stats.showroomFloor1.total} Cars
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 transform hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 border-2 hover:border-purple-300"
        onClick={() => navigate('/showroom-floor-2')}
        title="Click to view Showroom Floor 2"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Showroom Floor 2</CardTitle>
          <Car className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Cars in Stock</span>
              <Badge variant="secondary">{stats.showroomFloor2.inStock} cars</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">PDI Complete</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs">{stats.showroomFloor2.pdiCompleted}/{stats.showroomFloor2.total}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Amount of Cars</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                  {stats.showroomFloor2.total} Cars
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card 
        className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 transform hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 border-2 hover:border-orange-300"
        onClick={() => navigate('/garage-car-inventory')}
        title="Click to view Garage Inventory"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Garage Inventory</CardTitle>
          <Car className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Cars in Stock</span>
              <Badge variant="secondary">{stats.garageInventory.inStock} cars</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">PDI Complete</span>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs">{stats.garageInventory.pdiCompleted}/{stats.garageInventory.total}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Amount of Cars</span>
              <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                  {stats.garageInventory.total} Cars
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 