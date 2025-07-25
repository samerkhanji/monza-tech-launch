import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import {
  Car as CarIcon,
  QrCode,
  Plus,
  Battery,
  Fuel,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  User,
  FileText,
  Eye,
  Monitor,
  MapPin
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
import { useCarInventory } from './hooks/useCarInventory';
import { Car } from './types';
import { testDriveService, TestDriveInfo } from '@/services/testDriveService';
import '@/styles/car-status-dialog-scrollbar.css';
import ITSoftwareUpdateDialog from '@/components/ITSoftwareUpdateDialog';
import TableSearch from '@/components/ui/table-search';
import { kilometersService } from '@/services/kilometersService';

interface CarData {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  price: number;
  status: 'sold' | 'reserved' | 'in_stock';
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
}

const CarInventoryPage: React.FC = () => {
  const { cars: inventoryCars, handleCarUpdate } = useCarInventory();
  
  // Convert cars from useCarInventory to our interface
  const cars: CarData[] = inventoryCars.map(car => {
    // Map status to valid values
    let mappedStatus: 'sold' | 'reserved' | 'in_stock' = 'in_stock';
    if (car.status === 'sold') mappedStatus = 'sold';
    else if (car.status === 'reserved') mappedStatus = 'reserved';
    else mappedStatus = 'in_stock'; // Default for available, in_stock, or any other value

    // Map category to valid values
    const validCategories = ['EV', 'REV', 'ICEV'];
    const mappedCategory = validCategories.includes((car as any).category) 
      ? (car as any).category as 'EV' | 'REV' | 'ICEV'
      : 'EV';

    return {
    id: car.id,
    vinNumber: car.vinNumber,
    model: car.model,
    year: car.year,
    color: car.color,
    price: car.sellingPrice || 0,
      status: mappedStatus,
      category: mappedCategory,
    batteryPercentage: car.batteryPercentage || 100,
    range: (car as any).range || 520,
    features: (car as any).features || [],
    arrivalDate: car.arrivalDate || new Date().toISOString(),
    pdiCompleted: car.pdiCompleted,
    pdiStatus: car.pdiCompleted ? 'completed' : 'pending',
    pdiTechnician: car.pdiTechnician,
    pdiDate: car.pdiDate,
    pdiNotes: car.pdiNotes,
    testDriveInfo: car.testDriveInfo,
    customs: car.customs === 'paid' ? 'paid' : 'not paid',
              brand: car.brand,
        currentFloor: (car as any).current_location || car.category,
        purchasePrice: (car as any).purchase_price,
        clientName: (car as any).client_name,
        clientPhone: (car as any).client_phone,
        clientLicensePlate: (car as any).client_license_plate,
        expectedDeliveryDate: (car as any).expected_delivery_date,
        notes: car.notes,
        lastModified: (car as any).updated_at,
        // Software Model fields - For testing, randomly assign some cars as needing updates
        softwareVersion: Math.random() > 0.5 ? (car as any).softwareVersion || '2.1.0' : undefined,
        softwareLastUpdated: Math.random() > 0.5 ? (car as any).softwareLastUpdated || '2024-01-15' : undefined,
        softwareUpdateBy: Math.random() > 0.5 ? (car as any).softwareUpdateBy || 'IT Team' : undefined,
        softwareUpdateNotes: Math.random() > 0.5 ? (car as any).softwareUpdateNotes || 'Routine update' : undefined,
    };
  });

  // Get URL search parameters for filtering
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get('filter');

  // Filter cars based on URL parameter
  const getFilteredCarsByCategory = () => {
    switch (filterType) {
      case 'ready':
        // Ready cars: delivered, completed, displayed, PDI passed
        return cars.filter(car => 
          car.status === 'sold' || 
          car.pdiStatus === 'completed' ||
          car.currentFloor === 'showroom' ||
          car.pdiCompleted === true
        );
      case 'attention':
        // Need attention: failures, pending work, issues
        return cars.filter(car =>
          car.status === 'reserved' ||
          car.pdiStatus === 'failed' ||
          car.customs === 'not paid' ||
          car.softwareVersion === undefined ||
          car.notes?.toLowerCase().includes('issue') ||
          car.notes?.toLowerCase().includes('problem') ||
          car.notes?.toLowerCase().includes('repair')
        );
      default:
        return cars;
    }
  };

  const [showVinScanner, setShowVinScanner] = useState(false);
  const [showManualAddDialog, setShowManualAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [showTestDriveSelectionDialog, setShowTestDriveSelectionDialog] = useState(false);
  const [showPdiDialog, setShowPdiDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showEnhancedDetailsDialog, setShowEnhancedDetailsDialog] = useState(false);
  const [selectedCarForStatus, setSelectedCarForStatus] = useState<CarData | null>(null);
  const [selectedCarForDetails, setSelectedCarForDetails] = useState<CarData | null>(null);
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
  const [isClientTestDrive, setIsClientTestDrive] = useState(false);
  const [selectedCarForSoftware, setSelectedCarForSoftware] = useState<CarData | null>(null);
  const [showSoftwareUpdateDialog, setShowSoftwareUpdateDialog] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter cars based on both category filter and search query
  const filteredCars = (() => {
    // First apply category filter
    const categoryFilteredCars = getFilteredCarsByCategory();
    
    // Then apply search filter
    if (!searchQuery.trim()) return categoryFilteredCars;
    
    const query = searchQuery.toLowerCase();
    return categoryFilteredCars.filter(car => (
      car.vinNumber.toLowerCase().includes(query) ||
      car.model.toLowerCase().includes(query) ||
      car.color.toLowerCase().includes(query) ||
      car.category.toLowerCase().includes(query) ||
      car.status.toLowerCase().includes(query) ||
      car.brand?.toLowerCase().includes(query) ||
      car.clientName?.toLowerCase().includes(query) ||
      car.clientPhone?.toLowerCase().includes(query) ||
      car.notes?.toLowerCase().includes(query) ||
      car.year.toString().includes(query) ||
      car.price.toString().includes(query)
    ));
  })();

  const [newCar, setNewCar] = useState({
    vinNumber: '',
    model: 'Voyah Dream',
    year: 2024,
    color: '',
    price: 0,
    status: 'available',
    category: 'EV' as 'EV' | 'REV' | 'ICEV',
    batteryPercentage: 100,
    range: 520,
    pdiStatus: 'pending',
    customs: 'not paid',
    horsePower: 350,
    torque: 500,
    acceleration: '4.5',
    topSpeed: 250,
    chargingTime: '30 minutes',
    warranty: '4 years / 80,000 km',
  });

  const handleVinScanned = (vin: string) => {
    setShowVinScanner(false);
    toast({
      title: "VIN Scanned",
      description: `VIN ${vin} detected`,
    });
  };

  const handleCarMoved = (carId: string, fromLocation: string, toLocation: string) => {
    toast({
      title: "Car Moved",
      description: `Car moved from ${fromLocation} to ${toLocation}`,
    });
  };

  const handleCarAdded = (carId: string) => {
    toast({
      title: "Car Added",
      description: "Car has been added to inventory",
    });
  };

  const handleManualAdd = () => {
    const carData = {
      ...newCar,
      id: Date.now().toString(),
      arrivalDate: new Date().toISOString(),
    };
    
    console.log('Adding car:', carData);
    setShowManualAddDialog(false);
    
    // Reset form
    setNewCar({
      vinNumber: '',
      model: 'Voyah Dream',
      year: 2024,
      color: '',
      price: 0,
      status: 'available',
      category: 'EV',
      batteryPercentage: 100,
      range: 520,
      pdiStatus: 'pending',
      customs: 'not paid',
      horsePower: 350,
      torque: 500,
      acceleration: '4.5',
      topSpeed: 250,
      chargingTime: '30 minutes',
      warranty: '4 years / 80,000 km',
    });

    toast({
      title: "Car Added",
      description: `${carData.model} has been added to inventory`,
    });
  };

  const handleEditCar = (carId: string, updates: any) => {
    // Convert updates back to the original car format for useCarInventory
    const carUpdates = {
      ...updates,
      sellingPrice: updates.price,
      status: updates.status === 'available' ? 'in_stock' : updates.status,
      customs: updates.customs === 'paid' ? 'paid' : 'not_paid',
      // Handle software fields
      softwareVersion: updates.softwareVersion,
      softwareLastUpdated: updates.softwareLastUpdated,
      softwareUpdateBy: updates.softwareUpdateBy,
      softwareUpdateNotes: updates.softwareUpdateNotes,
    };
    
    handleCarUpdate(carId, carUpdates);
    setShowEditDialog(false);
    setSelectedCar(null);
    
    toast({
      title: "Car Updated",
      description: "Car details have been updated",
    });
  };

  const handleMoveCar = (destination: string, notes?: string) => {
    if (selectedCar) {
      console.log(`Moving car ${selectedCar.id} to ${destination} with notes: ${notes}`);
      
      setShowMoveDialog(false);
      setSelectedCar(null);
      
      toast({
        title: "Car Moved",
        description: `${selectedCar.model} has been moved`,
      });
    }
  };

  const handleViewDetails = (car: CarData) => {
    setSelectedCar(car);
    setShowDetailsDialog(true);
  };

  const handleViewPdi = (car: CarData) => {
    setSelectedCar(car);
    setShowPdiDialog(true);
  };

  const handleScheduleTestDrive = (car: CarData) => {
    setSelectedCar(car);
    setShowTestDriveSelectionDialog(true);
  };

  const handleTestDriveTypeSelection = (isClientTestDrive: boolean) => {
    setIsClientTestDrive(isClientTestDrive);
    setShowTestDriveSelectionDialog(false);
    setShowTestDriveDialog(true);
  };

  const handleActualTestDriveSchedule = (carId: string, testDriveInfo: any) => {
    // Update car with test drive info
    handleEditCar(carId, {
      testDriveInfo: {
        ...testDriveInfo,
        isOnTestDrive: true
      }
    });

    toast({
      title: "Test Drive Scheduled",
      description: `${testDriveInfo.isClientTestDrive ? 'Client' : 'Employee'} test drive scheduled`,
    });
    
    setShowTestDriveDialog(false);
    setSelectedCar(null);
  };

  const handleTestDriveEnd = (carId: string) => {
    const car = cars.find(c => c.id === carId);
    if (!car || !car.testDriveInfo) return;

    // Convert car test drive info to TestDriveInfo format
    const testDriveInfo: TestDriveInfo = {
      isOnTestDrive: car.testDriveInfo.isOnTestDrive,
      testDriveStartTime: car.testDriveInfo.testDriveStartTime,
      testDriverName: car.testDriveInfo.testDriverName,
      testDriverPhone: car.testDriveInfo.testDriverPhone,
      testDriverLicense: car.testDriveInfo.testDriverLicense,
      notes: car.testDriveInfo.notes,
      purpose: car.testDriveInfo.purpose || 'Test drive',
      isClientTestDrive: car.testDriveInfo.isClientTestDrive || false,
      loggedBy: car.testDriveInfo.loggedBy || 'System',
      loggedByName: car.testDriveInfo.loggedByName || 'System User',
      loggedAt: car.testDriveInfo.loggedAt || new Date().toISOString(),
      emergencyContact: car.testDriveInfo.emergencyContact,
      emergencyContactPhone: car.testDriveInfo.emergencyContactPhone,
      vehicleVin: car.vinNumber,
      vehicleModel: car.model
    };

    // End the test drive and calculate duration
    const completedTestDrive = testDriveService.endTestDrive(testDriveInfo);
    
    // Update car with completed test drive in history
    const updatedCar = testDriveService.addToHistory(car, completedTestDrive);
    
    // Update the car in state
    handleEditCar(carId, {
      testDriveInfo: undefined,
      testDriveHistory: updatedCar.testDriveHistory
    });

    const durationText = testDriveService.formatDuration(completedTestDrive.actualDuration || 0);
    
    toast({
      title: "Test Drive Completed",
      description: `Test drive completed in ${durationText}. Added to vehicle history.`,
    });
  };

  const handlePdiComplete = (carId: string, pdiData: { technician: string, notes: string, photos: string[] }) => {
    handleEditCar(carId, {
      pdiCompleted: true,
      pdiTechnician: pdiData.technician,
      pdiNotes: pdiData.notes,
      pdiPhotos: pdiData.photos,
      pdiDate: new Date().toISOString()
    });

    toast({
      title: "PDI Completed",
      description: "Pre-Delivery Inspection has been completed successfully.",
    });
  };

  const handleStatusClick = (car: CarData) => {
    setSelectedCarForStatus(car);
    setShowStatusDialog(true);
  };

  const handleStatusUpdate = (carId: string, status: 'in_stock' | 'sold' | 'reserved', clientInfo?: any) => {
    handleEditCar(carId, { 
      status,
      ...clientInfo,
      lastUpdated: new Date().toISOString()
    });

    const carModel = cars.find(c => c.id === carId)?.model;
    toast({
      title: "Car Status Updated",
      description: `${carModel} status updated to ${status.replace('_', ' ')}`
    });
  };

  const handleCustomsClick = (car: CarData) => {
    setSelectedCarForDetails(car);
    setShowEnhancedDetailsDialog(true);
  };

  const handleCarDetailsUpdate = (carId: string, updates: any) => {
    handleCarUpdate(carId, updates);
  };

  const handleSoftwareClick = (car: CarData) => {
    console.log('Software clicked for car:', car.vinNumber);
    console.log('Car software data:', {
      softwareVersion: car.softwareVersion,
      softwareLastUpdated: car.softwareLastUpdated,
      softwareUpdateBy: car.softwareUpdateBy,
      softwareUpdateNotes: car.softwareUpdateNotes
    });
    setSelectedCarForSoftware(car);
    setShowSoftwareUpdateDialog(true);
  };

  const handleSoftwareUpdate = (carId: string, updates: {
    softwareVersion: string;
    softwareLastUpdated: string;
    softwareUpdateBy: string;
    softwareUpdateNotes: string;
  }) => {
    console.log('Updating software for car:', carId, updates);
    handleEditCar(carId, updates);
    toast({
      title: "Software Updated",
      description: `Software updated successfully`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
      case 'in_stock':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'sold':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'available':
      case 'in_stock':
        return 'Available';
      case 'reserved':
        return 'Reserved';
      case 'sold':
        return 'Sold';
      default:
        return status;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'EV':
        return 'category-ev'; // Electric Vehicle
      case 'REV':
        return 'category-rev'; // Range Extended Vehicle
      case 'ICEV':
        return 'category-icev'; // Internal Combustion Engine Vehicle
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Car Inventory</h1>
            {filterType && (
              <Badge variant="outline" className="text-sm font-medium">
                {filterType === 'ready' && (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Ready Cars
                  </>
                )}
                {filterType === 'attention' && (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Need Attention
                  </>
                )}
              </Badge>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            {filterType === 'ready' && 'Cars ready for delivery and completed processing'}
            {filterType === 'attention' && 'Cars requiring immediate attention or action'}
            {!filterType && 'Manage your car inventory and track vehicle details'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowVinScanner(true)}
            variant="outline"
            className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
          >
            <QrCode className="h-4 w-4" />
            VIN Scanner
          </Button>
          <Button
            onClick={() => setShowManualAddDialog(true)}
            className="flex items-center gap-2 bg-monza-yellow text-monza-black hover:bg-monza-yellow/90"
          >
            <Plus className="h-4 w-4" />
            Add Car Manually
          </Button>
        </div>
      </div>

      {/* Cars Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <CarIcon className="h-5 w-5" />
              {filterType === 'ready' && `Ready Cars (${filteredCars.length})`}
              {filterType === 'attention' && `Cars Needing Attention (${filteredCars.length})`}
              {!filterType && `Car Inventory (${filteredCars.length} ${searchQuery ? `of ${cars.length}` : ''})`}
            </CardTitle>
            <div className="flex items-center gap-2">
              {filterType && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/car-inventory'}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear Filter
                </Button>
              )}
              <TableSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search VINs, models, clients, colors..."
                className="w-full sm:w-auto"
              />
            </div>
          </div>
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
                  <TableHead className="font-semibold">Range Capacity</TableHead>
                  <TableHead className="font-semibold">Km Driven</TableHead>
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
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {kilometersService.getKilometersDriven(car.id)} km
                      </div>
                    </TableCell>
                    <TableCell>
                      {car.testDriveInfo?.isOnTestDrive ? (
                        <Badge 
                          className="bg-blue-100 text-blue-800 border-blue-200 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTestDriveEnd(car.id);
                          }}
                          title="Click to end test drive"
                        >
                          <Clock className="mr-1 h-3 w-3" />
                          {car.testDriveInfo.isClientTestDrive ? 'Client' : 'Employee'} Test Drive
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
                            handleScheduleTestDrive(car);
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewPdi(car);
                        }}
                      >
                        <Badge className={car.pdiCompleted ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}>
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCustomsClick(car);
                        }}
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
                        className="flex items-center gap-1 text-xs cursor-pointer hover:scale-105 transition-transform" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Software cell clicked for car:', car.vinNumber);
                          handleSoftwareClick(car);
                        }}
                        title="Click to manage software updates"
                      >
                        {car.softwareVersion ? (
                          <>
                            <Badge variant="outline" className="text-xs hover:bg-blue-50 transition-colors cursor-pointer">
                              v{car.softwareVersion}
                            </Badge>
                            {car.softwareLastUpdated && (
                              <span className="text-gray-500">
                                {new Date(car.softwareLastUpdated).toLocaleDateString()}
                              </span>
                            )}
                          </>
                        ) : (
                          <Badge 
                            variant="secondary" 
                            className="text-xs text-yellow-700 bg-yellow-100 hover:bg-yellow-200 transition-colors cursor-pointer border border-yellow-300 hover:border-yellow-400 active:scale-95"
                          >
                            Update Needed
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ActionDropdown
                        options={[
                          { value: 'details', label: 'View Details' },
                          { value: 'edit', label: 'Edit Car' },
                          { value: 'move', label: 'Move Car' }
                        ]}
                        onAction={(action) => {
                          if (action === 'details') handleViewDetails(car);
                          else if (action === 'edit') {
                            setSelectedCar(car);
                            setShowEditDialog(true);
                          } else if (action === 'move') {
                            setSelectedCar(car);
                            setShowMoveDialog(true);
                          }
                        }}
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
        targetLocation="Inventory"
        onCarMoved={handleCarMoved}
          onCarAdded={handleCarAdded}
        onTestDrive={(car, isClientTestDrive) => {
          // Convert VinScanner CarData to local CarData format
          const localCarData: CarData = {
            id: car.id,
            vinNumber: car.vin_number,
            model: car.model,
            year: car.year,
            color: car.color,
            price: car.selling_price,
            status: car.status,
            category: car.category,
            batteryPercentage: car.battery_percentage || 100,
            range: car.range_km || 0,
            features: [],
            arrivalDate: car.arrival_date,
            pdiCompleted: car.pdi_completed,
            pdiTechnician: car.pdi_technician,
            pdiDate: car.pdi_date,
            pdiNotes: car.notes,
            testDriveInfo: { isOnTestDrive: car.test_drive_status },
            customs: car.customs === 'not_paid' ? 'not paid' : car.customs === 'paid' ? 'paid' : undefined
          };
          setSelectedCar(localCarData);
          setIsClientTestDrive(isClientTestDrive);
          setShowTestDriveSelectionDialog(true);
          setShowVinScanner(false);
        }}
        onPdiAction={(car) => {
          // Convert VinScanner CarData to local CarData format
          const localCarData: CarData = {
            id: car.id,
            vinNumber: car.vin_number,
            model: car.model,
            year: car.year,
            color: car.color,
            price: car.selling_price,
            status: car.status as 'sold' | 'reserved' | 'in_stock',
            category: car.category as 'EV' | 'REV' | 'ICEV',
            batteryPercentage: car.battery_percentage || 100,
            range: car.range_km || 0,
            features: [],
            arrivalDate: car.arrival_date,
            pdiCompleted: car.pdi_completed,
            pdiTechnician: car.pdi_technician,
            pdiDate: car.pdi_date,
            pdiNotes: car.notes,
            testDriveInfo: { isOnTestDrive: car.test_drive_status },
            customs: car.customs === 'not_paid' ? 'not paid' : car.customs === 'paid' ? 'paid' : 'not paid'
          };
          setSelectedCar(localCarData);
          setShowPdiDialog(true);
          setShowVinScanner(false);
        }}
      />

      {/* Car Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent 
          className="sm:max-w-4xl max-h-[80vh] bg-white border border-gray-300 shadow-xl car-status-dialog flex flex-col" 
          style={{ 
            height: '80vh'
          }}
        >
          <DialogHeader className="border-b border-gray-200 pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <CarIcon className="h-5 w-5" />
              Vehicle Details - {selectedCar?.model}
            </DialogTitle>
          </DialogHeader>
          {selectedCar && (
            <div 
              className="flex-1 overflow-y-scroll pr-2" 
              style={{ 
                height: 'calc(80vh - 120px)',
                scrollbarWidth: 'auto',
                scrollbarColor: '#ffd700 #f8fafc'
              }}
            >
              <div className="space-y-6 pt-4 pb-20" style={{ paddingRight: '10px' }}>
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
                    <p className="font-medium">{selectedCar.brand || 'Voyah'}</p>
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
                      <p className="font-medium mt-1">{selectedCar.currentFloor || 'Main Inventory'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Arrival Date</Label>
                      <p className="font-medium mt-1">{selectedCar.arrivalDate || 'N/A'}</p>
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
                      <Label className="text-sm text-gray-600">Range</Label>
                      <p className="font-medium mt-1">{selectedCar.range} km</p>
                    </div>
                  </div>
                </div>

                {/* Pricing Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Pricing Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-600">Selling Price</Label>
                      <p className="font-bold text-lg text-green-600">${selectedCar.price.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Purchase Price</Label>
                      <p className="font-medium">${(selectedCar.purchasePrice || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Features & Equipment */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Features & Equipment</h3>
                  {selectedCar.features && selectedCar.features.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedCar.features.map((feature, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                </Badge>
                      ))}
              </div>
                  ) : (
                    <p className="text-gray-500 italic">No features listed</p>
                  )}
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
                    {selectedCar.clientLicensePlate && (
              <div>
                        <Label className="text-sm text-gray-600">License Plate</Label>
                        <p className="font-medium">{selectedCar.clientLicensePlate}</p>
              </div>
                    )}
                    {selectedCar.expectedDeliveryDate && (
              <div>
                        <Label className="text-sm text-gray-600">Expected Delivery</Label>
                        <p className="font-medium">{selectedCar.expectedDeliveryDate}</p>
                      </div>
                    )}
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
                    <p className="font-medium">{selectedCar.arrivalDate || 'N/A'}</p>
                  </div>
                  {selectedCar.pdiDate && (
                    <div>
                      <Label className="text-sm text-gray-600">PDI Completed</Label>
                      <p className="font-medium">{selectedCar.pdiDate}</p>
                    </div>
                  )}
                  {selectedCar.lastModified && (
                    <div>
                      <Label className="text-sm text-gray-600">Last Updated</Label>
                      <p className="font-medium">{selectedCar.lastModified}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Add Dialog */}
      <Dialog open={showManualAddDialog} onOpenChange={setShowManualAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CarIcon className="h-5 w-5" />
              Add Car to Inventory
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vinNumber">VIN Number *</Label>
                <Input
                  id="vinNumber"
                  value={newCar.vinNumber}
                  onChange={(e) => setNewCar(prev => ({ ...prev, vinNumber: e.target.value }))}
                  placeholder="Enter VIN number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="model">Model *</Label>
                <select
                  id="model"
                  value={newCar.model}
                  onChange={(e) => setNewCar(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="Voyah Dream">Voyah Dream</option>
                  <option value="Voyah Free">Voyah Free</option>
                  <option value="Voyah Passion">Voyah Passion</option>
                  <option value="Voyah Free 318">Voyah Free 318</option>
                  <option value="Mhero">Mhero</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  min="2020"
                  max="2030"
                  value={newCar.year}
                  onChange={(e) => setNewCar(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  value={newCar.color}
                  onChange={(e) => setNewCar(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="e.g., Midnight Silver"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={newCar.category} onValueChange={(value) => setNewCar(prev => ({ ...prev, category: value as 'EV' | 'REV' | 'ICEV' }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EV">EV (Electric Vehicle)</SelectItem>
                    <SelectItem value="REV">REV (Range Extended Vehicle)</SelectItem>
                    <SelectItem value="ICEV">ICEV (Internal Combustion Engine)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={newCar.price}
                  onChange={(e) => setNewCar(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                  placeholder="e.g., 85000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={newCar.status}
                  onChange={(e) => setNewCar(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                  <option value="reserved">Reserved</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <Label htmlFor="batteryPercentage">Battery %</Label>
                <Input
                  id="batteryPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={newCar.batteryPercentage}
                  onChange={(e) => setNewCar(prev => ({ ...prev, batteryPercentage: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="range">Range (km)</Label>
                <Input
                  id="range"
                  type="number"
                  min="0"
                  value={newCar.range}
                  onChange={(e) => setNewCar(prev => ({ ...prev, range: parseInt(e.target.value) }))}
                  placeholder="e.g., 520"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowManualAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleManualAdd}
              className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/90"
            >
              Add Car
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Car Dialog */}
      {selectedCar && (
        <EditCarDialog
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedCar(null);
          }}
          car={selectedCar}
          onSave={handleEditCar}
        />
      )}

      {/* Move Car Dialog */}
      {selectedCar && (
        <MoveCarDialog
          isOpen={showMoveDialog}
          onClose={() => {
            setShowMoveDialog(false);
            setSelectedCar(null);
          }}
          car={selectedCar}
          onMoveCar={handleMoveCar}
        />
      )}

      {/* PDI Dialog */}
      {selectedCar && (
        <PdiViewDialog
          isOpen={showPdiDialog}
          onClose={() => {
            setShowPdiDialog(false);
            setSelectedCar(null);
          }}
          car={selectedCar}
          onPdiComplete={handlePdiComplete}
        />
      )}

      {/* Test Drive Selection Dialog */}
      {selectedCar && (
        <TestDriveSelectionDialog
          isOpen={showTestDriveSelectionDialog}
          onClose={() => {
            setShowTestDriveSelectionDialog(false);
            setSelectedCar(null);
          }}
          onSelectTestDriveType={handleTestDriveTypeSelection}
          carModel={selectedCar.model}
          carVin={selectedCar.vinNumber}
        />
      )}

      {/* Test Drive Dialog */}
      {selectedCar && (
        <TestDriveDialog
          isOpen={showTestDriveDialog}
          onClose={() => {
            setShowTestDriveDialog(false);
            setSelectedCar(null);
          }}
          car={{
            ...selectedCar,
            currentFloor: selectedCar.currentFloor as "Inventory" | "Garage" | "Showroom 1" | "Showroom 2" | "New Arrivals" | undefined || "Inventory"
          } as Car}
          onScheduleTestDrive={handleActualTestDriveSchedule}
          isClientTestDrive={isClientTestDrive}
        />
      )}

      {/* Status Management Dialog */}
      {selectedCarForStatus && (
        <CarStatusSelectionDialog
          isOpen={showStatusDialog}
          onClose={() => {
            setShowStatusDialog(false);
            setSelectedCarForStatus(null);
          }}
          car={selectedCarForStatus}
          onStatusUpdate={handleStatusUpdate}
        />
      )}

      {/* Enhanced Car Details Dialog for Customs Management */}
      {selectedCarForDetails && (
        <EnhancedCarDetailDialog
          isOpen={showEnhancedDetailsDialog}
          onClose={() => {
            setShowEnhancedDetailsDialog(false);
            setSelectedCarForDetails(null);
          }}
          car={selectedCarForDetails}
          onCarUpdate={handleCarDetailsUpdate}
        />
      )}

      {/* IT Software Update Dialog */}
      <ITSoftwareUpdateDialog
        isOpen={showSoftwareUpdateDialog}
        onClose={() => {
          setShowSoftwareUpdateDialog(false);
          setSelectedCarForSoftware(null);
        }}
        car={selectedCarForSoftware ? {
          vinNumber: selectedCarForSoftware.vinNumber,
          model: selectedCarForSoftware.model,
          currentVersion: selectedCarForSoftware.softwareVersion,
          lastUpdated: selectedCarForSoftware.softwareLastUpdated,
          lastUpdatedBy: selectedCarForSoftware.softwareUpdateBy,
          notes: selectedCarForSoftware.softwareUpdateNotes,
          needsUpdate: !selectedCarForSoftware.softwareVersion,
          priority: !selectedCarForSoftware.softwareVersion ? 'critical' : 'medium'
        } : null}
        onUpdateComplete={(carVin: string, updateData: any) => {
          const carId = cars.find(c => c.vinNumber === carVin)?.id;
          if (carId) {
            handleSoftwareUpdate(carId, updateData);
          }
        }}
      />
    </div>
  );
};

export default CarInventoryPage;
