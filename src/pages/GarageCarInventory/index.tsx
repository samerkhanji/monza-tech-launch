import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow, StatusBadge } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Download, Upload, Plus, Search, Camera, Car as CarIcon, MapPin, Calendar, User, FileText, Edit, BarChart3, Settings, CheckCircle, Clock, Battery, Fuel, X } from 'lucide-react';
import { Car } from '@/types';
import { carService } from '@/services/carService';
import VINScannerDialog from './components/VINScannerDialog';
import MoveCarDialog from './components/MoveCarDialog';
import PdiViewDialog from './components/PdiViewDialog';
import EditGarageCarDialog from './components/EditGarageCarDialog';
import PartsManagementDialog from './components/PartsManagementDialog';
import PartsAnalyticsSidebar from './components/PartsAnalyticsSidebar';
import ClientInfoDialog from './components/ClientInfoDialog';
import TestDriveDialog from '@/pages/CarInventory/components/TestDriveDialog';
import TestDriveSelectionDialog from '@/components/TestDriveSelectionDialog';
import { CarStatusSelectionDialog } from '@/components/CarStatusSelectionDialog';
import TestDriveStatus from '@/pages/CarInventory/components/TestDriveStatus';
import { EnhancedCarDetailDialog } from '@/components/EnhancedCarDetailDialog';
import { kilometersService } from '@/services/kilometersService';

interface GarageCar extends Omit<Car, 'status'> {
  garageLocation?: string;
  garageEntryDate?: string;
  garageNotes?: string;
  garageStatus?: 'stored' | 'in_repair' | 'ready_for_pickup' | 'awaiting_parts';
  status: 'in_stock' | 'sold' | 'reserved';
  category: 'EV' | 'REV' | 'ICEV';
  range?: number; // Vehicle's range capacity (e.g., 300 km)
  kilometersDriven?: number; // Actual kilometers driven for depreciation
  // Additional fields for comprehensive data
  manufacturingDate?: string;
  rangeExtenderNumber?: string;
  highVoltageBatteryNumber?: string;
  frontMotorNumber?: string;
  rearMotorNumber?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  reservedDate?: string;
  soldDate?: string;
  shipmentCode?: string;
  licensePlate?: string;
  // Test drive functionality
  testDriveInfo?: any;
  testDriveHistory?: any[];
  // Additional client information
  clientAddress?: string;
  clientLicensePlate?: string;
  lastUpdated?: string;
}

const GarageCarInventoryPage: React.FC = () => {
  const [garageCars, setGarageCars] = useState<GarageCar[]>([
    // Mock data for testing PDI functionality
    {
      id: 'garage-001',
      vinNumber: 'VF1GAR1A2B3C45678',
      model: 'Voyah Free',
      year: 2024,
      color: 'Pearl White',
      brand: 'Voyah',
      category: 'REV',
      status: 'in_stock',
      arrivalDate: '2024-12-12T08:30:00Z',
      batteryPercentage: 45,
      sellingPrice: 75000,
      customs: 'paid',
      shipmentCode: 'VF-2024-1212-001',
      garageEntryDate: '2024-12-18T10:00:00Z',
      garageLocation: 'Bay 1',
      garageStatus: 'stored',
      garageNotes: 'Regular storage, awaiting PDI completion',
      pdiCompleted: false,
      notes: 'Moved to garage from inventory - awaiting full inspection',
      manufacturingDate: '2024-10-15',
      rangeExtenderNumber: 'RE-2024-VOY-5678',
      highVoltageBatteryNumber: 'HVB-2024-5678',
      frontMotorNumber: 'FM-2024-VOY-5678',
      rearMotorNumber: 'RM-2024-VOY-5678'
    },
    {
      id: 'garage-002',
      vinNumber: 'VF1GAR2D4E5F67890',
      model: 'Voyah Dream',
      year: 2024,
      color: 'Midnight Blue',
      brand: 'Voyah',
      category: 'EV',
      status: 'in_stock',
      arrivalDate: '2024-12-08T14:20:00Z',
      batteryPercentage: 32,
      sellingPrice: 85000,
      customs: 'paid',
      shipmentCode: 'VD-2024-1208-002',
      garageEntryDate: '2024-12-15T09:30:00Z',
      garageLocation: 'Bay 3',
      garageStatus: 'in_repair',
      garageNotes: 'Minor software update required before delivery',
      pdiCompleted: true,
      pdiDate: '2024-12-16T11:15:00Z',
      pdiTechnician: 'Tech-GAR-001',
      pdiNotes: 'PDI completed with minor software issues addressed',
      notes: 'Software update in progress, expected completion today',
      manufacturingDate: '2024-09-22',
      rangeExtenderNumber: 'RE-2024-VOY-7890',
      highVoltageBatteryNumber: 'HVB-2024-7890',
      frontMotorNumber: 'FM-2024-VOY-7890',
      rearMotorNumber: 'RM-2024-VOY-7890'
    },
    {
      id: 'garage-003',
      vinNumber: 'TES1GAR3F6G7H89012',
      model: 'Tesla Model S',
      year: 2024,
      color: 'Deep Blue Metallic',
      brand: 'Tesla',
      category: 'EV',
      status: 'in_stock',
      arrivalDate: '2024-12-10T11:45:00Z',
      batteryPercentage: 78,
      sellingPrice: 105000,
      customs: 'paid',
      shipmentCode: 'TS-2024-1210-003',
      garageEntryDate: '2024-12-16T13:20:00Z',
      garageLocation: 'Bay 5',
      garageStatus: 'in_repair',
      garageNotes: 'Autopilot calibration and system diagnostics',
      pdiCompleted: false,
      notes: 'Tesla-specific diagnostics and calibration in progress',
      manufacturingDate: '2024-11-05',
      rangeExtenderNumber: 'N/A',
      highVoltageBatteryNumber: 'HVB-2024-TES-8901',
      frontMotorNumber: 'FM-2024-TES-8901',
      rearMotorNumber: 'RM-2024-TES-8901'
    },
    {
      id: 'garage-004',
      vinNumber: 'BYD1GAR4H8I9J01234',
      model: 'BYD Tang EV',
      year: 2024,
      color: 'Crystal White',
      brand: 'BYD',
      category: 'EV',
      status: 'in_stock',
      arrivalDate: '2024-12-05T09:15:00Z',
      batteryPercentage: 65,
      sellingPrice: 48000,
      customs: 'paid',
      shipmentCode: 'BYD-2024-1205-004',
      garageEntryDate: '2024-12-12T10:45:00Z',
      garageLocation: 'Bay 2',
      garageStatus: 'stored',
      garageNotes: 'Awaiting final PDI inspection',
      pdiCompleted: false,
      notes: 'All-wheel drive system needs final testing',
      manufacturingDate: '2024-10-28',
      rangeExtenderNumber: 'N/A',
      highVoltageBatteryNumber: 'HVB-2024-BYD-0123',
      frontMotorNumber: 'FM-2024-BYD-0123',
      rearMotorNumber: 'RM-2024-BYD-0123'
    },
    {
      id: 'garage-005',
      vinNumber: 'MBZ1GAR5I0J1K23456',
      model: 'Mercedes-Benz EQS',
      year: 2024,
      color: 'Obsidian Black',
      brand: 'Mercedes-Benz',
      category: 'EV',
      status: 'in_stock',
      arrivalDate: '2024-12-03T16:30:00Z',
      batteryPercentage: 82,
      sellingPrice: 125000,
      customs: 'paid',
      shipmentCode: 'MBZ-2024-1203-005',
      garageEntryDate: '2024-12-10T14:15:00Z',
      garageLocation: 'Bay 4',
      garageStatus: 'in_repair',
      garageNotes: 'MBUX system configuration and luxury features setup',
      pdiCompleted: true,
      pdiDate: '2024-12-11T15:30:00Z',
      pdiTechnician: 'Tech-GAR-002',
      pdiNotes: 'MBUX system configured, all luxury features verified',
      notes: 'Final luxury package installation in progress',
      manufacturingDate: '2024-11-15',
      rangeExtenderNumber: 'N/A',
      highVoltageBatteryNumber: 'HVB-2024-MBZ-2345',
      frontMotorNumber: 'FM-2024-MBZ-2345',
      rearMotorNumber: 'RM-2024-MBZ-2345'
    },
    {
      id: 'garage-006',
      vinNumber: 'BMW1GAR6J2K3L34567',
      model: 'BMW iX',
      year: 2024,
      color: 'Alpine White',
      brand: 'BMW',
      category: 'EV',
      status: 'in_stock',
      arrivalDate: '2024-12-01T12:00:00Z',
      batteryPercentage: 91,
      sellingPrice: 110000,
      customs: 'paid',
      shipmentCode: 'BMW-2024-1201-006',
      garageEntryDate: '2024-12-08T11:00:00Z',
      garageLocation: 'Bay 6',
      garageStatus: 'ready_for_pickup',
      garageNotes: 'Ready for delivery, all systems verified',
      pdiCompleted: true,
      pdiDate: '2024-12-09T10:45:00Z',
      pdiTechnician: 'Tech-GAR-003',
      pdiNotes: 'iDrive 8 system updated, driving assistance verified',
      notes: 'Vehicle ready for customer pickup',
      manufacturingDate: '2024-11-20',
      rangeExtenderNumber: 'N/A',
      highVoltageBatteryNumber: 'HVB-2024-BMW-3456',
      frontMotorNumber: 'FM-2024-BMW-3456',
      rearMotorNumber: 'RM-2024-BMW-3456'
    },
    {
      id: 'garage-007',
      vinNumber: 'PSC1GAR7K4L5M45678',
      model: 'Porsche Taycan',
      year: 2024,
      color: 'Frozen Blue Metallic',
      brand: 'Porsche',
      category: 'EV',
      status: 'in_stock',
      arrivalDate: '2024-11-28T15:45:00Z',
      batteryPercentage: 88,
      sellingPrice: 140000,
      customs: 'paid',
      shipmentCode: 'PSC-2024-1128-007',
      garageEntryDate: '2024-12-05T13:30:00Z',
      garageLocation: 'Bay 7',
      garageStatus: 'in_repair',
      garageNotes: 'Performance systems calibration and testing',
      pdiCompleted: false,
      notes: 'Turbo S variant - performance systems calibration in progress',
      manufacturingDate: '2024-11-10',
      rangeExtenderNumber: 'N/A',
      highVoltageBatteryNumber: 'HVB-2024-PSC-4567',
      frontMotorNumber: 'FM-2024-PSC-4567',
      rearMotorNumber: 'RM-2024-PSC-4567'
    },
    {
      id: 'garage-008',
      vinNumber: 'AUD1GAR8L6M7N56789',
      model: 'Audi e-tron GT',
      year: 2024,
      color: 'Daytona Grey',
      brand: 'Audi',
      category: 'EV',
      status: 'in_stock',
      arrivalDate: '2024-12-07T10:20:00Z',
      batteryPercentage: 75,
      sellingPrice: 115000,
      customs: 'not paid',
      shipmentCode: 'AUD-2024-1207-008',
      garageEntryDate: '2024-12-14T09:00:00Z',
      garageLocation: 'Bay 8',
      garageStatus: 'stored',
      garageNotes: 'Awaiting customs clearance and PDI',
      pdiCompleted: false,
      notes: 'RS e-tron GT variant - awaiting customs clearance',
      manufacturingDate: '2024-11-25',
      rangeExtenderNumber: 'N/A',
      highVoltageBatteryNumber: 'HVB-2024-AUD-5678',
      frontMotorNumber: 'FM-2024-AUD-5678',
      rearMotorNumber: 'RM-2024-AUD-5678'
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVINScannerOpen, setIsVINScannerOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<GarageCar | null>(null);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isPdiDialogOpen, setIsPdiDialogOpen] = useState(false);
  const [carForPdi, setCarForPdi] = useState<GarageCar | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [carForEdit, setCarForEdit] = useState<GarageCar | null>(null);
  const [loading, setLoading] = useState(true);

  // New state for parts management
  const [carForPartsManagement, setCarForPartsManagement] = useState<GarageCar | null>(null);
  const [isPartsManagementOpen, setIsPartsManagementOpen] = useState(false);
  const [isAnalyticsSidebarOpen, setIsAnalyticsSidebarOpen] = useState(false);

  // State for client info dialog
  const [carForClientInfo, setCarForClientInfo] = useState<GarageCar | null>(null);
  const [isClientInfoDialogOpen, setIsClientInfoDialogOpen] = useState(false);
  const [showTestDriveSelectionDialog, setShowTestDriveSelectionDialog] = useState(false);
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [selectedTestDriveType, setSelectedTestDriveType] = useState<boolean>(true);
  const [selectedCarForTestDrive, setSelectedCarForTestDrive] = useState<GarageCar | null>(null);
  
  // Status Dialog State
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedCarForStatus, setSelectedCarForStatus] = useState<GarageCar | null>(null);

  useEffect(() => {
    loadGarageCars();
  }, []);

  // Handle URL parameters for VIN filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const vinParam = urlParams.get('vin');
    
    if (vinParam) {
      // Auto-scroll to the car row or show notification
      setTimeout(() => {
        const matchingCar = garageCars.find(car => 
          car.vinNumber?.toLowerCase().includes(vinParam.toLowerCase())
        );
        if (matchingCar) {
          // Success toast
          toast({
            title: "Car Found in Garage",
            description: `Showing ${matchingCar.brand || 'Vehicle'} ${matchingCar.model} (VIN: ${matchingCar.vinNumber})`,
            duration: 5000,
          });
        } else {
          // Warning toast if not found
          toast({
            title: "Car Not Found",
            description: `No car found with VIN: ${vinParam} in Garage Inventory`,
            variant: "destructive",
            duration: 5000,
          });
        }
      }, 500); // Small delay to ensure cars are loaded
    }
  }, [garageCars]);

  const loadGarageCars = async () => {
    try {
      setLoading(true);
      // Load cars that are currently in garage
      const { data: allCars } = await carService.getAllCars();
      if (allCars && allCars.length > 0) {
        // Filter cars that are in garage (based on notes containing 'garage')
        const garageStoredCars = allCars.filter(car => 
          car.notes?.toLowerCase().includes('garage')
        ).map(car => ({
          ...car,
          category: car.category || 'EV' // Default to EV if no category exists
        }));
        
        // If we have cars from database, use them, otherwise keep the mock data
        if (garageStoredCars.length > 0) {
          setGarageCars(garageStoredCars as GarageCar[]);
        }
        // If no garage cars from database, keep the existing mock data in state
      }
      // If database is empty or fails, keep the mock data that's already in state
    } catch (error) {
      console.error('Error loading garage cars:', error);
      // Don't show error toast for development with mock data
      console.log('Using mock data for garage cars');
    } finally {
      setLoading(false);
    }
  };

  const handleVINScanned = async (vinNumber: string) => {
    try {
      // Search for the car in the main inventory
      const { data: allCars } = await carService.getAllCars();
      if (allCars) {
        const foundCar = allCars.find(car => 
          car.vinNumber?.toLowerCase() === vinNumber.toLowerCase()
        );

        if (foundCar) {
          // Check if car is already in garage
          const isAlreadyInGarage = garageCars.some(car => car.id === foundCar.id);
          
          if (isAlreadyInGarage) {
            toast({
              title: "Car Already in Garage",
              description: `${foundCar.model} (${foundCar.vinNumber}) is already in the garage inventory.`,
              variant: "destructive"
            });
            return;
          }

          // Move car to garage
          await moveCarToGarage(foundCar as Car);
        } else {
          toast({
            title: "Car Not Found",
            description: `No car found with VIN: ${vinNumber}`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error processing scanned VIN:', error);
      toast({
        title: "Error",
        description: "Failed to process scanned VIN.",
        variant: "destructive"
      });
    }
  };

  const moveCarToGarage = async (car: Car) => {
    try {
      // Update car status to indicate it's in garage
      const updates = {
        notes: `${car.notes || ''} - Moved to garage on ${new Date().toLocaleDateString()}`.trim()
      };

      await carService.updateCar(car.id, updates);
      
      // Add to garage cars list
      const validCategory = car.category === 'EV' || car.category === 'REV' || car.category === 'ICEV' 
        ? car.category 
        : 'EV'; // Default to EV for invalid or missing categories
      
      const garageCar: GarageCar = {
        ...car,
        ...updates,
        category: validCategory,
        garageEntryDate: new Date().toISOString(),
        garageStatus: 'stored',
        garageLocation: 'Bay 1', // Default location
        status: car.status // Keep existing status
      };

      setGarageCars(prev => [...prev, garageCar]);

      toast({
        title: "Car Moved to Garage",
        description: `${car.model} (${car.vinNumber}) has been moved to garage inventory.`,
      });
    } catch (error) {
      console.error('Error moving car to garage:', error);
      toast({
        title: "Error",
        description: "Failed to move car to garage.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveFromGarage = async (carId: string) => {
    try {
      const car = garageCars.find(c => c.id === carId);
      if (!car) return;

      // Update car status to remove from garage
      const updates = {
        currentFloor: 'Floor 1', // Default return location
        status: 'in_stock' as const,
        notes: car.notes?.replace(/- Moved to garage on.*/, '').trim() || ''
      };

      await carService.updateCar(carId, updates);
      
      // Remove from garage cars list
      setGarageCars(prev => prev.filter(c => c.id !== carId));

      toast({
        title: "Car Removed from Garage",
        description: `${car.model} has been removed from garage inventory.`,
      });
    } catch (error) {
      console.error('Error removing car from garage:', error);
      toast({
        title: "Error",
        description: "Failed to remove car from garage.",
        variant: "destructive"
      });
    }
  };

  const handleMoveCarLocation = (car: GarageCar) => {
    setSelectedCar(car);
    setIsMoveDialogOpen(true);
  };

  const handleUpdateCarLocation = async (carId: string, destination: string, specificLocation?: string, notes?: string) => {
    try {
      const car = garageCars.find(c => c.id === carId);
      if (!car) return;

      // Handle different destination types
      let updates: Record<string, any> = {
        notes: notes || ''
      };

      // If moving within garage, just update garage location
      if (destination === 'garage') {
        updates = {
          ...updates,
          garageLocation: specificLocation,
          garageNotes: notes
        };

        // Update local state for garage moves
        setGarageCars(prev => prev.map(c => 
          c.id === carId 
            ? { ...c, garageLocation: specificLocation, garageNotes: notes }
            : c
        ));

        toast({
          title: "Location Updated",
          description: `Car moved to ${specificLocation} within garage.`,
        });
      } else {
        // Moving to different area of company - remove from garage inventory
        updates = {
          ...updates,
          currentFloor: getFloorFromDestination(destination),
          inShowroom: isShowroomDestination(destination),
          showroomEntryDate: isShowroomDestination(destination) ? new Date().toISOString() : undefined,
          showroomExitDate: !isShowroomDestination(destination) ? new Date().toISOString() : undefined,
          showroomNote: notes || `Moved from garage to ${destination}`,
          // Clear garage-specific fields
          garageLocation: undefined,
          garageStatus: undefined,
          garageNotes: undefined,
          garageEntryDate: undefined
        };

        // Update car service if available
        await carService.updateCar(carId, updates);
        
        // Remove from garage cars list since it's moved elsewhere
        setGarageCars(prev => prev.filter(c => c.id !== carId));

        const destinationName = getDestinationDisplayName(destination);
        toast({
          title: "Car Moved Successfully",
          description: `${car.model} has been moved from garage to ${destinationName}${specificLocation ? ` (${specificLocation})` : ''}.`,
        });
      }
    } catch (error) {
      console.error('Error updating car location:', error);
      toast({
        title: "Error",
        description: "Failed to update car location.",
        variant: "destructive"
      });
    }
  };

  // Helper function to get floor/location from destination
  const getFloorFromDestination = (destination: string): string | undefined => {
    switch (destination) {
      case 'showroom-floor1':
        return 'Showroom 1';
      case 'showroom-floor2':
        return 'Showroom 2';
      case 'inventory':
        return 'Inventory';
      case 'new-arrivals':
        return 'New Arrivals';
      case 'customer-delivery':
        return 'Delivery';
      case 'external-location':
        return 'External';
      default:
        return undefined;
    }
  };

  // Helper function to check if destination is a showroom
  const isShowroomDestination = (destination: string): boolean => {
    return destination === 'showroom-floor1' || destination === 'showroom-floor2';
  };

  // Helper function to get display name for destination
  const getDestinationDisplayName = (destination: string): string => {
    switch (destination) {
      case 'showroom-floor1':
        return 'Showroom Floor 1';
      case 'showroom-floor2':
        return 'Showroom Floor 2';
      case 'inventory':
        return 'Main Car Inventory';
      case 'new-arrivals':
        return 'New Car Arrivals';
      case 'customer-delivery':
        return 'Customer Delivery Area';
      case 'external-location':
        return 'External Location';
      default:
        return destination;
    }
  };

  // PDI handlers
  const handleOpenPdiDialog = (car: GarageCar) => {
    setCarForPdi(car);
    setIsPdiDialogOpen(true);
  };

  const handlePdiComplete = (carId: string, pdiData: { technician: string, notes: string, photos: string[] }) => {
    // Update car PDI status
    setGarageCars(prev => 
      prev.map(car => 
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
      )
    );

    toast({
      title: "PDI Completed",
      description: "Pre-Delivery Inspection has been completed successfully.",
    });

    setIsPdiDialogOpen(false);
    setCarForPdi(null);
  };

  // Edit car handlers
  const handleEditCar = (car: GarageCar) => {
    setCarForEdit(car);
    setIsEditDialogOpen(true);
  };

  const handleSaveCarEdit = async (carId: string, updates: Record<string, any>) => {
    try {
      // Update local state
      setGarageCars(prev => 
        prev.map(car => 
          car.id === carId 
            ? { ...car, ...updates }
            : car
        )
      );

      // If you have a service to update the car, call it here
      // await carService.updateCar(carId, updates);

      toast({
        title: "Car Updated",
        description: "Car information has been updated successfully.",
      });

      setIsEditDialogOpen(false);
      setCarForEdit(null);
    } catch (error) {
      console.error('Error updating car:', error);
      toast({
        title: "Error",
        description: "Failed to update car information.",
        variant: "destructive"
      });
    }
  };

  // New handlers for parts management
  const handleOpenPartsManagement = (car: GarageCar) => {
    setCarForPartsManagement(car);
    setIsPartsManagementOpen(true);
  };

  const handleClosePartsManagement = () => {
    setIsPartsManagementOpen(false);
    setCarForPartsManagement(null);
  };

  const handleToggleAnalyticsSidebar = () => {
    setIsAnalyticsSidebarOpen(!isAnalyticsSidebarOpen);
  };

  const handleShowClientInfo = (car: GarageCar) => {
    if (car.status === 'sold' || car.status === 'reserved') {
      setCarForClientInfo(car);
      setIsClientInfoDialogOpen(true);
    }
  };

  const handleCloseClientInfo = () => {
    setCarForClientInfo(null);
    setIsClientInfoDialogOpen(false);
  };

  const handleScheduleTestDrive = (car: GarageCar) => {
    setSelectedCarForTestDrive(car);
    setShowTestDriveSelectionDialog(true);
  };

  const handleTestDriveTypeSelection = (isClientTestDrive: boolean) => {
    setSelectedTestDriveType(isClientTestDrive);
    setShowTestDriveSelectionDialog(false);
    setShowTestDriveDialog(true);
  };

  const handleActualTestDriveSchedule = (carId: string, testDriveInfo: any) => {
    const updatedCars = garageCars.map(car => 
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
    
    setGarageCars(updatedCars);
    
    toast({
      title: "Test Drive Scheduled",
      description: `${testDriveInfo.isClientTestDrive ? 'Client' : 'Employee'} test drive scheduled for ${testDriveInfo.testDriverName}`
    });
    
    setShowTestDriveDialog(false);
    setSelectedCarForTestDrive(null);
  };

  const handleTestDriveEnd = (carId: string) => {
    console.log(`Ending test drive for car ${carId}`);
    
    const car = garageCars.find(c => c.id === carId);
    if (!car || !car.testDriveInfo) return;

    const endedTestDrive = {
      ...car.testDriveInfo,
      isOnTestDrive: false,
      testDriveEndTime: new Date().toISOString()
    };

    const updatedCars = garageCars.map(c => 
      c.id === carId 
        ? {
            ...c,
            testDriveInfo: {
              isOnTestDrive: false,
              testDriveStartTime: undefined,
              testDriveEndTime: undefined,
              testDriveDuration: undefined,
              testDriverName: undefined,
              testDriverPhone: undefined,
              testDriverLicense: undefined,
              notes: undefined,
              isClientTestDrive: undefined
            },
            testDriveHistory: c.testDriveHistory?.map(td => 
              td === c.testDriveInfo ? endedTestDrive : td
            ) || [endedTestDrive]
          }
        : c
    );
    
    setGarageCars(updatedCars);
    
    toast({
      title: "Test Drive Ended",
      description: "Test drive has been completed and car is now available.",
    });
  };

  const handleClientInfoSave = (clientInfo: any) => {
    if (!carForClientInfo) return;
    
    const updatedCars = garageCars.map(car => 
      car.id === carForClientInfo.id 
        ? { 
            ...car, 
            ...clientInfo,
            lastUpdated: new Date().toISOString(),
            status: car.status === 'in_stock' ? 'reserved' : car.status
          }
        : car
    );
    
    setGarageCars(updatedCars);
    
    toast({
      title: "Client Information Updated",
      description: `Customer details updated for ${carForClientInfo.model}`,
    });
  };

  const handleStatusClick = (car: GarageCar) => {
    if (car.garageStatus === 'awaiting_parts') {
      handleOpenPartsManagement(car);
    } else {
      // Open proper status dialog for all status changes
      setSelectedCarForStatus(car);
      setShowStatusDialog(true);
    }
  };

  const handleStatusUpdate = (carId: string, status: 'in_stock' | 'sold' | 'reserved', clientInfo?: any) => {
    const updatedCars = garageCars.map(car => 
      car.id === carId 
        ? { 
            ...car, 
            status,
            ...clientInfo,
            lastUpdated: new Date().toISOString()
          }
        : car
    );
    
    setGarageCars(updatedCars);
    
    // Close the status dialog
    setShowStatusDialog(false);
    setSelectedCarForStatus(null);
    
    // Status updated silently
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
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

  const getPdiStatusVariant = (completed?: boolean) => {
    return completed ? 'success' : 'warning';
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

  const filteredCars = garageCars.filter(car =>
    car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.vinNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.garageLocation?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    // Export completed silently
  };

  const handleCustomsClick = (car: GarageCar) => {
    setSelectedCarForCustoms(car);
    setShowCustomsDialog(true);
  };

  const handleCustomsUpdate = (carId: string, updates: any) => {
    const updatedCars = garageCars.map(car => 
      car.id === carId 
        ? { 
            ...car, 
            ...updates,
            lastUpdated: new Date().toISOString()
          }
        : car
    );
    
    setGarageCars(updatedCars);
    
    // Customs updated silently
  };

  const handleViewPdi = (car: GarageCar) => {
    handleOpenPdiDialog(car);
  };

  // Car Details Dialog State
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedCarForDetails, setSelectedCarForDetails] = useState<GarageCar | null>(null);

  // Customs Management Dialog State
  const [showCustomsDialog, setShowCustomsDialog] = useState(false);
  const [selectedCarForCustoms, setSelectedCarForCustoms] = useState<GarageCar | null>(null);

  const handleViewDetails = (car: GarageCar) => {
    setSelectedCarForDetails(car);
    setShowDetailsDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-monza-yellow p-3 rounded-lg">
            <CarIcon className="h-8 w-8 text-monza-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-monza-black tracking-tight">Garage Car Inventory</h1>
            <p className="text-gray-600 mt-1">
              Manage cars stored in the garage facility
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handleToggleAnalyticsSidebar}
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Parts Analytics
          </Button>
          <Button variant="outline" onClick={handleExport} className="border-green-200 text-green-700 hover:bg-green-50">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-monza-black">{garageCars.length}</div>
            <div className="text-sm text-gray-600">Total Cars</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {garageCars.filter(car => car.garageStatus === 'stored').length}
            </div>
            <div className="text-sm text-gray-600">Stored</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {garageCars.filter(car => car.garageStatus === 'in_repair').length}
            </div>
            <div className="text-sm text-gray-600">In Repair</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {garageCars.filter(car => car.garageStatus === 'ready_for_pickup').length}
            </div>
            <div className="text-sm text-gray-600">Ready</div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by model, VIN, color, or location..."
            className="pl-10 border-gray-200 focus:border-monza-yellow focus:ring-monza-yellow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Cars Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CarIcon className="h-5 w-5" />
            Garage Cars ({filteredCars.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableCaption>Complete inventory of all garage vehicles</TableCaption>
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
                {filteredCars.length > 0 ? (
                  filteredCars.map((car) => (
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
                      <TableCell className="font-medium">${((car as any).price || 45000).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge 
                          className={`${getStatusColor(car.status)} cursor-pointer hover:opacity-80 transition-all hover:scale-105 active:scale-95`}
                          onClick={() => handleStatusClick(car)}
                          title="Click to change status"
                        >
                          {car.status === 'in_stock' ? 'Available' : car.status === 'reserved' ? 'Reserved' : 'Sold'}
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
                          {(car as any).range || 400} km
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
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
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
                            onClick={() => handleScheduleTestDrive(car)}
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
                        <div className="flex items-center gap-1 text-xs">
                          {(car as any).softwareVersion ? (
                            <>
                              <Badge variant="outline" className="text-xs">
                                v{(car as any).softwareVersion}
                              </Badge>
                              {(car as any).softwareLastUpdated && (
                                <span className="text-gray-500">
                                  {new Date((car as any).softwareLastUpdated).toLocaleDateString()}
                                </span>
                              )}
                            </>
                          ) : (
                            <Badge variant="secondary" className="text-xs text-yellow-700 bg-yellow-100">
                              Update Needed
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <div className="relative">
                            <select
                              onChange={(e) => {
                                const action = e.target.value;
                                if (action === 'view') handleViewDetails(car);
                                else if (action === 'edit') handleEditCar(car);
                                else if (action === 'move') handleMoveCarLocation(car);
                                e.target.value = '';
                              }}
                              className="w-28 h-9 px-3 border-2 border-gray-300 rounded-lg bg-white cursor-pointer text-sm font-medium hover:bg-gray-50 hover:border-monza-yellow focus:ring-2 focus:ring-monza-yellow focus:border-monza-yellow transition-all duration-200 shadow-sm"
                              style={{ 
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23374151' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 8px center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '20px'
                              }}
                              aria-label={`Actions for ${car.model} ${car.vinNumber}`}
                            >
                              <option value="">Actions</option>
                              <option value="view">View Details</option>
                              <option value="edit">Edit</option>
                              <option value="move">Move</option>
                            </select>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <CarIcon className="h-8 w-8 text-gray-400" />
                        <p className="font-medium text-gray-600">No cars in garage</p>
                        <p className="text-sm text-gray-500">
                          {searchTerm ? 'No results match your search criteria.' : 'Scan VIN codes to add cars to garage inventory.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <VINScannerDialog
        isOpen={isVINScannerOpen}
        onClose={() => setIsVINScannerOpen(false)}
        onVINScanned={handleVINScanned}
      />

      {selectedCar && (
        <MoveCarDialog
          isOpen={isMoveDialogOpen}
          onClose={() => setIsMoveDialogOpen(false)}
          car={selectedCar}
          onUpdateLocation={handleUpdateCarLocation}
        />
      )}

      {carForPdi && (
        <PdiViewDialog
          isOpen={isPdiDialogOpen}
          onClose={() => setIsPdiDialogOpen(false)}
          car={carForPdi}
          onPdiComplete={handlePdiComplete}
        />
      )}

      {carForEdit && (
        <EditGarageCarDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          car={carForEdit}
          onSave={handleSaveCarEdit}
        />
      )}

      {/* Parts Management Dialog */}
      {carForPartsManagement && (
        <PartsManagementDialog
          isOpen={isPartsManagementOpen}
          onClose={handleClosePartsManagement}
          car={carForPartsManagement}
        />
      )}

      {/* Parts Analytics Sidebar */}
      <PartsAnalyticsSidebar
        isOpen={isAnalyticsSidebarOpen}
        onClose={() => setIsAnalyticsSidebarOpen(false)}
      />

      {/* Test Drive Selection Dialog */}
      {showTestDriveSelectionDialog && selectedCarForTestDrive && (
        <TestDriveSelectionDialog
          isOpen={showTestDriveSelectionDialog}
          onClose={() => setShowTestDriveSelectionDialog(false)}
          onSelectTestDriveType={handleTestDriveTypeSelection}
          carModel={selectedCarForTestDrive.model}
        />
      )}

      {/* Test Drive Dialog */}
      {showTestDriveDialog && selectedCarForTestDrive && (
        <TestDriveDialog
          car={selectedCarForTestDrive}
          isOpen={showTestDriveDialog}
          onClose={() => {
            setShowTestDriveDialog(false);
            setSelectedCarForTestDrive(null);
          }}
          onScheduleTestDrive={handleActualTestDriveSchedule}
          isClientTestDrive={selectedTestDriveType}
        />
      )}

      {/* Client Info Dialog */}
      {carForClientInfo && (
        <ClientInfoDialog
          isOpen={isClientInfoDialogOpen}
          onClose={handleCloseClientInfo}
          car={carForClientInfo}
        />
      )}

      {/* Car Status Selection Dialog */}
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

      {/* Customs Management Dialog */}
      {selectedCarForCustoms && (
        <EnhancedCarDetailDialog
          isOpen={showCustomsDialog}
          onClose={() => {
            setShowCustomsDialog(false);
            setSelectedCarForCustoms(null);
          }}
          car={selectedCarForCustoms}
          onCarUpdate={handleCustomsUpdate}
        />
      )}

      {/* Car Details Dialog */}
      {selectedCarForDetails && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CarIcon className="h-5 w-5 text-monza-yellow" />
                Car Details - {selectedCarForDetails.model}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vehicle Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">VIN:</span>
                      <span className="font-mono text-sm">{selectedCarForDetails.vinNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Model:</span>
                      <span>{selectedCarForDetails.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Year:</span>
                      <span>{selectedCarForDetails.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Color:</span>
                      <span>{selectedCarForDetails.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Category:</span>
                      <Badge className={getCategoryColor(selectedCarForDetails.category)}>
                        {selectedCarForDetails.category}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Price:</span>
                      <span className="font-semibold">${((selectedCarForDetails as any).price || 45000).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Technical Specifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Charging Time:</span>
                      <span>
                        {selectedCarForDetails.category === 'EV' || selectedCarForDetails.category === 'REV' ? 
                          ((selectedCarForDetails as any).chargingTime || '30 min') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Range:</span>
                      <span>{(selectedCarForDetails as any).range || 400} km</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status and Battery */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Vehicle Status:</span>
                      <Badge className={getStatusColor(selectedCarForDetails.status)}>
                        {selectedCarForDetails.status === 'in_stock' ? 'Available' : 
                         selectedCarForDetails.status === 'reserved' ? 'Reserved' : 'Sold'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Garage Location:</span>
                      <span>{selectedCarForDetails.garageLocation || 'Bay 1'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Battery Level:</span>
                      <div className="flex items-center gap-2">
                        <Battery className="h-4 w-4" />
                        <span>{selectedCarForDetails.batteryPercentage}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">PDI Status:</span>
                      <Badge className={selectedCarForDetails.pdiCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {selectedCarForDetails.pdiCompleted ? 'Complete' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Customs:</span>
                      <Badge variant={selectedCarForDetails.customs === 'paid' ? 'default' : 'destructive'}>
                        {selectedCarForDetails.customs === 'paid' ? 'Paid' : 'Not Paid'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Client Information (if any) */}
                {(selectedCarForDetails.clientName || selectedCarForDetails.status !== 'in_stock') && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Client Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Client Name:</span>
                        <span>{selectedCarForDetails.clientName || 'Not assigned'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Phone:</span>
                        <span>{selectedCarForDetails.clientPhone || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Email:</span>
                        <span>{selectedCarForDetails.clientEmail || 'Not provided'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">License Plate:</span>
                        <span>{selectedCarForDetails.clientLicensePlate || 'Not provided'}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Notes */}
              {selectedCarForDetails.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedCarForDetails.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowDetailsDialog(false)}
                className="border-monza-yellow text-monza-black hover:bg-monza-yellow/10"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GarageCarInventoryPage; 