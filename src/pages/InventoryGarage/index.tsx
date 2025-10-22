import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CarHistoryDetailsDialog from '@/components/CarHistoryDetailsDialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
// Removed unused Radix Select to avoid potential context/hook side-effects inside this page
import { toast } from '@/hooks/use-toast';
import PortalActionDropdown from '@/components/ui/PortalActionDropdown';
import { 
  Wrench, 
  Car, 
  CheckCircle,
  Clock,
  MapPin,
  Activity,
  RefreshCw,
  Battery,
  Fuel,
  FileText,
  Monitor,
  QrCode,
  X
} from 'lucide-react';
import VinScannerDialog from '@/components/VinScannerDialog';
import PdiViewDialog from '@/pages/ShowroomFloor1/components/PdiViewDialog';
import SimpleTestDriveDialog from '@/components/SimpleTestDriveDialog';
import { CarStatusSelectionDialog } from '@/components/CarStatusSelectionDialog';
import EnhancedCarDetailDialog from '@/components/EnhancedCarDetailDialog';
import ITSoftwareUpdateDialog from '@/components/ITSoftwareUpdateDialog';
import CustomsManagementDialog from '@/components/CustomsManagementDialog';
import WarrantyInfoColumn from '@/components/WarrantyInfoColumn';
import StandardWarrantyButton from '@/components/StandardWarrantyButton';
import MoveCarDialog from './components/MoveCarDialog';

interface CarData {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  price: number;
  status: 'sold' | 'reserved' | 'in_stock' | 'maintenance';
  garageStatus?: 'stored' | 'in_repair' | 'ready_for_pickup' | 'awaiting_parts';
  category: 'EV' | 'REV' | 'ICEV';
  batteryPercentage: number;
  range: number;
  arrivalDate: string;
  pdiCompleted?: boolean;
  pdiStatus?: string;
  pdiTechnician?: string;
  pdiDate?: string;
  pdiNotes?: string;
  testDriveInfo?: any;
  customs?: 'paid' | 'not paid';
  brand?: string;
  currentFloor?: string;
  clientName?: string;
  clientPhone?: string;
  clientLicensePlate?: string;
  notes?: string;
  lastModified?: string;
  softwareVersion?: string;
  softwareLastUpdated?: string;
  softwareUpdateBy?: string;
  softwareUpdateNotes?: string;
  repairStatus?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedMechanic?: string;
  estimatedCompletion?: string;
  repairNotes?: string;
  partsUsed?: string[];
  laborHours?: number;
  // Warranty tracking fields
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyMonthsRemaining?: number;
  warrantyDaysRemaining?: number;
  warrantyStatus?: 'active' | 'expiring_soon' | 'expired';
  lastWarrantyUpdate?: string;
}

// Load garage cars - no mock data
const loadGarageCars = (): CarData[] => {
  try {
    // Always return empty array - no mock data
    console.log('Garage: Initialized with empty state (no mock data)');
    return [];
  } catch (error) {
    console.error('Error loading garage cars:', error);
    return [];
  }
};

// Save cars to localStorage
const saveCarsToStorage = (cars: CarData[]) => {
  try {
    localStorage.setItem('garageCars', JSON.stringify(cars));
    console.log(`Garage: Saved ${cars.length} cars to localStorage`);
  } catch (error) {
    console.error('Error saving garage cars to localStorage:', error);
  }
};

const GarageInventoryPage: React.FC = () => {
  const [cars, setCars] = useState<CarData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState('All Models');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showVinScanner, setShowVinScanner] = useState(false);
  const [showPdiDialog, setShowPdiDialog] = useState(false);
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showCarDetailsDialog, setShowCarDetailsDialog] = useState(false);
  const [showSoftwareDialog, setShowSoftwareDialog] = useState(false);
  const [showCustomsDialog, setShowCustomsDialog] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
  const [pdiCar, setPdiCar] = useState<CarData | null>(null);
  const [testDriveCar, setTestDriveCar] = useState<CarData | null>(null);
  const [softwareCar, setSoftwareCar] = useState<CarData | null>(null);
  const [customsCar, setCustomsCar] = useState<CarData | null>(null);
  const [selectedCarForStatus, setSelectedCarForStatus] = useState<CarData | null>(null);
  const [showMoveCarDialog, setShowMoveCarDialog] = useState(false);
  const [selectedCarForMove, setSelectedCarForMove] = useState<CarData | null>(null);
  const [showCarHistoryDialog, setShowCarHistoryDialog] = useState(false);
  const [selectedCarForHistory, setSelectedCarForHistory] = useState<CarData | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Force clear old garage data to apply new status changes
    localStorage.removeItem('garageCars');
    localStorage.removeItem('garageInventory');
    localStorage.removeItem('garageSchedule');
    localStorage.removeItem('garageSchedules');
    localStorage.removeItem('inventoryGarage');
    
    const loadedCars = loadGarageCars();
    setCars(loadedCars);
  }, []);

  const getGarageStats = () => {
    const totalCars = cars.length;
    const inRepair = cars.filter(car => car.garageStatus === 'in_repair' || car.status === 'maintenance').length;
    const completed = cars.filter(car => car.repairStatus === 'completed').length;
    const inProgress = cars.filter(car => car.repairStatus === 'in_progress').length;
    const pending = cars.filter(car => car.repairStatus === 'pending').length;

    return {
      totalCars,
      inRepair,
      completed,
      inProgress,
      pending
    };
  };

  const getFilteredCars = () => {
    return cars.filter(car => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (car.vinNumber?.toLowerCase() || '').includes(searchLower) ||
        (car.model?.toLowerCase() || '').includes(searchLower) ||
        (car.brand?.toLowerCase() || '').includes(searchLower) ||
        (car.assignedMechanic?.toLowerCase() || '').includes(searchLower);
      
      const matchesModel = selectedModel === 'All Models' || car.model === selectedModel;
      const matchesStatus = selectedStatus === 'All Status' || car.status === selectedStatus;
      const matchesCategory = selectedCategory === 'All Categories' || car.category === selectedCategory;
      
      return matchesSearch && matchesModel && matchesStatus && matchesCategory;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
      case 'stored':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance':
      case 'in_repair':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
      case 'ready_for_pickup':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'awaiting_parts':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'in_stock': return 'In Stock';
      case 'stored': return 'Stored';
      case 'sold': return 'Sold';
      case 'reserved': return 'Reserved';
      case 'maintenance': return 'Maintenance';
      case 'in_repair': return 'In Repair';
      case 'completed': return 'Completed';
      case 'ready_for_pickup': return 'Ready for Pickup';
      case 'pending': return 'Pending';
      case 'awaiting_parts': return 'Awaiting Parts';
      case 'cancelled': return 'Cancelled';
      default: return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'EV': return 'bg-blue-100 text-blue-800';
      case 'REV': return 'bg-green-100 text-green-800';
      case 'ICEV': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleVinScanned = (vin: string) => {
    console.log('VIN scanned in garage:', vin);
    toast({
      title: "VIN Scanned",
      description: `VIN ${vin} scanned successfully`,
    });
  };

  const handleEditCar = (car: CarData) => {
    setSelectedCar(car);
    setShowCarDetailsDialog(true);
  };

  const handleMoveCar = (car: CarData) => {
    setSelectedCarForMove(car);
    setShowMoveCarDialog(true);
  };

  const handleMoveCarSubmit = (destination: string, notes?: string) => {
    if (!selectedCarForMove) return;

    // Remove car from garage inventory since it's being moved to another area
    setCars(prevCars => prevCars.filter(car => car.id !== selectedCarForMove.id));

    // Update localStorage
    const updatedCars = cars.filter(car => car.id !== selectedCarForMove.id);
    localStorage.setItem('garageCars', JSON.stringify(updatedCars));

    toast({
      title: "Car Moved Successfully",
      description: `${selectedCarForMove.model} has been moved to ${destination}.`,
    });

    setShowMoveCarDialog(false);
    setSelectedCarForMove(null);
  };

  const handleCarUpdate = (carId: string, updates: any) => {
    setCars(prevCars => 
      prevCars.map(car => 
        car.id === carId ? { ...car, ...updates, lastModified: new Date().toISOString() } : car
      )
    );
    
    // Update localStorage
    const updatedCars = cars.map(car => 
      car.id === carId ? { ...car, ...updates, lastModified: new Date().toISOString() } : car
    );
    localStorage.setItem('garageCars', JSON.stringify(updatedCars));
    
    toast({
      title: "Car Updated",
      description: "Car information has been updated successfully",
    });
  };

  const handleViewPdi = (car: CarData) => {
    setPdiCar(car);
    setShowPdiDialog(true);
  };

  const handlePdiClick = (car: CarData) => {
    console.log('PDI clicked for car:', car);
    setPdiCar(car);
    setShowPdiDialog(true);
  };

  const handlePdiComplete = (carId: string, pdiData: { technician: string, notes: string, photos: string[] }) => {
    setCars(prevCars => 
      prevCars.map(car => 
        car.id === carId ? { 
          ...car, 
          pdiCompleted: true,
          pdiStatus: 'completed',
          pdiTechnician: pdiData.technician,
          pdiNotes: pdiData.notes,
          pdiDate: new Date().toISOString(),
          lastModified: new Date().toISOString()
        } : car
      )
    );
    
    // Update localStorage
    const updatedCars = cars.map(car => 
      car.id === carId ? { 
        ...car, 
        pdiCompleted: true,
        pdiStatus: 'completed',
        pdiTechnician: pdiData.technician,
        pdiNotes: pdiData.notes,
        pdiDate: new Date().toISOString(),
        lastModified: new Date().toISOString()
      } : car
    );
    localStorage.setItem('garageCars', JSON.stringify(updatedCars));
    
    toast({
      title: "PDI Completed",
      description: "Pre-delivery inspection has been completed successfully",
    });
  };

  const handleStatusClick = (car: CarData) => {
    if (car.status === 'sold' || car.status === 'reserved') {
      setSelectedCarForStatus(car);
      setShowStatusDialog(true);
    } else {
      setSelectedCarForStatus(car);
      setShowStatusDialog(true);
    }
  };

  const handleStatusUpdate = (carId: string, status: 'in_stock' | 'sold' | 'reserved' | 'maintenance', clientInfo?: any) => {
    setCars(prevCars => 
      prevCars.map(car => 
        car.id === carId ? { 
          ...car, 
          status,
          clientName: clientInfo?.name || car.clientName,
          clientPhone: clientInfo?.phone || car.clientPhone,
          clientLicensePlate: clientInfo?.licensePlate || car.clientLicensePlate,
          lastModified: new Date().toISOString()
        } : car
      )
    );
    
    // Update localStorage
    const updatedCars = cars.map(car => 
      car.id === carId ? { 
        ...car, 
        status,
        clientName: clientInfo?.name || car.clientName,
        clientPhone: clientInfo?.phone || car.clientPhone,
        clientLicensePlate: clientInfo?.licensePlate || car.clientLicensePlate,
        lastModified: new Date().toISOString()
      } : car
    );
    localStorage.setItem('garageCars', JSON.stringify(updatedCars));
    
    toast({
      title: "Status Updated",
      description: `Car status has been updated to ${getStatusDisplayName(status)}`,
    });
  };

  const handleTestDriveClick = (car: CarData) => {
    setTestDriveCar(car);
    setShowTestDriveDialog(true);
  };

  const handleCustomsClick = (car: CarData) => {
    setCustomsCar(car);
    setShowCustomsDialog(true);
  };

  const handleCustomsUpdate = (carId: string, customsData: {
    customs: 'paid' | 'not paid';
    customsAmount?: number;
    customsDate?: string;
    customsDocumentation?: string;
    customsNotes?: string;
    customsProcessedBy?: string;
  }) => {
    setCars(prevCars => 
      prevCars.map(car => 
        car.id === carId ? { 
          ...car, 
          ...customsData,
          lastModified: new Date().toISOString()
        } : car
      )
    );
    
    // Update localStorage
    const updatedCars = cars.map(car => 
      car.id === carId ? { 
        ...car, 
        ...customsData,
        lastModified: new Date().toISOString()
      } : car
    );
    saveCarsToStorage(updatedCars);
    
    toast({
      title: "Customs Updated",
      description: "Customs information has been updated successfully",
    });
  };

  // Test Drive Functionality
  const handleScheduleTestDrive = (carId: string, testDriveInfo: any) => {
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    
    setTestDriveCar(car);
    setShowTestDriveDialog(true);
  };

  const handleTestDriveEnd = (carId: string) => {
    const car = cars.find(c => c.id === carId);
    if (!car || !car.testDriveInfo) return;

    const updatedCars = cars.map(c => 
      c.id === carId 
        ? { 
            ...c, 
            testDriveInfo: null
          }
        : c
    );
    
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);

    toast({
      title: "Test Drive Completed",
      description: "Test drive has been completed and added to vehicle history.",
    });
  };

  // Client Info Functionality
  const handleShowClientInfo = (car: CarData) => {
    setSelectedCarForStatus(car);
    setShowStatusDialog(true);
  };

  const handleSoftwareClick = (car: CarData) => {
    console.log('Software clicked for car:', car);
    setSoftwareCar(car);
    setShowSoftwareDialog(true);
  };

  const handleSoftwareUpdate = (carId: string, updates: {
    softwareVersion: string;
    softwareLastUpdated: string;
    softwareUpdateBy: string;
    softwareUpdateNotes: string;
  }) => {
    setCars(prevCars => 
      prevCars.map(car => 
        car.id === carId ? { 
          ...car, 
          ...updates,
          lastModified: new Date().toISOString()
        } : car
      )
    );
    
    // Update localStorage
    const updatedCars = cars.map(car => 
      car.id === carId ? { 
        ...car, 
        ...updates,
        lastModified: new Date().toISOString()
      } : car
    );
    saveCarsToStorage(updatedCars);
    
    toast({
      title: "Software Updated",
      description: "Software information has been updated successfully",
    });
  };

  const handleViewDetails = (car: CarData) => {
    console.log('View Details clicked for car:', car);
    setSelectedCar(car);
    setShowCarDetailsDialog(true);
  };

  const handleRefreshInventory = () => {
    const loadedCars = loadGarageCars();
    setCars(loadedCars);
    toast({
      title: "Inventory Refreshed",
      description: "Garage inventory has been refreshed",
    });
  };

  const handleExportToExcel = () => {
    // Implementation for Excel export
    toast({
      title: "Export Started",
      description: "Garage inventory export has been initiated",
    });
  };

  const handleNavigateToGarageSchedule = () => {
    navigate('/garage-schedule');
  };

  const handleNavigateToRepairs = () => {
    navigate('/repairs');
  };

  const stats = getGarageStats();
  const filteredCars = getFilteredCars();
  const uniqueModels = ['All Models', ...Array.from(new Set(cars.map(car => car.model)))];
  const uniqueStatuses = ['All Status', ...Array.from(new Set(cars.map(car => car.status)))];
  const uniqueCategories = ['All Categories', ...Array.from(new Set(cars.map(car => car.category)))];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Garage Inventory</h1>
          <p className="text-muted-foreground">Manage cars currently in garage for repairs and maintenance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshInventory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportToExcel}>
            Export
          </Button>
          <Button onClick={() => setShowVinScanner(true)}>
            <QrCode className="h-4 w-4 mr-2" />
            Scan VIN
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Total Cars</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalCars}</p>
            <p className="text-sm text-gray-600">In garage</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" />
              <span className="font-semibold text-gray-900">In Repair</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.inRepair}</p>
            <p className="text-sm text-gray-600">Active repairs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-gray-900">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.inProgress}</p>
            <p className="text-sm text-gray-600">Currently working</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-gray-900">Completed</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-sm text-gray-600">Finished today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-gray-900">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-600">Waiting to start</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          onClick={handleNavigateToGarageSchedule}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Garage Schedule</h3>
                <p className="text-sm text-gray-600">View work schedule</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          onClick={() => navigate('/garage-schedule')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Daily Plan</h3>
                <p className="text-sm text-gray-600">Full day overview</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
          onClick={handleNavigateToRepairs}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Repairs</h3>
                <p className="text-sm text-gray-600">Manage repairs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="form-container grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="form-col">
          <Input
            id="garageSearch"
            placeholder="Search by VIN, model, or mechanic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="form-col">
          <select
            id="modelFilter"
            className="form-element"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {uniqueModels.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </div>

        <div className="form-col">
          <select
            id="statusFilter"
            className="form-element"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>
                {status === 'All Status' ? 'All Status' : getStatusDisplayName(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-col">
          <select
            id="categoryFilter"
            className="form-element"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {uniqueCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Enhanced Garage Cars Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Garage Cars Inventory
            <Badge variant="secondary" className="ml-auto">
              {filteredCars.length} cars
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VIN</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Color interior</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Warranty Life</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Range Capacity</TableHead>
                  <TableHead>Km Driven</TableHead>
                  <TableHead>Test Drive</TableHead>
                  <TableHead>PDI</TableHead>
                  <TableHead>Customs</TableHead>
                  <TableHead>Software Model</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCars.map((car) => (
                  <TableRow 
                    key={car.id}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedCarForHistory(car);
                      setShowCarHistoryDialog(true);
                    }}
                    title="Click to view complete car history"
                  >
                    <TableCell className="font-mono text-sm">{car.vinNumber}</TableCell>
                    <TableCell className="font-medium">{car.model}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(car.category)}>
                        {car.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{car.year || 'N/A'}</TableCell>
                    <TableCell>{car.color}</TableCell>
                    <TableCell>{(car as any).interiorColor || (car as any).interior_color || '-'}</TableCell>
                    <TableCell>${car.price ? car.price.toLocaleString() : '0'}</TableCell>
                    <TableCell>
                      {car.status === 'sold' || car.status === 'reserved' ? (
                        <Badge 
                          className={`${getStatusColor(car.status)} cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStatusClick(car);
                          }}
                          title="Click to view client information"
                        >
                          {getStatusDisplayName(car.status)}
                        </Badge>
                      ) : (
                        <Badge 
                          className={`${getStatusColor(car.status)} cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStatusClick(car);
                          }}
                          title="Click to add client information"
                        >
                          {getStatusDisplayName(car.status)}
                        </Badge>
                      )}
                    </TableCell>
                    <StandardWarrantyButton car={car} />
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Battery className="h-4 w-4" />
                        {car.batteryPercentage || 0}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Fuel className="h-4 w-4" />
                        {car.range || 0} km
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        {(car as any).mileage || (car as any).kmDriven || 0} km
                      </div>
                    </TableCell>
                    <TableCell>
                      {car.testDriveInfo?.isOnTestDrive ? (
                        <Badge 
                          variant="outline" 
                          className="bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTestDriveEnd(car.id);
                          }}
                          title="Click to end test drive"
                        >
                          On Test Drive
                        </Badge>
                      ) : car.status === 'sold' || car.status === 'reserved' ? (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500">
                          Not Available
                        </Badge>
                      ) : (
                        <Badge 
                          variant="outline" 
                          className="bg-gray-50 text-gray-500 cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleScheduleTestDrive(car.id, { carModel: car.model, carVin: car.vinNumber });
                          }}
                          title="Click to schedule test drive"
                        >
                          Available
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div 
                        className="cursor-pointer"
                        onClick={() => handlePdiClick(car)}
                      >
                        <Badge 
                          variant={car.pdiCompleted ? 'default' : 'outline'}
                          className={`cursor-pointer hover:opacity-80 transition-opacity ${
                            car.pdiCompleted 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}
                        >
                          {car.pdiCompleted ? (
                            <><span className="mr-1 text-lg">☺</span> Complete</>
                          ) : (
                            <><span className="mr-1 text-lg">☹</span> Pending</>
                          )}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={car.customs === 'paid' ? 'default' : 'destructive'}
                        className="cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
                        onClick={() => handleCustomsClick(car)}
                        title="Click to manage customs payment"
                      >
                        {car.customs === 'paid' ? (
                          <><CheckCircle className="mr-1 h-4 w-4" /> paid</>
                        ) : (
                          <><X className="mr-1 h-4 w-4" /> {car.customs || 'not paid'}</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="flex items-center gap-1 text-xs cursor-pointer" 
                        onClick={() => handleSoftwareClick(car)}
                        title="Click to manage software updates"
                      >
                        {car.softwareVersion ? (
                          <>
                            <Badge variant="outline" className="text-xs hover:bg-blue-50 transition-colors">
                              v{car.softwareVersion}
                            </Badge>
                            {car.softwareLastUpdated && (
                              <span className="text-gray-500">
                                {new Date(car.softwareLastUpdated).toLocaleDateString()}
                              </span>
                            )}
                          </>
                        ) : (
                          <Badge variant="secondary" className="text-xs text-yellow-700 bg-yellow-100 hover:bg-yellow-200 transition-colors">
                            Update Needed
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PortalActionDropdown
                        options={[
                          { value: 'view', label: 'View Details' },
                          { value: 'edit', label: 'Edit Car' },
                          { value: 'move', label: 'Move Car' }
                        ]}
                        onAction={(action) => {
                          if (action === 'view') handleViewDetails(car);
                          else if (action === 'edit') handleEditCar(car);
                          else if (action === 'move') handleMoveCar(car);
                        }}
                        id={`actions-${car.id}`}
                        ariaLabel={`Actions for ${car.model} ${car.vinNumber}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <VinScannerDialog
        isOpen={showVinScanner}
        onClose={() => setShowVinScanner(false)}
        onVinScanned={handleVinScanned}
      />

      {pdiCar && (
        <PdiViewDialog
          isOpen={showPdiDialog}
          onClose={() => setShowPdiDialog(false)}
          car={pdiCar}
          onPdiComplete={handlePdiComplete}
        />
      )}

      {testDriveCar && (
        <SimpleTestDriveDialog
          isOpen={showTestDriveDialog}
          onClose={() => setShowTestDriveDialog(false)}
          car={testDriveCar}
          onStartTestDrive={handleScheduleTestDrive}
          onEndTestDrive={handleTestDriveEnd}
        />
      )}

      {selectedCarForStatus && (
        <CarStatusSelectionDialog
          isOpen={showStatusDialog}
          onClose={() => {
            setShowStatusDialog(false);
            setSelectedCarForStatus(null);
          }}
          car={{
            id: selectedCarForStatus.id,
            model: selectedCarForStatus.model,
            vinNumber: selectedCarForStatus.vinNumber,
            brand: selectedCarForStatus.brand,
            year: selectedCarForStatus.year,
            color: selectedCarForStatus.color,
            status: selectedCarForStatus.status as 'in_stock' | 'sold' | 'reserved',
            clientName: selectedCarForStatus.clientName,
            clientPhone: selectedCarForStatus.clientPhone,
            clientLicensePlate: selectedCarForStatus.clientLicensePlate,
            sellingPrice: selectedCarForStatus.price,
            reservationDate: undefined,
            saleDate: undefined,
            notes: selectedCarForStatus.notes
          }}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {selectedCar && (
        <EnhancedCarDetailDialog
          isOpen={showCarDetailsDialog}
          onClose={() => {
            setShowCarDetailsDialog(false);
            setSelectedCar(null);
          }}
          car={{
            id: selectedCar.id,
            vinNumber: selectedCar.vinNumber,
            model: selectedCar.model,
            brand: selectedCar.brand,
            year: selectedCar.year,
            color: selectedCar.color,
            status: selectedCar.status as 'in_stock' | 'sold' | 'reserved',
            sellingPrice: selectedCar.price,
            arrivalDate: selectedCar.arrivalDate,
            currentFloor: selectedCar.currentFloor,
            customs: selectedCar.customs,
            notes: selectedCar.notes,
            clientName: selectedCar.clientName,
            clientPhone: selectedCar.clientPhone,
            clientLicensePlate: selectedCar.clientLicensePlate,
            pdiCompleted: selectedCar.pdiCompleted,
            pdiDate: selectedCar.pdiDate,
            pdiTechnician: selectedCar.pdiTechnician,
            pdiNotes: selectedCar.pdiNotes,
            batteryPercentage: selectedCar.batteryPercentage,
            range: selectedCar.range,
            testDriveInfo: selectedCar.testDriveInfo,
            lastUpdated: selectedCar.lastModified
          }}
          onCarUpdate={handleCarUpdate}
        />
      )}

      {softwareCar && (
        <ITSoftwareUpdateDialog
          isOpen={showSoftwareDialog}
          onClose={() => {
            setShowSoftwareDialog(false);
            setSoftwareCar(null);
          }}
          car={{
            vinNumber: softwareCar.vinNumber,
            model: softwareCar.model,
            currentVersion: softwareCar.softwareVersion,
            lastUpdated: softwareCar.softwareLastUpdated,
            lastUpdatedBy: softwareCar.softwareUpdateBy,
            notes: softwareCar.softwareUpdateNotes,
            needsUpdate: !softwareCar.softwareVersion,
            priority: !softwareCar.softwareVersion ? 'critical' : 'medium'
          }}
          onUpdateComplete={(carVin: string, updateData: any) => {
            const carId = cars.find(c => c.vinNumber === carVin)?.id;
            if (carId) {
              handleSoftwareUpdate(carId, updateData);
            }
          }}
        />
      )}

      {customsCar && (
        <CustomsManagementDialog
          open={showCustomsDialog}
          onOpenChange={setShowCustomsDialog}
          car={customsCar}
          onCustomsUpdate={handleCustomsUpdate}
        />
      )}

      {/* Move Car Dialog */}
      {showMoveCarDialog && selectedCarForMove && (
        <MoveCarDialog
          isOpen={showMoveCarDialog}
          onClose={() => {
            setShowMoveCarDialog(false);
            setSelectedCarForMove(null);
          }}
          car={{
            id: selectedCarForMove.id,
            model: selectedCarForMove.model,
            vinNumber: selectedCarForMove.vinNumber,
            color: selectedCarForMove.color
          }}
          onMoveCar={handleMoveCarSubmit}
        />
      )}

      {/* Car History Details Dialog */}
      <CarHistoryDetailsDialog
        isOpen={showCarHistoryDialog}
        onClose={() => {
          setShowCarHistoryDialog(false);
          setSelectedCarForHistory(null);
        }}
        car={selectedCarForHistory}
      />
    </div>
  );
};

export default GarageInventoryPage;
