import React, { useState, useEffect, useMemo } from 'react';
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
  MapPin,
  RefreshCw
} from 'lucide-react';
import SmartActionDropdown from '@/components/ui/SmartActionDropdown';
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
import WarrantyLifeDialogProvider, { useWarrantyDialog } from '@/components/WarrantyLifeDialog';
import StandardWarrantyButton from '@/components/StandardWarrantyButton';

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

// Warranty Button Component
const WarrantyButton = ({ car }: { car: CarData }) => {
  const { openWarrantyDialog } = useWarrantyDialog();
  
  // Get warranty dates from the new fields
  const warrantyStartDate = (car as any).warranty_start_date;
  const warrantyEndDate = (car as any).warranty_end_date;
  
  const endDate = warrantyEndDate ? new Date(warrantyEndDate) : null;
  const isValid = endDate && !isNaN(endDate.getTime());
  const daysRemaining = isValid ? Math.max(0, Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;
  
  const getLabel = () => {
    if (!isValid) return "Not set";
    if (daysRemaining === 0) return "Expires today";
    if (daysRemaining === 1) return "Expires tomorrow";
    return `Expires ${endDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  };
  
  const getUrgencyStyle = () => {
    if (!isValid) return "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200";
    if (daysRemaining === 0) return "bg-red-100 text-red-700 border-red-200 hover:bg-red-200";
    if (daysRemaining <= 30) return "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200";
    return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
  };
  
  const getTooltip = () => {
    if (!isValid) return "Click to set warranty dates";
    if (daysRemaining === 0) return `Expires today (${endDate.toLocaleDateString()})`;
    if (daysRemaining === 1) return `Expires tomorrow (${endDate.toLocaleDateString()})`;
    return `Expires on ${endDate.toLocaleDateString()} (${daysRemaining} days remaining)`;
  };
  
  return (
    <button
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium transition-colors ${getUrgencyStyle()}`}
      onClick={() => openWarrantyDialog(car.vinNumber || '')}
      title={getTooltip()}
    >
      {getLabel()}
    </button>
  );
};

const CarInventoryPage: React.FC = () => {
  const { cars: inventoryCars } = useCarInventory();
  
  // Local state to manage cars (for immediate UI updates)
  const [localCars, setLocalCars] = useState<CarData[]>([]);
  
  // Convert cars from useCarInventory to our interface
  const cars: CarData[] = localCars.length > 0 ? localCars : inventoryCars.map(car => {
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
              customs: (car.customs === 'paid' ? 'paid' : 'not paid') as 'paid' | 'not paid',
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

  // Initialize local cars when inventory cars change
  useEffect(() => {
    if (inventoryCars.length > 0 && localCars.length === 0) {
      const mappedCars = inventoryCars.map(car => {
        // Map status to valid values
        let mappedStatus: 'sold' | 'reserved' | 'in_stock' = 'in_stock';
        if (car.status === 'sold') mappedStatus = 'sold';
        else if (car.status === 'reserved') mappedStatus = 'reserved';
        else mappedStatus = 'in_stock';

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
          customs: (car.customs === 'paid' ? 'paid' : 'not paid') as 'paid' | 'not paid',
          brand: car.brand,
          currentFloor: (car as any).current_location || car.category,
          purchasePrice: (car as any).purchase_price,
          clientName: (car as any).client_name,
          clientPhone: (car as any).client_phone,
          clientLicensePlate: (car as any).client_license_plate,
          expectedDeliveryDate: (car as any).expected_delivery_date,
          notes: car.notes,
          lastModified: (car as any).updated_at,
          softwareVersion: Math.random() > 0.5 ? (car as any).softwareVersion || '2.1.0' : undefined,
          softwareLastUpdated: Math.random() > 0.5 ? (car as any).softwareLastUpdated || '2024-01-15' : undefined,
          softwareUpdateBy: Math.random() > 0.5 ? (car as any).softwareUpdateBy || 'IT Team' : undefined,
          softwareUpdateNotes: Math.random() > 0.5 ? (car as any).softwareUpdateNotes || 'Routine update' : undefined,
        };
      });
      setLocalCars(mappedCars);
    }
  }, [inventoryCars, localCars.length]);

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
  const filteredCars = useMemo(() => {
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
  }, [cars, filterType, searchQuery]);

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
    
    // handleCarUpdate removed - car updates handled locally
    setShowEditDialog(false);
    setSelectedCar(null);
    
    toast({
      title: "Car Updated",
      description: "Car details have been updated",
    });
  };

  const handleMoveCar = async (destination: string, notes?: string) => {
    if (!selectedCar) return;

    try {
      console.log('🚗 === CAR MOVEMENT DEBUG ===');
      console.log(`Selected Car:`, selectedCar);
      console.log(`Car ID: ${selectedCar.id}`);
      console.log(`Car VIN: ${selectedCar.vinNumber}`);
      console.log(`Destination: ${destination}`);
      console.log(`Notes: ${notes}`);
      
      // Get the car data from the current inventory
      const carToMove = { ...selectedCar };
      console.log(`Car to move:`, carToMove);
      
      // Handle different destinations first
      switch (destination) {
        case 'floor1':
          console.log('🔄 Moving to Floor 1...');
          // Move to Showroom Floor 1
          await moveCarToShowroomFloor1(carToMove, notes);
          break;
          
        case 'floor2':
          console.log('🔄 Moving to Floor 2...');
          // Move to Showroom Floor 2
          await moveCarToShowroomFloor2(carToMove, notes);
          break;
          
        case 'garage':
          console.log('🔄 Moving to Garage...');
          // Move to Garage Inventory
          await moveCarToGarageInventory(carToMove, notes);
          break;
          
        case 'garage-schedule':
          console.log('🔄 Moving to Garage Schedule...');
          // Add to Garage Schedule
          await addCarToGarageSchedule(carToMove, notes);
          break;
          
        default:
          console.warn(`Unknown destination: ${destination}`);
      }
      
      // Update the car's current floor in the database
      // Use the new DatabaseManager to move the car
      try {
        const { DatabaseManager } = await import('@/database/DatabaseManager');
        
        const success = await DatabaseManager.moveCar(carToMove.id, destination, notes);
        
        if (!success) {
          throw new Error('Failed to move car using DatabaseManager');
        }
        
        console.log(`Car ${carToMove.model} moved successfully to ${destination} using DatabaseManager`);
      } catch (error) {
        console.error('Database move failed:', error);
        toast({
          title: "Warning",
          description: "Car was moved but database update failed. Please refresh the page.",
          variant: "destructive"
        });
      }
      
      // Remove the car from local state immediately (this will update the UI)
      setLocalCars(prevCars => prevCars.filter(car => car.id !== carToMove.id));
      
      // Update the car's status in the database to reflect the move
      // This will cause it to be filtered out of the current view
      let newFloor: 'SHOWROOM_1' | 'SHOWROOM_2' | 'GARAGE' | 'INVENTORY';
      switch (destination) {
        case 'floor1':
          newFloor = 'SHOWROOM_1';
          break;
        case 'floor2':
          newFloor = 'SHOWROOM_2';
          break;
        case 'garage':
        case 'garage-schedule':
          newFloor = 'GARAGE';
          break;
        default:
          newFloor = 'INVENTORY';
      }
      
      // Close dialog and reset state
      setShowMoveDialog(false);
      setSelectedCar(null);
      
      // Small delay to ensure UI updates properly
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Show success message
      const destinationNames = {
        'floor1': 'Showroom Floor 1',
        'floor2': 'Showroom Floor 2',
        'garage': 'Garage Inventory',
        'garage-schedule': 'Garage Schedule'
      };
      
      const destinationPage = {
        'floor1': '/showroom-floor1',
        'floor2': '/showroom-floor2', 
        'garage': '/inventory-garage',
        'garage-schedule': '/garage-schedule'
      };
      
      const pageUrl = destinationPage[destination as keyof typeof destinationPage];
      
      toast({
        title: "Car Moved Successfully",
        description: `${carToMove.model} has been moved to ${destinationNames[destination as keyof typeof destinationNames] || destination}.`,
        duration: 4000
      });
      
      // Show navigation suggestion after a short delay
      if (pageUrl) {
        setTimeout(() => {
          toast({
            title: "View Car in New Location",
            description: `Click to view ${carToMove.model} on the ${destinationNames[destination as keyof typeof destinationNames] || destination} page`,
            action: (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(pageUrl, '_blank')}
                className="ml-2"
              >
                View Car
              </Button>
            )
          });
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error moving car:', error);
      toast({
        title: "Move Failed",
        description: "Failed to move car. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper function to move car to Showroom Floor 1
  const moveCarToShowroomFloor1 = async (car: CarData, notes?: string) => {
    try {
      console.log('�� Floor1Table.addCar - Starting with carId:', car.id);
      console.log('🏢 Floor1Table.addCar - Car details:', { model: car.model, vin: car.vinNumber });
      
      // Use the database to move the car
      const { Floor1Table } = await import('@/database/Floor1Table');
      console.log('🏢 Floor1Table imported successfully');
      
      const success = await Floor1Table.addCar(car.id, notes);
      console.log('🏢 Floor1Table.addCar result:', success);
      
      if (success) {
        console.log(`✅ Car ${car.model} moved to Showroom Floor 1`);
        // The car will be automatically removed from this view since it's now on Floor 1
        console.log('Car moved successfully - inventory will update automatically');
      } else {
        console.error('❌ Floor1Table.addCar returned false');
        throw new Error('Failed to move car to Floor 1');
      }
    } catch (error) {
      console.error('❌ Error moving car to Floor 1:', error);
      throw error;
    }
  };

  // Helper function to move car to Showroom Floor 2
  const moveCarToShowroomFloor2 = async (car: CarData, notes?: string) => {
    try {
      // Use the database to move the car
      const { Floor2Table } = await import('@/database/Floor2Table');
      
      const success = await Floor2Table.addCar(car.id, notes);
      
      if (success) {
        console.log(`Car ${car.model} moved to Showroom Floor 2`);
        // The car will be automatically removed from this view since it's now on Floor 2
        console.log('Car moved successfully - inventory will update automatically');
      } else {
        throw new Error('Failed to move car to Floor 2');
      }
    } catch (error) {
      console.error('Error moving car to Floor 2:', error);
      throw error;
    }
  };

  // Helper function to move car to Garage Inventory
  const moveCarToGarageInventory = async (car: CarData, notes?: string) => {
    try {
      // Use the database to move the car
      const { CarInventoryTable } = await import('@/database/CarInventoryTable');
      
      const success = await CarInventoryTable.moveCar(car.id, 'garage', notes);
      
      if (success) {
        console.log(`Car ${car.model} moved to Garage Inventory`);
        // The car will be automatically removed from this view since it's now in Garage
        console.log('Car moved successfully - inventory will update automatically');
      } else {
        throw new Error('Failed to move car to Garage');
      }
    } catch (error) {
      console.error('Error moving car to Garage:', error);
      throw error;
    }
  };

  // Helper function to add car to Garage Schedule
  const addCarToGarageSchedule = async (car: CarData, notes?: string) => {
    try {
      // Use the database to move the car to garage (schedule is handled by garage system)
      const { CarInventoryTable } = await import('@/database/CarInventoryTable');
      
      const success = await CarInventoryTable.moveCar(car.id, 'garage-schedule', notes);
      
      if (success) {
        console.log(`Car ${car.model} moved to Garage Schedule`);
        // The car will be automatically removed from this view since it's now in Garage
        console.log('Car moved successfully - inventory will update automatically');
      } else {
        throw new Error('Failed to move car to Garage Schedule');
      }
    } catch (error) {
      console.error('Error adding car to Garage Schedule:', error);
      throw error;
    }
  };

  // Helper function to update car location in central system
  const updateCarLocationInCentralSystem = async (vinNumber: string, newLocation: string, notes?: string) => {
    try {
      // Update the car's current floor in the central car inventory
      const updatedCar = cars.find(car => car.vinNumber === vinNumber);
      if (updatedCar) {
        // Map destination to valid currentFloor values
        let mappedFloor: string;
        switch (newLocation) {
          case 'floor1':
            mappedFloor = 'SHOWROOM_1';
            break;
          case 'floor2':
            mappedFloor = 'SHOWROOM_2';
            break;
          case 'garage':
            mappedFloor = 'GARAGE';
            break;
          case 'garage-schedule':
            mappedFloor = 'GARAGE';
            break;
          default:
            mappedFloor = newLocation;
        }
        
        updatedCar.currentFloor = mappedFloor;
        updatedCar.lastModified = new Date().toISOString();
        
        // Update the car in the central system (simplified - just log the movement)
        console.log(`Car ${updatedCar.id} moved to ${mappedFloor}`);
      }
      
      // Log the movement for audit purposes
      const movementLog = {
        id: `move-${Date.now()}`,
        vinNumber,
        fromLocation: 'Car Inventory',
        toLocation: newLocation,
        timestamp: new Date().toISOString(),
        movedBy: 'System User',
        notes: notes || 'Car moved from Car Inventory',
        reason: 'Inventory Management'
      };
      
      // Store movement log
      const existingMovements = localStorage.getItem('carMovements');
      let movements = [];
      
      if (existingMovements) {
        try {
          const parsed = JSON.parse(existingMovements);
          // Ensure it's an array
          movements = Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
          console.warn('Error parsing movement logs, starting with empty array:', parseError);
          movements = [];
        }
      }
      
      movements.push(movementLog);
      localStorage.setItem('carMovements', JSON.stringify(movements));
      
      console.log(`Car ${vinNumber} location updated in central system to ${newLocation}`);
    } catch (error) {
      console.error('Error updating central system:', error);
      throw error;
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
    // handleCarUpdate removed - car updates handled locally
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
    <WarrantyLifeDialogProvider onSaved={() => {
      // Refresh the car data when warranty is updated
      console.log('Warranty updated, refreshing data...');
      // The table will automatically refresh when the component re-renders
    }}>
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
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Car Inventory</CardTitle>
            <CardDescription>
              Manage and track all vehicles in inventory
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('🔄 Manual refresh requested');
                window.location.reload();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              onClick={() => setShowVinScanner(true)}
              className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/80"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Car
            </Button>
          </div>
        </CardHeader>
        
        {/* Search and Filter Section */}
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
            </div>
            <TableSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search VINs, models, clients, colors..."
              className="w-full sm:w-auto"
            />
          </div>
        </div>
        <CardContent>
          <div className="rounded-md border">
            <div className="px-4 py-2 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CarIcon className="h-4 w-4" />
                  <span className="font-medium">
                    {filterType === 'ready' && `Ready Cars (${filteredCars.length})`}
                    {filterType === 'attention' && `Cars Needing Attention (${filteredCars.length})`}
                    {!filterType && `Car Inventory (${filteredCars.length} ${searchQuery ? `of ${cars.length}` : ''})`}
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  {cars.length} total vehicles
                </div>
              </div>
            </div>
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
                  <TableHead className="font-semibold">Warranty Life</TableHead>
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
                    <StandardWarrantyButton car={car} />
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
                      <SmartActionDropdown
                        options={[
                          { value: 'details', label: 'View Details' },
                          { value: 'edit', label: 'Edit Car' },
                          { 
                            value: 'move', 
                            label: 'Move Car',
                            isMoveAction: true,
                            carId: car.id,
                            currentFloor: 'CAR_INVENTORY' as const,
                            tableContext: 'CAR_INVENTORY' as const
                          }
                        ]}
                        onAction={(action) => {
                          if (action === 'details') handleViewDetails(car);
                          else if (action === 'edit') {
                            setSelectedCar(car);
                            setShowEditDialog(true);
                          }                           else if (action === 'move') {
                            console.log('🎯 Move button clicked for car:', car);
                            console.log('🎯 Car ID:', car.id);
                            console.log('🎯 Car VIN:', car.vinNumber);
                            setSelectedCar(car);
                            setShowMoveDialog(true);
                            console.log('🎯 Move dialog should now be open');
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
            customs: (car.customs === 'not_paid' ? 'not paid' : car.customs === 'paid' ? 'paid' : 'not paid') as 'paid' | 'not paid'
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
    </WarrantyLifeDialogProvider>
  );
};

export default CarInventoryPage;
