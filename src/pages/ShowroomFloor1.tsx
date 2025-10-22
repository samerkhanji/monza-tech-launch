import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Eye, Plus, Battery, Fuel, Activity, Phone, User, Clock, Edit, MapPin, FileText, MoreVertical, X, CheckCircle, QrCode } from 'lucide-react';
import VinScannerDialog from '@/components/VinScannerDialog';
import { toast } from '@/hooks/use-toast';
// import TestDriveDialog from '@/pages/CarInventory/components/TestDriveDialog';
// import TestDriveSelectionDialog from '@/components/TestDriveSelectionDialog';
// import TestDriveStatus from '@/pages/CarInventory/components/TestDriveStatus';
import MoveCarDialog from '@/pages/ShowroomFloor1/components/MoveCarDialog';
import EditCarDialog from '@/pages/ShowroomFloor1/components/EditCarDialog';
import PdiViewDialog from '@/pages/ShowroomFloor1/components/PdiViewDialog';
import PdiChecklistDialog from '@/pages/ShowroomFloor1/components/PdiChecklistDialog';
import ClientInfoDialog from '@/pages/ShowroomFloor1/components/ClientInfoDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell, StatusBadge } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import SmartActionDropdown from '@/components/ui/SmartActionDropdown';
import { CarStatusSelectionDialog } from '@/components/CarStatusSelectionDialog';
// import { PdiButton } from '@/components/ui/PdiButton';
import DeliveryDateDialog from '@/components/DeliveryDateDialog';

// import EnhancedCarDetailDialog from '@/components/EnhancedCarDetailDialog';
import CustomsManagementDialog from '@/components/CustomsManagementDialog';
// import { testDriveService, TestDriveInfo } from '@/services/testDriveService';
// import ITSoftwareUpdateDialog from '@/components/ITSoftwareUpdateDialog';
import TableSearch from '@/components/ui/table-search';
// import WarrantyInfoColumn from '@/components/WarrantyInfoColumn';
import { safeParseInt } from '@/utils/errorHandling';
import { carService } from '@/services/carService';
import EnhancedWarrantyBadge from '@/components/EnhancedWarrantyBadge';
import WarrantyFormDialog from '@/components/WarrantyFormDialog';
import { useWarrantyEditor } from '@/hooks/useWarrantyEditor';
import StandardWarrantyButton from '@/components/StandardWarrantyButton';
import WarrantyLifeDialogProvider from '@/components/WarrantyLifeDialog';
import MoveCarFormDialog from '@/components/MoveCarFormDialog';

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
  const [showMoveFormDialog, setShowMoveFormDialog] = useState(false);
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
  const [showCustomsDialog, setShowCustomsDialog] = useState(false);
  const [customsCar, setCustomsCar] = useState<any>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Warranty editor hook
  const warrantyEditor = useWarrantyEditor();

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

  const loadCarsFromDatabase = async () => {
    try {
      console.log('Showroom Floor 1: Loading cars using clean architecture...');
      
      const { getCarsByFloor } = await import('@/services/cleanMoveCarService');
      
      const data = await getCarsByFloor('SHOWROOM_1');
      
      if (data && data.length > 0) {
        // Map the data to match our interface
        const mappedCars = data.map((car: any) => ({
          id: car.id,
          vinNumber: car.vin,
          model: car.model,
          year: car.year,
          color: car.color,
          brand: car.brand,
          category: car.vehicle_type || 'EV',
          price: car.selling_price || 0,
          status: car.status || 'in_stock',
          batteryPercentage: car.battery_percentage || 100,
          range: 520, // Default range since field doesn't exist
          features: [],
          arrivalDate: car.delivery_date || car.created_at,
          pdiCompleted: car.pdi_completed || false,
          pdiStatus: car.pdi_completed ? 'completed' : 'pending',
          pdiTechnician: car.pdi_technician,
          pdiDate: car.pdi_date,
          pdiNotes: car.pdi_notes,
          customs: 'not paid', // Default since custom_duty field doesn't exist
          currentFloor: car.current_floor,
          notes: car.notes,
          lastModified: car.updated_at,
          warranty_life: car.warranty_life || null,
          delivery_date: car.delivery_date || null,
          vehicle_expiry_date: car.vehicle_expiry_date || null,
          battery_expiry_date: car.battery_expiry_date || null,
          dms_deadline_date: car.dms_deadline_date || null
        }));
        
        setCars(mappedCars);
        console.log(`Showroom Floor 1: Loaded ${mappedCars.length} cars using clean architecture`);
        console.log('🔍 Sample car data:', mappedCars[0]);
      } else {
        console.log('Showroom Floor 1: No cars found for Floor 1');
        setCars([]);
      }
    } catch (error) {
      console.error('Error loading cars:', error);
      setCars([]);
    }
  };

  useEffect(() => {
    // Load cars when component mounts
    loadCarsFromDatabase();
  }, []); // Empty dependency array - only runs once

  // Real-time updates are now handled by useCarsByFloor hook
  // No need for duplicate subscription here

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

  // Function to save cars to localStorage - DISABLED for stability
  const saveCarsToStorage = (updatedCars: any[]) => {
    // localStorage.setItem('showroomFloor1Cars', JSON.stringify(updatedCars));
    console.log('Cars would be saved to localStorage:', updatedCars.length);
  };

  const handleVinScanned = (vin: string) => {
    console.log('VIN scanned on Floor 1:', vin);
    
    // Refresh the floor data to show the moved car
    loadCarsFromDatabase();
    
    toast({
      title: "VIN Scanned Successfully",
      description: `VIN ${vin} has been processed for Floor 1.`,
    });
  };

    // Handler for Universal VIN Scanner
  const handleUniversalVinScanned = (vinData: any, targetLocation: any) => {
    console.log('VIN scanned:', vinData);
    // Refresh the floor data to show the moved car
    loadCarsFromDatabase();
  };

  const handleCarAdded = (carId: string) => {
    // Don't reload cars - keep table stable
    console.log('Car added:', carId);
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

    // Ensure schedule dialog is closed before opening selection
    setShowTestDriveDialog(false);
    setSelectedCar(car);
    setShowTestDriveSelectionDialog(true);
  };

  const handleTestDriveTypeSelection = (isClientTestDrive: boolean) => {
    setSelectedTestDriveType(isClientTestDrive);
    // Close selection first, then open the schedule dialog on the next frame
    setShowTestDriveSelectionDialog(false);
    requestAnimationFrame(() => {
      setShowTestDriveDialog(true);
    });
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

    // TODO: Re-implement test drive service when available
    // For now, just update the car status locally
    const updatedCars = cars.map(c => 
      c.id === carId 
        ? { 
            ...c, 
            testDriveInfo: { ...c.testDriveInfo, isOnTestDrive: false },
            lastUpdated: new Date().toISOString()
          }
        : c
    );
    
    setCars(updatedCars);
    saveCarsToStorage(updatedCars);

    toast({
      title: "Test Drive Completed",
      description: `Test drive completed successfully. Vehicle is now available.`,
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

    const nowIso = new Date().toISOString();
    const byVinFilter = (arr: any[]) => arr.filter((c: any) => c.vinNumber !== selectedCar.vinNumber);

    const removeFromCurrent = () => {
      const updatedCars = cars.filter(car => car.id !== selectedCar.id);
      setCars(updatedCars);
      saveCarsToStorage(updatedCars);
    };

    if (destination === 'garage-schedule') {
      // Only add to schedule (not inventory) until moved elsewhere
      const existingSchedule = localStorage.getItem('garageSchedule');
      const schedule = existingSchedule ? JSON.parse(existingSchedule) : { scheduledCars: [] };

      const scheduledCar = {
        id: Date.now().toString(),
        vinNumber: selectedCar.vinNumber,
        model: selectedCar.model,
        brand: selectedCar.brand,
        year: selectedCar.year,
        color: selectedCar.color,
        status: 'waiting' as const,
        priority: 'normal' as const,
        estimatedDuration: 120,
        notes: notes || `Moved from Showroom Floor 1`,
        clientName: selectedCar.clientName || '',
        clientPhone: selectedCar.clientPhone || '',
        arrivalTime: nowIso,
        scheduledTime: nowIso
      };

      schedule.scheduledCars = byVinFilter(schedule.scheduledCars || []);
      schedule.scheduledCars.push(scheduledCar);
      localStorage.setItem('garageSchedule', JSON.stringify(schedule));

      toast({ title: 'Car Added to Garage Schedule', description: `${selectedCar.model} added to schedule.` });
      removeFromCurrent();
    } else if (destination === 'garage') {
      const existingGarageCars = JSON.parse(localStorage.getItem('garageCars') || '[]');
      const garageCars = byVinFilter(existingGarageCars);
      garageCars.push({ ...selectedCar, id: `garage-${Date.now()}`, currentFloor: 'Garage', lastModified: nowIso });
      localStorage.setItem('garageCars', JSON.stringify(garageCars));
      toast({ title: 'Car Moved', description: `${selectedCar.model} moved to Garage Inventory.` });
      removeFromCurrent();
    } else if (destination === 'inventory') {
      const inventory = JSON.parse(localStorage.getItem('carInventory') || '[]');
      const updated = byVinFilter(inventory);
      updated.push({ ...selectedCar, id: `inventory-${Date.now()}`, lastModified: nowIso });
      localStorage.setItem('carInventory', JSON.stringify(updated));
      toast({ title: 'Car Moved', description: `${selectedCar.model} moved to Car Inventory.` });
      removeFromCurrent();
    } else if (destination === 'floor2') {
      const floor2 = JSON.parse(localStorage.getItem('showroomFloor2Cars') || '[]');
      const updated = byVinFilter(floor2);
      updated.push({ ...selectedCar, id: `floor2-${Date.now()}`, currentFloor: 'Showroom Floor 2', lastModified: nowIso });
      localStorage.setItem('showroomFloor2Cars', JSON.stringify(updated));
      toast({ title: 'Car Moved', description: `${selectedCar.model} moved to Showroom Floor 2.` });
      removeFromCurrent();
    } else if (destination === 'new-arrivals') {
      toast({ title: 'Not Allowed', description: 'Existing cars cannot be moved to New Arrivals.', variant: 'destructive' });
      setShowMoveDialog(false);
      setSelectedCar(null);
      return;
    } else {
      toast({ title: 'Move Failed', description: 'Unknown destination.', variant: 'destructive' });
    }

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
      case 'in_repair':
        return 'bg-orange-100 text-orange-800';
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
      case 'in_repair':
        return 'In Repair';
      default:
        return status;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (String(category)) {
      case 'EV':
        return 'category-ev';
      case 'REV':
        return 'category-rev';
      case 'ICEV':
        return 'category-icev';
      default:
        return 'category-ev';
    }
  };

  const getPdiStatusVariant = (completed?: boolean) => {
    return completed ? 'success' : 'warning';
  };

  // Enhanced PDI Click Handler
  const handlePdiClick = (car: any) => {
    const isReservedOrSold = car.status === 'reserved' || car.status === 'sold';
    const isInRepair = car.status === 'in_repair';
    const hasDeliveryDate = car.deliveryDate;
    const isUrgent = (isReservedOrSold || isInRepair) && hasDeliveryDate && !car.pdiCompleted;
    
    if (isUrgent || !car.pdiCompleted) {
      setSelectedCar(car);
      setShowFullPdiDialog(true);
    } else {
      handleViewPdi(car); // View completed PDI
    }
  };

  // Delivery Date Handlers
  const handleOpenDeliveryDateDialog = (car: any) => {
    if (car.status === 'reserved' || car.status === 'sold' || car.status === 'in_repair') {
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

  const handleCustomsClick = (car: any) => {
    setCustomsCar(car);
    setShowCustomsDialog(true);
  };

  const handleCustomsUpdate = async (carId: string, customsData: any) => {
    try {
      // Map the customs data to the format expected by carService
      const updateData = {
        customsStatus: customsData.customs_status,
        customsCost: customsData.customs_cost,
        shippingCost: customsData.shipping_cost,
        processedBy: customsData.processed_by,
        paymentDate: customsData.payment_date,
        customsDocRef: customsData.customs_doc_ref,
        customsNotes: customsData.customs_notes,
        shippingStatus: customsData.shipping_status,
        currentFloor: customsData.current_location,
        status: customsData.status,
        conditionOnArrival: customsData.condition_on_arrival,
      };

      // Update in database using carService
      const { data, error } = await carService.updateCar(carId, updateData);
      
      if (error) {
        throw error;
      }

      // Update local state
      const updatedCars = cars.map(car =>
        car.id === carId ? { ...car, ...customsData, lastUpdated: new Date().toISOString() } : car
      );
      setCars(updatedCars);
      
      // Also update localStorage for offline functionality
      localStorage.setItem('showroomFloor1Cars', JSON.stringify(updatedCars));
      
      toast({ 
        title: 'Customs Updated', 
        description: 'Customs information has been updated successfully and saved to database' 
      });
    } catch (error) {
      console.error('Error updating customs:', error);
      toast({ 
        title: 'Update Failed', 
        description: 'Failed to update customs information. Please try again.',
        variant: 'destructive'
      });
    }
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
    <WarrantyLifeDialogProvider onSaved={() => {
      // Refresh car data when warranty is updated
      console.log('Warranty updated, refreshing Floor 1 data...');
    }}>
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
              id="showroom-floor1-search"
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
                  <TableRow key={car.id}>
                    <TableCell className="font-mono text-sm">{car.vinNumber}</TableCell>
                    <TableCell className="font-medium">{car.model}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(car.category)}>
                        {car.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{car.year || car.modelYear || 'N/A'}</TableCell>
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
                        {car.mileage || car.kmDriven || 0} km
                      </div>
                    </TableCell>
                    <TableCell>
                      {car.testDriveInfo?.isOnTestDrive ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-600">
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
                      <div className="flex gap-2 items-center">
                        <SmartActionDropdown
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
                              console.log('🚀 ShowroomFloor1 - Move action clicked for car:', car);
                              setSelectedCar(car);
                              setShowMoveFormDialog(true);
                              console.log('📱 ShowroomFloor1 - Dialog state set to true');
                            }
                          }}
                          id={`actions-${car.id}`}
                          ariaLabel={`Actions for ${car.model} ${car.vinNumber}`}
                        />
                      </div>
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
        <DialogContent className="sm:max-w-[700px] w-[95vw] px-6 py-6" aria-describedby="add-car-floor1-description">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Add Car to Showroom Floor 1
            </DialogTitle>
            <p id="add-car-floor1-description" className="text-sm text-gray-600">
              Add a new vehicle to the showroom floor 1 inventory with complete details
            </p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-6">
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

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  min="2020"
                  max="2030"
                  value={newCar.year}
                  onChange={(e) => setNewCar(prev => ({ ...prev, year: safeParseInt(e.target.value, 2024) }))}
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

            <div className="grid grid-cols-2 gap-6">
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
                  onChange={(e) => setNewCar(prev => ({ ...prev, price: safeParseInt(e.target.value, 0) }))}
                  placeholder="e.g., 85000"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
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
                  onChange={(e) => setNewCar(prev => ({ ...prev, batteryPercentage: safeParseInt(e.target.value, 85) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label htmlFor="range">Range (km)</Label>
                <Input
                  id="range"
                  type="number"
                  min="0"
                  value={newCar.range}
                  onChange={(e) => setNewCar(prev => ({ ...prev, range: safeParseInt(e.target.value, 520) }))}
                  placeholder="e.g., 520"
                />
              </div>
            </div>

            {/* Technical Specs - Hidden fields for car details */}
            <details className="border rounded-none p-4">
              <summary className="font-medium cursor-pointer">Technical Specifications (Optional)</summary>
              <div className="grid grid-cols-2 gap-6 mt-4">
                <div>
                  <Label htmlFor="horsePower">Horse Power</Label>
                  <Input
                    id="horsePower"
                    type="number"
                    min="0"
                    value={newCar.horsePower}
                    onChange={(e) => setNewCar(prev => ({ ...prev, horsePower: safeParseInt(e.target.value, 0) }))}
                    placeholder="e.g., 408"
                  />
                </div>
                <div>
                  <Label htmlFor="torque">Torque (Nm)</Label>
                  <Input
                    id="torque"
                    type="number"
                    min="0"
                    value={newCar.torque}
                    onChange={(e) => setNewCar(prev => ({ ...prev, torque: safeParseInt(e.target.value, 0) }))}
                    placeholder="e.g., 700"
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
                    onChange={(e) => setNewCar(prev => ({ ...prev, topSpeed: safeParseInt(e.target.value, 0) }))}
                    placeholder="e.g., 200"
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
          <div className="flex justify-end gap-3 pt-6 border-t mt-4">
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

      {/* Test Drive Selection Dialog - Temporarily disabled */}
      {/* {showTestDriveSelectionDialog && selectedCar && (
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
      )} */}

      {/* Test Drive Dialog - Temporarily disabled */}
      {/* <TestDriveDialog
        isOpen={showTestDriveDialog}
        onClose={() => {
          setShowTestDriveDialog(false);
          setSelectedCar(null);
        }}
        car={selectedCar}
        onScheduleTestDrive={handleActualTestDriveSchedule}
        isClientTestDrive={selectedTestDriveType}
      /> */}

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

      {/* Enhanced Car Details Dialog - Temporarily disabled */}
      {/* <EnhancedCarDetailDialog
        isOpen={showEnhancedDetailsDialog}
        onClose={() => {
          setShowEnhancedDetailsDialog(false);
          setSelectedCarForDetails(null);
        }}
        car={selectedCarForDetails}
        onCarUpdate={handleCarUpdate}
      /> */}

      {/* IT Software Update Dialog - Temporarily disabled */}
      {/* <ITSoftwareUpdateDialog
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
      /> */}

      {/* Customs Management Dialog */}
      {customsCar && (
        <CustomsManagementDialog
          open={showCustomsDialog}
          onOpenChange={setShowCustomsDialog}
          car={customsCar}
          onCustomsUpdate={handleCustomsUpdate}
        />
      )}

      {/* Delivery Date Dialog */}
      <DeliveryDateDialog
        open={showDeliveryDateDialog}
        onOpenChange={setShowDeliveryDateDialog}
        car={carForDeliveryDate}
        onSave={(carId: string, deliveryData: { deliveryDate: string; deliveryNotes: string; }) => {
          const updatedCars = cars.map(car => 
            car.id === carId 
              ? { ...car, deliveryDate: deliveryData.deliveryDate, deliveryNotes: deliveryData.deliveryNotes, lastUpdated: new Date().toISOString() }
              : car
          );
          setCars(updatedCars);
          saveCarsToStorage(updatedCars);
          setShowDeliveryDateDialog(false);
          toast({
            title: "Delivery Date Updated",
            description: `Delivery date has been set successfully.`,
          });
        }}
      />

      {/* PDI Checklist Dialog */}
      <PdiChecklistDialog
        isOpen={showFullPdiDialog}
        onClose={() => setShowFullPdiDialog(false)}
        car={selectedCar}
        onSave={(carId: string, pdiCompleted: boolean) => {
          console.log('PDI Checklist saved:', carId, pdiCompleted);
          setShowFullPdiDialog(false);
          toast({
            title: "PDI Checklist Saved",
            description: `PDI checklist has been ${pdiCompleted ? 'completed' : 'saved'} successfully.`,
          });
        }}
      />


      {/* Warranty Form Dialog */}
      <WarrantyFormDialog
        isOpen={warrantyEditor.isWarrantyDialogOpen}
        onClose={warrantyEditor.closeWarrantyDialog}
        carId={warrantyEditor.selectedCarId || ''}
        tableName={warrantyEditor.selectedTableName || 'cars'}
        currentWarranty={warrantyEditor.selectedCarWarranty || undefined}
        onSave={warrantyEditor.handleWarrantySave}
      />

      {/* Move Car Form Dialog */}
      <MoveCarFormDialog
        isOpen={showMoveFormDialog}
        onClose={() => setShowMoveFormDialog(false)}
        car={selectedCar || { id: '', vinNumber: '', model: '' }}
        currentLocation="SHOWROOM_1"
        onMoveComplete={() => {
          setShowMoveFormDialog(false);
          setSelectedCar(null);
          // Refresh car data
          loadCarsFromDatabase();
        }}
      />
    </div>
    </WarrantyLifeDialogProvider>
  );
};

export default ShowroomFloor1Page;
