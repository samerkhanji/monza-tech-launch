import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Eye, Plus, Battery, Fuel, Phone, User, Clock, Edit, MapPin, FileText, MoreVertical, X, CheckCircle, QrCode } from 'lucide-react';
import VinScannerDialog from '@/components/VinScannerDialog';
import { toast } from '@/hooks/use-toast';
import TestDriveDialog from '@/pages/CarInventory/components/TestDriveDialog';
import TestDriveSelectionDialog from '@/components/TestDriveSelectionDialog';
import TestDriveStatus from '@/pages/CarInventory/components/TestDriveStatus';
import MoveCarDialog from '@/pages/ShowroomFloor1/components/MoveCarDialog';
import EditCarDialog from '@/pages/ShowroomFloor1/components/EditCarDialog';
import PdiViewDialog from '@/pages/ShowroomFloor1/components/PdiViewDialog';
import ClientInfoDialog from '@/pages/ShowroomFloor1/components/ClientInfoDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell, StatusBadge } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import ActionDropdown from '@/components/ui/ActionDropdown';
import { CarStatusSelectionDialog } from '@/components/CarStatusSelectionDialog';
import { PdiButton } from '@/components/ui/PdiButton';
import DeliveryDateDialog from '@/components/DeliveryDateDialog';

import EnhancedCarDetailDialog from '@/components/EnhancedCarDetailDialog';
import { testDriveService, TestDriveInfo } from '@/services/testDriveService';
import ITSoftwareUpdateDialog from '@/components/ITSoftwareUpdateDialog';
import TableSearch from '@/components/ui/table-search';

const ShowroomFloor1Page: React.FC = () => {
  const location = useLocation();
  const [cars, setCars] = useState<any[]>([]);
  const [selectedCar, setSelectedCar] = useState<any>(null);
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [showTestDriveSelectionDialog, setShowTestDriveSelectionDialog] = useState(false);
  const [selectedTestDriveType, setSelectedTestDriveType] = useState<boolean>(true);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showManualAddDialog, setShowManualAddDialog] = useState(false);
  const [showVinScanner, setShowVinScanner] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showPdiDialog, setShowPdiDialog] = useState(false);
  const [showClientInfoDialog, setShowClientInfoDialog] = useState(false);
  const [selectedCarForClientInfo, setSelectedCarForClientInfo] = useState<any>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedCarForStatus, setSelectedCarForStatus] = useState<any>(null);
  const [showDeliveryDateDialog, setShowDeliveryDateDialog] = useState(false);
  const [carForDeliveryDate, setCarForDeliveryDate] = useState<any>(null);
  const [showFullPdiDialog, setShowFullPdiDialog] = useState(false);
  const [showEnhancedDetailsDialog, setShowEnhancedDetailsDialog] = useState(false);
  const [selectedCarForDetails, setSelectedCarForDetails] = useState<any>(null);
  const [showSoftwareDialog, setShowSoftwareDialog] = useState(false);
  const [selectedCarForSoftware, setSelectedCarForSoftware] = useState<any>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter cars based on search query
  const filteredCars = cars.filter(car => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      car.vinNumber?.toLowerCase().includes(query) ||
      car.model?.toLowerCase().includes(query) ||
      car.color?.toLowerCase().includes(query) ||
      car.category?.toLowerCase().includes(query) ||
      car.status?.toLowerCase().includes(query) ||
      car.brand?.toLowerCase().includes(query) ||
      car.clientName?.toLowerCase().includes(query) ||
      car.clientPhone?.toLowerCase().includes(query) ||
      car.notes?.toLowerCase().includes(query) ||
      car.year?.toString().includes(query) ||
      car.price?.toString().includes(query)
    );
  });

  // Manual add form state
  const [newCar, setNewCar] = useState({
    vinNumber: '',
    model: 'Voyah Dream',
    brand: 'Voyah',
    year: new Date().getFullYear(),
    color: '',
    price: 0,
    batteryPercentage: 100,
    range: 0,
    status: 'available',
    customs: 'not paid',
    pdiStatus: 'pending',
    category: 'EV' as 'EV' | 'REV' | 'ICEV',
    
    // Technical Specifications (for car details view)
    horsePower: 0,
    torque: 0,
    acceleration: '',
    topSpeed: 0,
    chargingTime: '',
    warranty: '',
    
    location: 'Showroom Floor 1'
  });

  const [addCarStep, setAddCarStep] = useState(0);

  useEffect(() => {
    // Load cars from localStorage
    const loadCars = () => {
      const savedCars = localStorage.getItem('showroomFloor1Cars');
      if (savedCars) {
        try {
          const parsedCars = JSON.parse(savedCars);
          // Add default category for cars that don't have it
          return parsedCars.map((car: any) => ({
            ...car,
            category: car.category || 'EV' // Default to EV if no category exists
          }));
        } catch (error) {
          console.error('Error parsing showroom floor 1 cars from localStorage:', error);
        }
      }
      return [];
    };

    setCars(loadCars());
    
    // Listen for storage changes (for cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'showroomFloor1Cars' && e.newValue) {
        try {
          const parsedCars = JSON.parse(e.newValue);
          // Add default category for cars that don't have it
          const updatedCars = parsedCars.map((car: any) => ({
            ...car,
            category: car.category || 'EV' // Default to EV if no category exists
          }));
          setCars(updatedCars);
        } catch (error) {
          console.error('Error parsing showroom floor 1 cars from storage event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Handle URL parameters for VIN filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const vinParam = urlParams.get('vin');
    
    if (vinParam) {
      // Auto-scroll to the car row or show notification
      setTimeout(() => {
        const matchingCar = cars.find(car => 
          car.vinNumber?.toLowerCase().includes(vinParam.toLowerCase())
        );
        if (matchingCar) {
          // Success toast
          toast({
            title: "Car Found in Showroom Floor 1",
            description: `Showing ${matchingCar.brand || 'Vehicle'} ${matchingCar.model} (VIN: ${matchingCar.vinNumber})`,
            duration: 5000,
          });
        } else {
          // Warning toast if not found
          toast({
            title: "Car Not Found",
            description: `No car found with VIN: ${vinParam} in Showroom Floor 1`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }, 500); // Small delay to ensure cars are loaded
    }
  }, [location.search, cars]);

  // Function to save cars to localStorage
  const saveCarsToStorage = (updatedCars: any[]) => {
    localStorage.setItem('showroomFloor1Cars', JSON.stringify(updatedCars));
  };

  const handleVinScanned = (vin: string) => {
    const existingCar = cars.find(c => c.vinNumber === vin);
    if (existingCar) {
      toast({
        title: "Car Already Exists",
        description: `${existingCar.model} is already in Floor 1`,
        variant: "destructive"
      });
      return;
    }

    // Create new car from scanned VIN
    const newScannedCar = {
      id: `floor1-${Date.now()}`,
      vinNumber: vin,
      model: `Vehicle ${vin.slice(-4)}`,
      year: new Date().getFullYear(),
      color: 'Unknown',
      price: 0,
      status: 'in_stock',
      batteryPercentage: 100,
      range: 0,
      features: [],
      arrivalDate: new Date().toISOString(),
      category: 'EV' as 'EV' | 'REV' | 'ICEV'
    };

    const updatedCars = [...cars, newScannedCar];
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);
    setShowVinScanner(false);
    
    toast({
      title: "Car Added",
      description: `Vehicle with VIN ${vin} added to Floor 1`
    });
  };

  // Handler for Universal VIN Scanner
  const handleUniversalVinScanned = (vinData: any, targetLocation: any) => {
    // Refresh cars list
    const loadCars = () => {
      const savedCars = localStorage.getItem('showroomFloor1Cars');
      if (savedCars) {
        try {
          const parsedCars = JSON.parse(savedCars);
          // Add default category for cars that don't have it
          return parsedCars.map((car: any) => ({
            ...car,
            category: car.category || 'EV' // Default to EV if no category exists
          }));
        } catch (error) {
          console.error('Error parsing showroom floor 1 cars from localStorage:', error);
        }
      }
      return [];
    };
    
    setCars(loadCars());
  };

  const handleCarAdded = (carId: string) => {
    // Refresh cars list after car is added
    setTimeout(() => {
      const loadCars = () => {
        const savedCars = localStorage.getItem('showroomFloor1Cars');
        if (savedCars) {
          try {
            const parsedCars = JSON.parse(savedCars);
            // Add default category for cars that don't have it
            return parsedCars.map((car: any) => ({
              ...car,
              category: car.category || 'EV' // Default to EV if no category exists
            }));
          } catch (error) {
            console.error('Error parsing showroom floor 1 cars from localStorage:', error);
          }
        }
        return [];
      };
      
      setCars(loadCars());
    }, 500);
  };

  const handleManualAdd = () => {
    if (!newCar.vinNumber || !newCar.model || !newCar.color) {
      toast({
        title: "Missing Information",
        description: "Please fill in VIN, model, and color",
        variant: "destructive"
      });
      return;
    }

    const existingCar = cars.find(c => c.vinNumber === newCar.vinNumber);
    if (existingCar) {
      toast({
        title: "VIN Already Exists",
        description: "A car with this VIN is already in Floor 1",
        variant: "destructive"
      });
      return;
    }

    // Check if all fields are filled to auto-complete PDI
    const allFieldsFilled = newCar.vinNumber && 
                           newCar.model && 
                           newCar.color && 
                           newCar.price > 0 &&
                           newCar.batteryPercentage > 0 &&
                           newCar.range > 0;

    const manualCar = {
      id: `floor1-manual-${Date.now()}`,
      ...newCar,
      status: 'in_stock',
      features: [],
      arrivalDate: new Date().toISOString(),
      // Auto-set PDI based on form completion
      pdiCompleted: allFieldsFilled,
      pdiStatus: allFieldsFilled ? 'completed' : 'pending',
      pdiDate: allFieldsFilled ? new Date().toISOString() : undefined,
      pdiTechnician: allFieldsFilled ? 'System Auto-Complete' : undefined,
      pdiNotes: allFieldsFilled ? 'PDI auto-completed - all required fields filled during registration' : undefined
    };

    const updatedCars = [...cars, manualCar];
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);
    setShowManualAddDialog(false);

    // Reset form
    setNewCar({
      vinNumber: '',
      model: 'Voyah Dream',
      brand: 'Voyah',
      year: new Date().getFullYear(),
      color: '',
      price: 0,
      batteryPercentage: 100,
      range: 0,
      status: 'available',
      customs: 'not paid',
      pdiStatus: 'pending',
      category: 'EV',
      
      // Technical Specifications (for car details view)
      horsePower: 0,
      torque: 0,
      acceleration: '',
      topSpeed: 0,
      chargingTime: '',
      warranty: '',
      
      location: 'Showroom Floor 1'
    });
    setAddCarStep(0);

    toast({
      title: "Car Added",
      description: `${newCar.model} added to Floor 1${allFieldsFilled ? ' - PDI auto-completed' : ' - PDI pending'}`
    });
  };

  const handleScheduleTestDrive = (carId: string, testDriveInfo: any) => {
    const car = cars.find(c => c.id === carId);
    if (!car) return;
    
    setSelectedCar(car);
    setShowTestDriveSelectionDialog(true);
  };

  const handleTestDriveTypeSelection = (isClientTestDrive: boolean) => {
    setSelectedTestDriveType(isClientTestDrive);
    setShowTestDriveSelectionDialog(false);
    setShowTestDriveDialog(true);
  };

  const handleActualTestDriveSchedule = (carId: string, testDriveInfo: any) => {
    const updatedCars = cars.map(car => 
      car.id === carId 
        ? { 
            ...car, 
            testDriveInfo: {
              ...testDriveInfo,
              isOnTestDrive: true
            },
            testDriveHistory: [...(car.testDriveHistory || []), testDriveInfo]
          }
        : car
    );
    
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);

    toast({
      title: "Test Drive Scheduled",
      description: `${testDriveInfo.isClientTestDrive ? 'Client' : 'Employee'} test drive scheduled for ${testDriveInfo.testDriverName}`
    });
    
    setShowTestDriveDialog(false);
    setSelectedCar(null);
  };

  const handleTestDriveEnd = (carId: string) => {
    console.log(`Ending test drive for car ${carId}`);
    
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
    
    const updatedCars = cars.map(c => 
      c.id === carId ? updatedCar : c
    );
    
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);

    const durationText = testDriveService.formatDuration(completedTestDrive.actualDuration || 0);
    
    toast({
      title: "Test Drive Completed",
      description: `Test drive completed in ${durationText}. Added to vehicle history.`,
    });
  };

  const handleShowClientInfo = (car: any) => {
    setSelectedCarForStatus(car);
    setShowStatusDialog(true);
  };

  const handleStatusUpdate = (carId: string, status: 'in_stock' | 'sold' | 'reserved', clientInfo?: any) => {
    const updatedCars = cars.map(car => {
      if (car.id === carId) {
        return {
          ...car,
          status,
          ...(clientInfo || {}),
          lastUpdated: new Date().toISOString()
        };
      }
      return car;
    });
    
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);
    
    toast({
      title: "Car Status Updated",
      description: `${cars.find(c => c.id === carId)?.model} status updated to ${status.replace('_', ' ')}`
    });
  };

  const handleClientInfoSave = (clientInfo: any) => {
    if (!selectedCarForClientInfo) return;
    
    const updatedCars = cars.map(car => 
      car.id === selectedCarForClientInfo.id 
        ? { 
            ...car, 
            ...clientInfo,
            lastUpdated: new Date().toISOString(),
            status: car.status === 'in_stock' ? 'reserved' : car.status
          }
        : car
    );
    
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);
    
    toast({
      title: "Client Information Updated",
      description: `Customer details updated for ${selectedCarForClientInfo.model}`,
    });
  };

  const handleViewDetails = (car: any) => {
    setSelectedCarForDetails(car);
    setShowEnhancedDetailsDialog(true);
  };

  const handleRemoveCar = (carId: string) => {
    const updatedCars = cars.filter(car => car.id !== carId);
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);
    toast({
      title: "Car Removed",
      description: "Car removed from Floor 1"
    });
  };

  const handleEditCar = (carId: string, updates: any) => {
    const updatedCars = cars.map(car => 
      car.id === carId ? { ...car, ...updates } : car
    );
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);
    toast({
      title: "Car Updated",
      description: "Car information has been updated"
    });
  };

  const handleMoveCar = (destination: string, notes?: string) => {
    if (!selectedCar) return;

    toast({
      title: "Car Moved",
      description: `${selectedCar.model} has been moved to ${destination}`
    });

    // Remove car from current showroom
    const updatedCars = cars.filter(car => car.id !== selectedCar.id);
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);
    setShowMoveDialog(false);
    setSelectedCar(null);
  };

  const handleViewPdi = (car: any) => {
    setSelectedCar(car);
    setShowPdiDialog(true);
  };

  const handlePdiComplete = (carId: string, pdiData: { technician: string, notes: string, photos: string[] }) => {
    const updatedCars = cars.map(car => 
      car.id === carId 
        ? { 
            ...car, 
            pdiCompleted: true,
            pdiTechnician: pdiData.technician,
            pdiNotes: pdiData.notes,
            pdiPhotos: pdiData.photos,
            pdiDate: new Date().toISOString()
          }
        : car
    );
    
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);

    toast({
      title: "PDI Completed",
      description: "Pre-Delivery Inspection has been completed successfully.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
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

  const getPdiStatusVariant = (completed?: boolean) => {
    return completed ? 'success' : 'warning';
  };

  // Enhanced PDI Click Handler
  const handlePdiClick = (car: any) => {
    const isReservedOrSold = car.status === 'reserved' || car.status === 'sold';
    const hasDeliveryDate = car.deliveryDate;
    const isUrgent = isReservedOrSold && hasDeliveryDate && !car.pdiCompleted;
    
    if (isUrgent || !car.pdiCompleted) {
      setSelectedCar(car);
      setShowFullPdiDialog(true);
    } else {
      handleViewPdi(car); // View completed PDI
    }
  };

  // Delivery Date Handlers
  const handleOpenDeliveryDateDialog = (car: any) => {
    if (car.status === 'reserved' || car.status === 'sold') {
      setCarForDeliveryDate(car);
      setShowDeliveryDateDialog(true);
    }
  };

  const handleSaveDeliveryDate = (carId: string, deliveryData: { deliveryDate: string; deliveryNotes: string }) => {
    const updatedCars = cars.map(car => 
      car.id === carId 
        ? { 
            ...car, 
            deliveryDate: deliveryData.deliveryDate,
            deliveryNotes: deliveryData.deliveryNotes,
            lastUpdated: new Date().toISOString()
          }
        : car
    );
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);
    
    setShowDeliveryDateDialog(false);
    setCarForDeliveryDate(null);
  };

  const handleCarUpdate = (carId: string, updates: any) => {
    const updatedCars = cars.map(car => 
      car.id === carId ? { ...car, ...updates, lastUpdated: new Date().toISOString() } : car
    );
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);
    
    toast({
      title: "Car Updated",
      description: "Car information has been updated successfully"
    });
  };

  const handleOpenSoftwareDialog = (car: any) => {
    setSelectedCarForSoftware(car);
    setShowSoftwareDialog(true);
  };

  const handleSoftwareUpdate = (carId: string, softwareData: any) => {
    const updatedCars = cars.map(car => 
      car.id === carId ? { 
        ...car, 
        ...softwareData,
        lastUpdated: new Date().toISOString()
      } : car
    );
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);
    
    toast({
      title: "Software Updated",
      description: "Car software information has been updated"
    });
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Car className="h-8 w-8 text-monza-grey" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Showroom Floor 1</h1>
            <p className="text-muted-foreground mt-1">Main showroom display area</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => setShowVinScanner(true)}
            variant="outline"
            className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
            size="sm"
          >
            <QrCode className="h-4 w-4" />
            VIN Scanner
          </Button>
          <Button
            onClick={() => setShowManualAddDialog(true)}
            variant="default"
            className="flex items-center gap-2 bg-monza-yellow text-monza-black hover:bg-monza-yellow/90"
            size="sm"
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
            <CardTitle>
              Cars on Display ({filteredCars.length} {searchQuery ? `of ${cars.length}` : ''})
            </CardTitle>
            <TableSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search VINs, models, clients, colors..."
              className="w-full sm:w-auto"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VIN</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Battery</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Test Drive</TableHead>
                  <TableHead>PDI</TableHead>
                  <TableHead>Customs</TableHead>
                  <TableHead>Software Model</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell className="font-mono text-sm">{car.vinNumber}</TableCell>
                    <TableCell className="font-medium">{car.model}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(car.category)}>
                        {car.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{car.year}</TableCell>
                    <TableCell>{car.color}</TableCell>
                    <TableCell>${car.price.toLocaleString()}</TableCell>
                    <TableCell>
                      {car.status === 'sold' || car.status === 'reserved' ? (
                        <Badge 
                          className={`${getStatusColor(car.status)} cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShowClientInfo(car);
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
                            handleShowClientInfo(car);
                          }}
                          title="Click to add client information"
                        >
                          {getStatusDisplayName(car.status)}
                        </Badge>
                      )}
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
                      {car.testDriveInfo?.isOnTestDrive ? (
                        <TestDriveStatus 
                          testDriveInfo={car.testDriveInfo} 
                          onEndTestDrive={() => handleTestDriveEnd(car.id)}
                        />
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
                        onClick={() => handleViewPdi(car)}
                      >
                                        <StatusBadge variant={getPdiStatusVariant(car.pdiCompleted)}>
                  {car.pdiCompleted ? (
                    <><span className="mr-1 text-lg">☺</span> Complete</>
                  ) : (
                    <><span className="mr-1 text-lg">☹</span> Pending</>
                  )}
                </StatusBadge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={car.customs === 'paid' ? 'default' : 'destructive'}
                        className="cursor-pointer hover:opacity-80 transition-opacity active:scale-95"
                        onClick={() => handleViewDetails(car)}
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
                        onClick={() => handleOpenSoftwareDialog(car)}
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

      {/* Simplified Manual Add Dialog */}
      <Dialog open={showManualAddDialog} onOpenChange={setShowManualAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Add Car to Showroom Floor 1
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
                <select
                  id="category"
                  value={newCar.category}
                  onChange={(e) => setNewCar(prev => ({ ...prev, category: e.target.value as 'EV' | 'REV' | 'ICEV' }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="EV">EV (Electric Vehicle)</option>
                  <option value="REV">REV (Range Extended Vehicle)</option>
                  <option value="ICEV">ICEV (Internal Combustion Engine)</option>
                </select>
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

            <div className="grid grid-cols-1 gap-4">
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

            {/* Technical Specs - Hidden fields for car details */}
            <details className="border rounded-lg p-4">
              <summary className="font-medium cursor-pointer">Technical Specifications (Optional)</summary>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="horsePower">Horse Power</Label>
                  <Input
                    id="horsePower"
                    type="number"
                    min="0"
                    value={newCar.horsePower}
                    onChange={(e) => setNewCar(prev => ({ ...prev, horsePower: parseInt(e.target.value) }))}
                    placeholder="e.g., 350"
                  />
                </div>
                <div>
                  <Label htmlFor="torque">Torque (Nm)</Label>
                  <Input
                    id="torque"
                    type="number"
                    min="0"
                    value={newCar.torque}
                    onChange={(e) => setNewCar(prev => ({ ...prev, torque: parseInt(e.target.value) }))}
                    placeholder="e.g., 500"
                  />
                </div>
                <div>
                  <Label htmlFor="acceleration">0-100 km/h (seconds)</Label>
                  <Input
                    id="acceleration"
                    value={newCar.acceleration}
                    onChange={(e) => setNewCar(prev => ({ ...prev, acceleration: e.target.value }))}
                    placeholder="e.g., 4.5"
                  />
                </div>
                <div>
                  <Label htmlFor="topSpeed">Top Speed (km/h)</Label>
                  <Input
                    id="topSpeed"
                    type="number"
                    min="0"
                    value={newCar.topSpeed}
                    onChange={(e) => setNewCar(prev => ({ ...prev, topSpeed: parseInt(e.target.value) }))}
                    placeholder="e.g., 250"
                  />
                </div>
                <div>
                  <Label htmlFor="chargingTime">Charging Time (10-80%)</Label>
                  <Input
                    id="chargingTime"
                    value={newCar.chargingTime}
                    onChange={(e) => setNewCar(prev => ({ ...prev, chargingTime: e.target.value }))}
                    placeholder="e.g., 30 minutes"
                  />
                </div>
                <div>
                  <Label htmlFor="warranty">Warranty</Label>
                  <Input
                    id="warranty"
                    value={newCar.warranty}
                    onChange={(e) => setNewCar(prev => ({ ...prev, warranty: e.target.value }))}
                    placeholder="e.g., 4 years / 80,000 km"
                  />
                </div>
              </div>
            </details>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowManualAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleManualAdd} 
              className="bg-monza-yellow hover:bg-monza-yellow/90 text-black"
            >
              Add Car to Showroom
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIN Scanner Dialog */}
      {showVinScanner && (
        <VinScannerDialog
          isOpen={showVinScanner}
          onClose={() => setShowVinScanner(false)}
          onVinScanned={handleVinScanned}
          targetLocation="Showroom Floor 1"
          onCarMoved={(carId, fromLocation, toLocation) => {
            toast({
              title: "Car Moved",
              description: `Car moved from ${fromLocation} to ${toLocation}`,
            });
            // Refresh cars list after move
            const loadCars = () => {
              const savedCars = localStorage.getItem('showroomFloor1Cars');
              if (savedCars) {
                try {
                  const parsedCars = JSON.parse(savedCars);
                  return parsedCars.map((car: any) => ({
                    ...car,
                    category: car.category || 'EV'
                  }));
                } catch (error) {
                  console.error('Error parsing cars:', error);
                }
              }
              return [];
            };
            setCars(loadCars());
          }}
          onCarAdded={handleCarAdded}
        />
      )}

      {/* Test Drive Selection Dialog */}
      {showTestDriveSelectionDialog && selectedCar && (
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
      <TestDriveDialog
        isOpen={showTestDriveDialog}
        onClose={() => {
          setShowTestDriveDialog(false);
          setSelectedCar(null);
        }}
        car={selectedCar}
        onScheduleTestDrive={handleActualTestDriveSchedule}
        isClientTestDrive={selectedTestDriveType}
      />

      {/* Move Car Dialog */}
      <MoveCarDialog
        isOpen={showMoveDialog}
        onClose={() => setShowMoveDialog(false)}
        car={selectedCar}
        onMoveCar={handleMoveCar}
      />

      {/* Edit Car Dialog */}
      <EditCarDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        car={selectedCar}
        onSave={handleEditCar}
      />

      {/* PDI View Dialog */}
      <PdiViewDialog
        isOpen={showPdiDialog}
        onClose={() => setShowPdiDialog(false)}
        car={selectedCar}
        onPdiComplete={handlePdiComplete}
      />

      {/* Client Information Dialog */}
      {showClientInfoDialog && selectedCarForClientInfo && (
        <ClientInfoDialog
          car={selectedCarForClientInfo}
          isOpen={showClientInfoDialog}
          onClose={() => {
            setShowClientInfoDialog(false);
            setSelectedCarForClientInfo(null);
          }}
          onSave={handleClientInfoSave}
        />
      )}

      {/* Car Status Selection Dialog */}
      {showStatusDialog && selectedCarForStatus && (
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

      {/* Enhanced Car Details Dialog */}
      <EnhancedCarDetailDialog
        isOpen={showEnhancedDetailsDialog}
        onClose={() => {
          setShowEnhancedDetailsDialog(false);
          setSelectedCarForDetails(null);
        }}
        car={selectedCarForDetails}
        onCarUpdate={handleCarUpdate}
      />

      {/* IT Software Update Dialog */}
      <ITSoftwareUpdateDialog
        isOpen={showSoftwareDialog}
        onClose={() => {
          setShowSoftwareDialog(false);
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

export default ShowroomFloor1Page;
