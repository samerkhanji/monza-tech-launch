import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { dateUtils } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { 
  Download, 
  Upload, 
  Plus, 
  Search, 
  Wrench, 
  Car, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  Activity,
  Filter,
  RefreshCw,
  Battery,
  Fuel,
  User,
  FileText,
  Eye,
  Monitor,
  QrCode
} from 'lucide-react';
import ActionDropdown from '@/components/ui/ActionDropdown';
import VinScannerDialog from '@/components/VinScannerDialog';
import EditCarDialog from '@/pages/ShowroomFloor1/components/EditCarDialog';
import MoveCarDialog from '@/pages/ShowroomFloor1/components/MoveCarDialog';
import PdiViewDialog from '@/pages/ShowroomFloor1/components/PdiViewDialog';
import TestDriveDialog from '@/pages/CarInventory/components/TestDriveDialog';
import TestDriveSelectionDialog from '@/components/TestDriveSelectionDialog';
import SimpleTestDriveDialog from '@/components/SimpleTestDriveDialog';
import { CarStatusSelectionDialog } from '@/components/CarStatusSelectionDialog';
import EnhancedCarDetailDialog from '@/components/EnhancedCarDetailDialog';
import ITSoftwareUpdateDialog from '@/components/ITSoftwareUpdateDialog';
import TableSearch from '@/components/ui/table-search';

interface CarData {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  price: number;
  status: 'sold' | 'reserved' | 'in_stock' | 'in_repair' | 'maintenance';
  category: 'EV' | 'REV' | 'ICEV';
  batteryPercentage: number;
  range: number;
  features?: string[];
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
  purchasePrice?: number;
  clientName?: string;
  clientPhone?: string;
  clientLicensePlate?: string;
  expectedDeliveryDate?: string;
  notes?: string;
  lastModified?: string;
  // Software Model for IT tracking
  softwareVersion?: string;
  softwareLastUpdated?: string;
  softwareUpdateBy?: string;
  softwareUpdateNotes?: string;
  // Garage specific fields
  repairStatus?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedMechanic?: string;
  estimatedCompletion?: string;
  repairNotes?: string;
  partsUsed?: string[];
  laborHours?: number;
}

// Sample garage car data
const garageCars: CarData[] = [
  {
    id: 'g-1',
    vinNumber: '1HGBH41JXMN109186',
    model: 'Tesla Model 3',
    year: 2024,
    color: 'Pearl White',
    price: 45000,
    status: 'in_repair',
    category: 'EV',
    batteryPercentage: 85,
    range: 350,
    arrivalDate: '2025-01-15',
    pdiCompleted: true,
    pdiStatus: 'completed',
    pdiTechnician: 'Mike Johnson',
    pdiDate: '2025-01-16',
    customs: 'paid',
    brand: 'Tesla',
    currentFloor: 'Garage',
    softwareVersion: '2024.44.30.1',
    softwareLastUpdated: '2025-01-10',
    softwareUpdateBy: 'IT Team',
    repairStatus: 'in_progress',
    assignedMechanic: 'Ahmed Hassan',
    estimatedCompletion: '2025-01-20',
    repairNotes: 'Battery system diagnostic and software update required',
    partsUsed: ['Battery Module', 'Software Update'],
    laborHours: 4
  },
  {
    id: 'g-2',
    vinNumber: '5YJSA1E47HF123456',
    model: 'Tesla Model Y',
    year: 2024,
    color: 'Midnight Silver',
    price: 52000,
    status: 'maintenance',
    category: 'EV',
    batteryPercentage: 92,
    range: 330,
    arrivalDate: '2025-01-12',
    pdiCompleted: false,
    pdiStatus: 'pending',
    pdiTechnician: '',
    customs: 'paid',
    brand: 'Tesla',
    currentFloor: 'Garage',
    softwareVersion: '2024.44.25.1',
    softwareLastUpdated: '2025-01-08',
    softwareUpdateBy: 'IT Team',
    repairStatus: 'pending',
    assignedMechanic: 'Sarah Wilson',
    estimatedCompletion: '2025-01-18',
    repairNotes: 'Regular maintenance and PDI completion',
    partsUsed: ['Air Filter', 'Brake Fluid'],
    laborHours: 2
  },
  {
    id: 'g-3',
    vinNumber: 'WBA8E9G50LNT12345',
    model: 'Voyah Free',
    year: 2024,
    color: 'Deep Blue',
    price: 48000,
    status: 'in_repair',
    category: 'REV',
    batteryPercentage: 78,
    range: 400,
    arrivalDate: '2025-01-10',
    pdiCompleted: true,
    pdiStatus: 'completed',
    pdiTechnician: 'David Chen',
    pdiDate: '2025-01-11',
    customs: 'paid',
    brand: 'Voyah',
    currentFloor: 'Garage',
    softwareVersion: '2.1.4',
    softwareLastUpdated: '2025-01-05',
    softwareUpdateBy: 'IT Team',
    repairStatus: 'in_progress',
    assignedMechanic: 'Carlos Rodriguez',
    estimatedCompletion: '2025-01-22',
    repairNotes: 'Range extender system calibration and battery optimization',
    partsUsed: ['Range Extender Module', 'Battery Controller'],
    laborHours: 6
  },
  {
    id: 'g-4',
    vinNumber: 'W1K2M6C55LA123456',
    model: 'Mercedes EQC',
    year: 2024,
    color: 'Obsidian Black',
    price: 75000,
    status: 'maintenance',
    category: 'EV',
    batteryPercentage: 88,
    range: 280,
    arrivalDate: '2025-01-08',
    pdiCompleted: true,
    pdiStatus: 'completed',
    pdiTechnician: 'Lisa Thompson',
    pdiDate: '2025-01-09',
    customs: 'paid',
    brand: 'Mercedes',
    currentFloor: 'Garage',
    softwareVersion: 'MBUX 3.0',
    softwareLastUpdated: '2025-01-03',
    softwareUpdateBy: 'IT Team',
    repairStatus: 'completed',
    assignedMechanic: 'James Miller',
    estimatedCompletion: '2025-01-15',
    repairNotes: 'Software update and system diagnostics completed',
    partsUsed: ['Software Update Package'],
    laborHours: 3
  },
  {
    id: 'g-5',
    vinNumber: 'W1K2M6C55LA789012',
    model: 'Mercedes GLC',
    year: 2024,
    color: 'Polar White',
    price: 65000,
    status: 'in_stock',
    category: 'ICEV',
    batteryPercentage: 95,
    range: 450,
    arrivalDate: '2025-01-14',
    pdiCompleted: false,
    pdiStatus: 'pending',
    pdiTechnician: '',
    customs: 'paid',
    brand: 'Mercedes',
    currentFloor: 'Garage',
    softwareVersion: 'MBUX 2.5',
    softwareLastUpdated: '2025-01-12',
    softwareUpdateBy: 'IT Team',
    repairStatus: 'pending',
    assignedMechanic: '',
    estimatedCompletion: '',
    repairNotes: 'Awaiting PDI and final inspection',
    partsUsed: [],
    laborHours: 0
  }
];

const GarageInventoryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [cars, setCars] = useState<CarData[]>(garageCars);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModel, setSelectedModel] = useState('All Models');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [isLoading, setIsLoading] = useState(false);
  
  // Dialog states
  const [isVinScannerOpen, setIsVinScannerOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isPdiDialogOpen, setIsPdiDialogOpen] = useState(false);
  const [isTestDriveDialogOpen, setIsTestDriveDialogOpen] = useState(false);
  const [isTestDriveSelectionOpen, setIsTestDriveSelectionOpen] = useState(false);
  const [isSimpleTestDriveOpen, setIsSimpleTestDriveOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isSoftwareDialogOpen, setIsSoftwareDialogOpen] = useState(false);
  const [isCustomsDialogOpen, setIsCustomsDialogOpen] = useState(false);
  
  // Selected car states
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
  const [editingCar, setEditingCar] = useState<CarData | null>(null);

  // Calculate garage statistics
  const getGarageStats = () => {
    const totalCars = cars.length;
    const inRepair = cars.filter(car => car.status === 'in_repair').length;
    const maintenance = cars.filter(car => car.status === 'maintenance').length;
    const inStock = cars.filter(car => car.status === 'in_stock').length;
    const pendingPDI = cars.filter(car => car.pdiStatus === 'pending').length;
    const completedPDI = cars.filter(car => car.pdiStatus === 'completed').length;
    
    const byCategory = {
      EV: cars.filter(car => car.category === 'EV').length,
      REV: cars.filter(car => car.category === 'REV').length,
      ICEV: cars.filter(car => car.category === 'ICEV').length
    };
    
    return {
      totalCars,
      inRepair,
      maintenance,
      inStock,
      pendingPDI,
      completedPDI,
      byCategory
    };
  };

  // Filter cars based on search and filters
  const getFilteredCars = () => {
    let filtered = cars;
    
    if (searchTerm) {
      filtered = filtered.filter(car =>
        car.vinNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.assignedMechanic?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedModel !== 'All Models') {
      filtered = filtered.filter(car => car.model === selectedModel);
    }
    
    if (selectedStatus !== 'All Status') {
      filtered = filtered.filter(car => car.status === selectedStatus);
    }
    
    if (selectedCategory !== 'All Categories') {
      filtered = filtered.filter(car => car.category === selectedCategory);
    }
    
    return filtered;
  };

  const filteredCars = getFilteredCars();
  const stats = getGarageStats();

  // Handle URL parameters for VIN filtering
  useEffect(() => {
    const vinParam = searchParams.get('vin');
    if (vinParam) {
      setSearchTerm(vinParam);
      const matchingCar = cars.find(car => 
        car.vinNumber.toLowerCase().includes(vinParam.toLowerCase())
      );
      if (matchingCar) {
          toast({
          title: "Car Found in Garage",
          description: `Showing ${matchingCar.model} (${matchingCar.vinNumber})`,
            duration: 5000,
          });
        }
    }
  }, [searchParams, cars]);

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'in_repair': return 'bg-orange-100 text-orange-800';
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'sold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'in_stock': return 'In Stock';
      case 'in_repair': return 'In Repair';
      case 'maintenance': return 'Maintenance';
      case 'reserved': return 'Reserved';
      case 'sold': return 'Sold';
      default: return status;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'EV': return 'bg-blue-100 text-blue-800';
      case 'REV': return 'bg-green-100 text-green-800';
      case 'ICEV': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRepairStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Action handlers
  const handleVinScanned = (vin: string) => {
    setSearchTerm(vin);
    setSearchParams({ vin });
    setIsVinScannerOpen(false);
  };

  const handleEditCar = (car: CarData) => {
    setEditingCar(car);
    setIsEditDialogOpen(true);
  };

  const handleCarUpdate = (carId: string, updates: any) => {
    setCars(prev => prev.map(car => 
      car.id === carId ? { ...car, ...updates, lastModified: new Date().toISOString() } : car
    ));
    setIsEditDialogOpen(false);
    setEditingCar(null);
    toast({
      title: "Car Updated",
      description: "Car information has been updated successfully.",
    });
  };

  const handleMoveCar = (car: CarData) => {
    setSelectedCar(car);
    setIsMoveDialogOpen(true);
  };

  const handleCarMoved = (carId: string, destination: string, notes?: string) => {
    setCars(prev => prev.map(car => 
      car.id === carId ? { ...car, currentFloor: destination, notes: notes || car.notes } : car
    ));
    setIsMoveDialogOpen(false);
    setSelectedCar(null);
    toast({
      title: "Car Moved",
      description: `Car moved to ${destination}`,
    });
  };

  const handleViewPdi = (car: CarData) => {
    setSelectedCar(car);
    setIsPdiDialogOpen(true);
  };

  const handlePdiComplete = (carId: string, pdiData: { technician: string, notes: string, photos: string[] }) => {
    setCars(prev => prev.map(car => 
      car.id === carId ? { 
        ...car, 
        pdiCompleted: true, 
        pdiStatus: 'completed',
        pdiTechnician: pdiData.technician,
        pdiNotes: pdiData.notes,
        pdiDate: new Date().toISOString()
      } : car
    ));
    setIsPdiDialogOpen(false);
    setSelectedCar(null);
    toast({
      title: "PDI Completed",
      description: "Pre-delivery inspection completed successfully.",
    });
  };

  const handleStatusClick = (car: CarData) => {
    setSelectedCar(car);
    setIsStatusDialogOpen(true);
  };

  const handleStatusUpdate = (carId: string, status: 'in_stock' | 'sold' | 'reserved' | 'in_repair' | 'maintenance', clientInfo?: any) => {
    setCars(prev => prev.map(car => 
      car.id === carId ? { 
        ...car, 
        status,
        clientName: clientInfo?.name || car.clientName,
        clientPhone: clientInfo?.phone || car.clientPhone,
        lastModified: new Date().toISOString()
      } : car
    ));
    setIsStatusDialogOpen(false);
    setSelectedCar(null);
    toast({
      title: "Status Updated",
      description: `Car status updated to ${getStatusDisplayName(status)}`,
    });
  };

  const handleTestDriveClick = (car: CarData) => {
    setSelectedCar(car);
    setIsTestDriveDialogOpen(true);
  };

  const handleCustomsClick = (car: CarData) => {
    setSelectedCar(car);
    setIsCustomsDialogOpen(true);
  };

  const handleSoftwareClick = (car: CarData) => {
    setSelectedCar(car);
    setIsSoftwareDialogOpen(true);
  };

  const handleSoftwareUpdate = (carId: string, updates: {
    softwareVersion: string;
    softwareLastUpdated: string;
    softwareUpdateBy: string;
    softwareUpdateNotes: string;
  }) => {
    setCars(prev => prev.map(car => 
      car.id === carId ? { 
        ...car, 
        ...updates,
        lastModified: new Date().toISOString()
      } : car
    ));
    setIsSoftwareDialogOpen(false);
    setSelectedCar(null);
    toast({
      title: "Software Updated",
      description: "Software version updated successfully.",
    });
  };

  const handleViewDetails = (car: CarData) => {
    setSelectedCar(car);
    setIsDetailsDialogOpen(true);
  };

  const handleRefreshInventory = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Inventory Refreshed",
        description: "Garage inventory has been updated.",
      });
    }, 1000);
  };

  const handleExportToExcel = () => {
    toast({
      title: "Excel Export",
      description: "Garage inventory data exported to Excel successfully.",
    });
  };

  const handleNavigateToGarageSchedule = () => {
    navigate('/garage-schedule');
  };

  const handleNavigateToRepairs = () => {
    navigate('/repairs');
  };

  // Get unique models for filter
  const uniqueModels = ['All Models', ...Array.from(new Set(cars.map(car => car.model)))];
  const uniqueStatuses = ['All Status', 'in_stock', 'in_repair', 'maintenance', 'reserved', 'sold'];
  const uniqueCategories = ['All Categories', 'EV', 'REV', 'ICEV'];

  return (
    <div className="space-y-6 p-6">
      {/* Header with Garage Integration */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6 text-blue-600" />
            Garage Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage cars in garage for repairs, maintenance, and PDI with comprehensive tracking
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshInventory}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportToExcel}>
            <Download className="mr-1 h-4 w-4" />
            Export to Excel
          </Button>
          <Button variant="outline" onClick={() => setIsVinScannerOpen(true)}>
            <QrCode className="mr-1 h-4 w-4" />
            Scan VIN
          </Button>
        </div>
      </div>

      {/* Garage Integration Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Car className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Total Cars</h3>
                <p className="text-2xl font-bold text-purple-600">{stats.totalCars}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Garage Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">In Repair</p>
                <p className="text-2xl font-bold text-orange-600">{stats.inRepair}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-blue-600">{stats.maintenance}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending PDI</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingPDI}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed PDI</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedPDI}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by VIN, model, or mechanic..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          {uniqueModels.map(model => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          {uniqueStatuses.map(status => (
            <option key={status} value={status}>
              {status === 'All Status' ? 'All Status' : getStatusDisplayName(status)}
            </option>
          ))}
        </select>

        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {uniqueCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
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
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">VIN</TableHead>
                  <TableHead className="font-semibold">Model</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Year</TableHead>
                  <TableHead className="font-semibold">Color</TableHead>
                  <TableHead className="font-semibold">Price</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Battery</TableHead>
                  <TableHead className="font-semibold">Range</TableHead>
                  <TableHead className="font-semibold">Test Drive</TableHead>
                  <TableHead className="font-semibold">PDI</TableHead>
                  <TableHead className="font-semibold">Customs</TableHead>
                  <TableHead className="font-semibold">Software Model</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredCars.map((car) => (
                  <TableRow key={car.id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm">{car.vinNumber}</TableCell>
                    <TableCell className="font-medium">{car.model}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(car.category)}>
                        {car.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{car.year}</TableCell>
                    <TableCell>{car.color}</TableCell>
                    <TableCell className="font-medium">${car.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge 
                        className={`${getStatusColor(car.status)} cursor-pointer hover:opacity-80 transition-all hover:scale-105 active:scale-95`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusClick(car);
                        }}
                        title="Click to change status"
                      >
                        {getStatusDisplayName(car.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Battery className="h-4 w-4" />
                        {car.batteryPercentage}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Fuel className="h-4 w-4" />
                        {car.range} km
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTestDriveClick(car);
                        }}
                      >
                        {car.testDriveInfo?.isOnTestDrive ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-all hover:scale-105 active:scale-95">
                            <Clock className="mr-1 h-3 w-3" />
                            {car.testDriveInfo.isClientTestDrive ? 'Client' : 'Employee'} Test Drive
                          </Badge>
                        ) : car.status === 'sold' || car.status === 'reserved' ? (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all hover:scale-105 active:scale-95">
                            Not Available
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all hover:scale-105 active:scale-95">
                            Available
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewPdi(car);
                        }}
                      >
                        {car.pdiCompleted ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 transition-all hover:scale-105 active:scale-95">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-all hover:scale-105 active:scale-95">
                            <Clock className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCustomsClick(car);
                        }}
                      >
                        <Badge className={`${car.customs === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} hover:opacity-80 transition-all hover:scale-105 active:scale-95`}>
                          {car.customs === 'paid' ? 'Paid' : 'Not Paid'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div 
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSoftwareClick(car);
                        }}
                      >
                        <Badge variant="outline" className="bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all hover:scale-105 active:scale-95">
                          <Monitor className="mr-1 h-3 w-3" />
                          {car.softwareVersion || 'N/A'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(car)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCar(car)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMoveCar(car)}
                        >
                          <MapPin className="h-4 w-4 mr-1" />
                          Move
                        </Button>
                      </div>
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
         isOpen={isVinScannerOpen}
         onClose={() => setIsVinScannerOpen(false)}
         onVinScanned={handleVinScanned}
       />

       {/* Simple dialogs for garage functionality */}
       {editingCar && (
         <Dialog open={isEditDialogOpen} onOpenChange={() => {
           setIsEditDialogOpen(false);
           setEditingCar(null);
         }}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Edit Car Information</DialogTitle>
             </DialogHeader>
             <div className="space-y-4">
               <div>
                 <Label>VIN Number</Label>
                 <Input value={editingCar.vinNumber} readOnly />
               </div>
               <div>
                 <Label>Model</Label>
                 <Input value={editingCar.model} readOnly />
               </div>
               <div>
                 <Label>Status</Label>
                 <Select value={editingCar.status} onValueChange={(value) => {
                   handleCarUpdate(editingCar.id, { status: value });
                 }}>
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="in_stock">In Stock</SelectItem>
                     <SelectItem value="in_repair">In Repair</SelectItem>
                     <SelectItem value="maintenance">Maintenance</SelectItem>
                     <SelectItem value="reserved">Reserved</SelectItem>
                     <SelectItem value="sold">Sold</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label>Assigned Mechanic</Label>
                 <Input 
                   value={editingCar.assignedMechanic || ''} 
                   onChange={(e) => {
                     handleCarUpdate(editingCar.id, { assignedMechanic: e.target.value });
                   }}
                   placeholder="Enter mechanic name"
                 />
               </div>
               <div>
                 <Label>Repair Notes</Label>
                 <Textarea 
                   value={editingCar.repairNotes || ''} 
                   onChange={(e) => {
                     handleCarUpdate(editingCar.id, { repairNotes: e.target.value });
                   }}
                   placeholder="Enter repair notes"
                 />
               </div>
             </div>
           </DialogContent>
         </Dialog>
       )}

       {selectedCar && (
         <Dialog open={isDetailsDialogOpen} onOpenChange={() => {
           setIsDetailsDialogOpen(false);
           setSelectedCar(null);
         }}>
           <DialogContent className="max-w-2xl">
             <DialogHeader>
               <DialogTitle>Car Details - {selectedCar.model}</DialogTitle>
             </DialogHeader>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label className="font-semibold">VIN Number</Label>
                 <p className="text-sm">{selectedCar.vinNumber}</p>
               </div>
               <div>
                 <Label className="font-semibold">Model</Label>
                 <p className="text-sm">{selectedCar.model}</p>
               </div>
               <div>
                 <Label className="font-semibold">Year</Label>
                 <p className="text-sm">{selectedCar.year}</p>
               </div>
               <div>
                 <Label className="font-semibold">Color</Label>
                 <p className="text-sm">{selectedCar.color}</p>
               </div>
               <div>
                 <Label className="font-semibold">Price</Label>
                 <p className="text-sm">${selectedCar.price.toLocaleString()}</p>
               </div>
               <div>
                 <Label className="font-semibold">Status</Label>
                 <Badge className={getStatusColor(selectedCar.status)}>
                   {getStatusDisplayName(selectedCar.status)}
                 </Badge>
               </div>
               <div>
                 <Label className="font-semibold">Battery</Label>
                 <p className="text-sm">{selectedCar.batteryPercentage}%</p>
               </div>
               <div>
                 <Label className="font-semibold">Range</Label>
                 <p className="text-sm">{selectedCar.range} km</p>
               </div>
               <div>
                 <Label className="font-semibold">PDI Status</Label>
                 <Badge className={selectedCar.pdiCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                   {selectedCar.pdiCompleted ? 'Completed' : 'Pending'}
                 </Badge>
               </div>
               <div>
                 <Label className="font-semibold">Customs</Label>
                 <Badge className={selectedCar.customs === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                   {selectedCar.customs === 'paid' ? 'Paid' : 'Not Paid'}
                 </Badge>
               </div>
               <div>
                 <Label className="font-semibold">Software Version</Label>
                 <p className="text-sm">{selectedCar.softwareVersion || 'N/A'}</p>
               </div>
               <div>
                 <Label className="font-semibold">Assigned Mechanic</Label>
                 <p className="text-sm">{selectedCar.assignedMechanic || 'Not assigned'}</p>
               </div>
               <div className="col-span-2">
                 <Label className="font-semibold">Repair Notes</Label>
                 <p className="text-sm">{selectedCar.repairNotes || 'No notes'}</p>
               </div>
             </div>
           </DialogContent>
         </Dialog>
       )}

       {/* Test Drive Dialog */}
       {selectedCar && (
         <SimpleTestDriveDialog
           isOpen={isTestDriveDialogOpen}
           onClose={() => {
             setIsTestDriveDialogOpen(false);
             setSelectedCar(null);
           }}
           car={selectedCar}
           onStartTestDrive={(carId, testDriveInfo) => {
             console.log('Test drive started:', carId, testDriveInfo);
             toast({
               title: "Test Drive Started",
               description: `Test drive started for ${selectedCar.model}`,
             });
             setIsTestDriveDialogOpen(false);
             setSelectedCar(null);
           }}
           onEndTestDrive={(carId) => {
             console.log('Test drive ended:', carId);
             toast({
               title: "Test Drive Ended",
               description: `Test drive ended for ${selectedCar.model}`,
             });
             setIsTestDriveDialogOpen(false);
             setSelectedCar(null);
           }}
         />
       )}

       {/* Software Update Dialog */}
       {selectedCar && (
         <ITSoftwareUpdateDialog
           isOpen={isSoftwareDialogOpen}
           onClose={() => {
             setIsSoftwareDialogOpen(false);
             setSelectedCar(null);
           }}
           car={{
             vinNumber: selectedCar.vinNumber,
             model: selectedCar.model,
             currentVersion: selectedCar.softwareVersion || 'N/A',
             lastUpdated: selectedCar.softwareLastUpdated || '',
             lastUpdatedBy: selectedCar.softwareUpdateBy || '',
             notes: selectedCar.softwareUpdateNotes || '',
             needsUpdate: !selectedCar.softwareVersion,
             priority: !selectedCar.softwareVersion ? 'critical' : 'medium'
           }}
           onUpdateComplete={(carVin, updateData) => {
             console.log('Software updated:', carVin, updateData);
             handleSoftwareUpdate(selectedCar.id, {
               softwareVersion: updateData.newVersion,
               softwareLastUpdated: new Date().toISOString(),
               softwareUpdateBy: updateData.updatedBy || 'IT Staff',
               softwareUpdateNotes: updateData.notes || ''
             });
             toast({
               title: "Software Updated",
               description: `Software updated for ${selectedCar.model}`,
             });
             setIsSoftwareDialogOpen(false);
             setSelectedCar(null);
           }}
         />
       )}

       {/* Status Selection Dialog */}
       {selectedCar && (
         <CarStatusSelectionDialog
           isOpen={isStatusDialogOpen}
           onClose={() => {
             setIsStatusDialogOpen(false);
             setSelectedCar(null);
           }}
           car={{
             id: selectedCar.id,
             model: selectedCar.model,
             vinNumber: selectedCar.vinNumber,
             brand: selectedCar.brand,
             year: selectedCar.year,
             color: selectedCar.color,
             status: selectedCar.status === 'in_repair' || selectedCar.status === 'maintenance' ? 'in_stock' : selectedCar.status,
             clientName: selectedCar.clientName,
             clientPhone: selectedCar.clientPhone,
             clientEmail: '',
             clientLicensePlate: selectedCar.clientLicensePlate,
             notes: selectedCar.notes
           }}
           onStatusUpdate={(carId, newStatus, clientInfo) => {
             handleStatusUpdate(carId, newStatus, clientInfo);
             setIsStatusDialogOpen(false);
             setSelectedCar(null);
           }}
         />
       )}

       {/* PDI Dialog */}
       {selectedCar && (
         <PdiViewDialog
           isOpen={isPdiDialogOpen}
           onClose={() => {
             setIsPdiDialogOpen(false);
             setSelectedCar(null);
           }}
           car={selectedCar}
           onPdiComplete={handlePdiComplete}
         />
       )}

       {/* Customs Dialog */}
       {selectedCar && (
         <Dialog open={isCustomsDialogOpen} onOpenChange={() => {
           setIsCustomsDialogOpen(false);
           setSelectedCar(null);
         }}>
           <DialogContent className="max-w-md">
             <DialogHeader>
               <DialogTitle>Customs Status - {selectedCar.model}</DialogTitle>
             </DialogHeader>
             <div className="space-y-4">
               <div>
                 <Label>Current Status</Label>
                 <Badge className={selectedCar.customs === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                   {selectedCar.customs === 'paid' ? 'Paid' : 'Not Paid'}
                 </Badge>
               </div>
               <div>
                 <Label>Update Status</Label>
                 <Select 
                   value={selectedCar.customs || 'not paid'} 
                   onValueChange={(value) => {
                     handleCarUpdate(selectedCar.id, { customs: value as 'paid' | 'not paid' });
                     toast({
                       title: "Customs Status Updated",
                       description: `Customs status updated for ${selectedCar.model}`,
                     });
                     setIsCustomsDialogOpen(false);
                     setSelectedCar(null);
                   }}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="paid">Paid</SelectItem>
                     <SelectItem value="not paid">Not Paid</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
           </DialogContent>
         </Dialog>
       )}
    </div>
  );
};

export default GarageInventoryPage;
