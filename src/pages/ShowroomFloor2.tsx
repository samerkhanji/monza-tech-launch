import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, QrCode, Plus, Car, Edit, MapPin, FileText, MoreVertical, Battery, Fuel, User, Clock, CheckCircle, X } from 'lucide-react';
import VinScannerDialog from '@/components/VinScannerDialog';
import { toast } from '@/hooks/use-toast';
import { useToast } from '@/hooks/use-toast';
import TestDriveDialog from '@/pages/CarInventory/components/TestDriveDialog';
import TestDriveSelectionDialog from '@/components/TestDriveSelectionDialog';
import SimpleTestDriveDialog from '@/components/SimpleTestDriveDialog';
import EditCarDialog from '@/pages/ShowroomFloor1/components/EditCarDialog';
import MoveCarDialog from '@/pages/ShowroomFloor1/components/MoveCarDialog';
import PdiViewDialog from '@/pages/ShowroomFloor2/components/PdiViewDialog';
import { CarStatusSelectionDialog } from '@/components/CarStatusSelectionDialog';
import EnhancedCarDetailDialog from '@/components/EnhancedCarDetailDialog';
import CustomsManagementDialog from '@/components/CustomsManagementDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SmartActionDropdown from '@/components/ui/SmartActionDropdown';
import { Textarea } from '@/components/ui/textarea';
// Removed custom Select in favor of native <select> for dialog stability
import ITSoftwareUpdateDialog from '@/components/ITSoftwareUpdateDialog';
import TableSearch from '@/components/ui/table-search';
import WarrantyInfoColumn from '@/components/WarrantyInfoColumn';
import StandardWarrantyButton from '@/components/StandardWarrantyButton';
import { safeParseInt } from '@/utils/errorHandling';

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
  pdiTechnician?: string;
  pdiDate?: string;
  pdiNotes?: string;
  testDriveInfo?: any;
  customs?: 'paid' | 'not paid' | string;
  brand?: string;
  currentFloor?: "Inventory" | "Garage" | "Showroom 1" | "Showroom 2" | "New Arrivals";
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
  // Warranty tracking fields
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyMonthsRemaining?: number;
  warrantyDaysRemaining?: number;
  warrantyStatus?: 'active' | 'expiring_soon' | 'expired';
  lastWarrantyUpdate?: string;
  // New simple warranty field
  warranty_life?: string | null;
}

const ShowroomFloor2Page: React.FC = () => {
  const [cars, setCars] = useState<CarData[]>([]);
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [showTestDriveSelectionDialog, setShowTestDriveSelectionDialog] = useState(false);
  // Use enhanced details dialog instead of legacy details view
  const [showManualAddDialog, setShowManualAddDialog] = useState(false);
  const [showVinScanner, setShowVinScanner] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showPdiDialog, setShowPdiDialog] = useState(false);
  const [isClientTestDrive, setIsClientTestDrive] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedCarForStatus, setSelectedCarForStatus] = useState<CarData | null>(null);
  const [showEnhancedDetailsDialog, setShowEnhancedDetailsDialog] = useState(false);
  const [selectedCarForDetails, setSelectedCarForDetails] = useState<CarData | null>(null);
  const [showSoftwareDialog, setShowSoftwareDialog] = useState(false);
  const [selectedCarForSoftware, setSelectedCarForSoftware] = useState<CarData | null>(null);
  const [showCustomsDialog, setShowCustomsDialog] = useState(false);
  const [customsCar, setCustomsCar] = useState<CarData | null>(null);

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
      car.price?.toString().includes(query) ||
      car.batteryPercentage?.toString().includes(query)
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
    category: 'EV' as 'EV' | 'REV' | 'ICEV',
    customs: 'not paid',
    pdiStatus: 'pending',
    
    // Technical Specifications (for car details view)
    horsePower: 0,
    torque: 0,
    acceleration: '',
    topSpeed: 0,
    chargingTime: '',
    warranty: '',
    
    location: 'Showroom Floor 2'
  });

  const [addCarStep, setAddCarStep] = useState(0);
  const [newFeature, setNewFeature] = useState('');

  const { toast: useToastFn } = useToast();

  // Function to save cars to localStorage
  const saveCarsToStorage = (updatedCars: CarData[]) => {
    // 🚫 DISABLED: No more data saving to prevent mock data persistence
    console.log('🚫 ShowroomFloor2: Data saving disabled - no mock data will be stored');
    return;
  };

  const loadCarsFromDatabase = async () => {
    try {
      console.log('Showroom Floor 2: Loading cars from DatabaseManager...');
      
      const { DatabaseManager } = await import('@/database/DatabaseManager');
      
      const data = await DatabaseManager.getFloor2Cars();
      
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
          range: car.range || 520,
          features: [],
          arrivalDate: car.delivery_date || car.created_at,
          pdiCompleted: car.pdi_completed || false,
          pdiStatus: car.pdi_completed ? 'completed' : 'pending',
          pdiTechnician: car.pdi_technician,
          pdiDate: car.pdi_date,
          pdiNotes: car.pdi_notes,
          customs: car.custom_duty === 'paid' ? 'paid' : 'not paid',
          currentFloor: car.current_floor,
          notes: car.notes,
          lastModified: car.updated_at,
          warrantyStartDate: car.warranty_start_date,
          warrantyEndDate: car.warranty_end_date,
          warrantyMonthsRemaining: car.warranty_months_remaining,
          warrantyDaysRemaining: car.warranty_days_remaining,
          warrantyStatus: car.warranty_status,
          lastWarrantyUpdate: car.last_warranty_update,
          warranty_life: car.warranty_life
        }));
        
        setCars(mappedCars);
        console.log(`Showroom Floor 2: Loaded ${mappedCars.length} cars from DatabaseManager`);
      } else {
        console.log('Showroom Floor 2: No cars found in DatabaseManager for Floor 2');
        setCars([]);
      }
    } catch (error) {
      console.error('Error loading cars from DatabaseManager:', error);
      setCars([]);
    }
  };

  useEffect(() => {
    // Load cars when component mounts
    loadCarsFromDatabase();
  }, []); // Empty dependency array - only runs once

  // Add real-time updates for car movements
  useEffect(() => {
    const setupSubscription = async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Set up real-time subscription to car_inventory table
      const channel = supabase
        .channel('floor2-cars-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'car_inventory'
          },
          (payload) => {
            console.log('🔌 Floor 2: Real-time change detected:', payload);
            
            // Refresh cars when any change occurs
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
              console.log('🔄 Floor 2: Refreshing cars due to real-time change...');
              loadCarsFromDatabase();
            }
          }
        )
        .subscribe();

      console.log('✅ Floor 2: Real-time subscription established');
      return channel;
    };

    let channel: any = null;
    setupSubscription().then((ch) => {
      channel = ch;
    });

    return () => {
      if (channel) {
        import('@/integrations/supabase/client').then(({ supabase }) => {
          supabase.removeChannel(channel);
          console.log('🔌 Floor 2: Real-time subscription cleaned up');
        });
      }
    };
  }, []);

  const handleVinScanned = (vin: string) => {
    console.log('VIN scanned on Floor 2:', vin);
    
    // Refresh the floor data to show the moved car
    loadCarsFromDatabase();
    
    toast({
      title: "VIN Scanned Successfully",
      description: `VIN ${vin} has been processed for Floor 2.`,
    });
  };

  const handleCarAdded = (carId: string) => {
    // Handle when car is added via universal scanner
    toast({
      title: "Car Added Successfully",
      description: `New car has been added to Showroom Floor 2.`,
    });
  };

  const handleManualAdd = () => {
    if (!newCar.vinNumber || !newCar.model || !newCar.color) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in VIN, model, and color",
      });
      return;
    }

    const existingCar = cars.find(c => c.vinNumber === newCar.vinNumber);
    if (existingCar) {
      toast({
        title: "Car Exists",
        description: "A car with this VIN is already on Floor 2",
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

    const manualCar: CarData = {
      id: `floor2-manual-${Date.now()}`,
      ...newCar,
      status: 'in_stock',
      category: newCar.category,
      customs: newCar.customs as 'paid' | 'not paid',
      features: [],
      arrivalDate: new Date().toISOString(),
      // Auto-set PDI based on form completion
      pdiCompleted: allFieldsFilled,
      pdiDate: allFieldsFilled ? new Date().toISOString() : undefined,
      pdiTechnician: allFieldsFilled ? 'System Auto-Complete' : undefined,
      pdiNotes: allFieldsFilled ? 'PDI auto-completed - all required fields filled during registration' : undefined
    };

    setCars(prev => {
      const updatedCars = [...prev, manualCar];
      saveCarsToStorage(updatedCars);
      return updatedCars;
    });
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
      category: 'EV',
      customs: 'not paid',
      pdiStatus: 'pending',
      horsePower: 0,
      torque: 0,
      acceleration: '',
      topSpeed: 0,
      chargingTime: '',
      warranty: '',
      location: 'Showroom Floor 2'
    });

    toast({
      title: "Car Added Successfully",
      description: `${newCar.model} added to Floor 2${allFieldsFilled ? ' - PDI auto-completed' : ' - PDI pending'}`,
    });
  };

  const handleScheduleTestDrive = (car: CarData) => {
    // Ensure schedule dialog is closed before opening selection
    setShowTestDriveDialog(false);
    setSelectedCar(car);
    setShowTestDriveSelectionDialog(true);
  };

  const handleTestDriveTypeSelection = (isClientTestDrive: boolean) => {
    setIsClientTestDrive(isClientTestDrive);
    // Close selection first, then open the schedule dialog on the next frame
    setShowTestDriveSelectionDialog(false);
    requestAnimationFrame(() => {
      setShowTestDriveDialog(true);
    });
  };

  const handleActualTestDriveSchedule = (carId: string, testDriveInfo: any) => {
    setCars(prevCars => {
      const updatedCars = prevCars.map(car => 
        car.id === carId 
          ? { 
              ...car, 
              testDriveInfo: {
                ...testDriveInfo,
                isOnTestDrive: true
              }
            }
          : car
      );
      saveCarsToStorage(updatedCars);
      return updatedCars;
    });
    
    toast({
      title: "Test Drive Scheduled",
      description: `${testDriveInfo.isClientTestDrive ? 'Client' : 'Employee'} test drive scheduled`,
    });
    
    setShowTestDriveDialog(false);
    setSelectedCar(null);
  };

  const handleTestDriveEnd = (carId: string) => {
    setCars(prevCars => {
      const updatedCars = prevCars.map(car => 
        car.id === carId 
          ? { ...car, testDriveInfo: undefined }
          : car
      );
      saveCarsToStorage(updatedCars);
      return updatedCars;
    });
    
    toast({
      title: "Test Drive Ended",
      description: "Test drive has been completed and car is now available.",
    });
  };

  const handleRemoveCar = (carId: string) => {
    setCars(prev => {
      const updatedCars = prev.filter(car => car.id !== carId);
      saveCarsToStorage(updatedCars);
      return updatedCars;
    });
    toast({
      title: "Car Removed",
      description: "Car removed from Floor 2",
    });
  };

  const handleEditCar = (carId: string, updates: Partial<CarData>) => {
    setCars(prev => {
      const updatedCars = prev.map(car => 
        car.id === carId ? { ...car, ...updates } : car
      );
      saveCarsToStorage(updatedCars);
      return updatedCars;
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
        notes: notes || `Moved from Showroom Floor 2`,
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
    } else if (destination === 'floor1') {
      const floor1 = JSON.parse(localStorage.getItem('showroomFloor1Cars') || '[]');
      const updated = byVinFilter(floor1);
      updated.push({ ...selectedCar, id: `floor1-${Date.now()}`, currentFloor: 'Showroom Floor 1', lastModified: nowIso });
      localStorage.setItem('showroomFloor1Cars', JSON.stringify(updated));
      toast({ title: 'Car Moved', description: `${selectedCar.model} moved to Showroom Floor 1.` });
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

  const handlePdiSaved = (carId: string, pdiCompleted: boolean) => {
    setCars(prevCars => {
      const updatedCars = prevCars.map(car =>
        car.id === carId ? { ...car, pdiCompleted: pdiCompleted } : car
      );
      saveCarsToStorage(updatedCars);
      return updatedCars;
    });
    // PDI status updated
  };

  const handlePdiComplete = (carId: string, pdiData: { technician: string, notes: string, photos: string[] }) => {
    setCars(prev => {
      const updatedCars = prev.map(car => 
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
      saveCarsToStorage(updatedCars);
      return updatedCars;
    });
  };

  const handleViewDetails = (car: CarData) => {
    setSelectedCarForDetails(car);
    setShowEnhancedDetailsDialog(true);
  };

  const handleViewPdi = (car: CarData) => {
    console.log('PDI button clicked for car:', car.model, car.vinNumber);
    setSelectedCar(car);
    setShowPdiDialog(true);
    console.log('showPdiDialog set to true');
  };

  const handleStatusClick = (car: CarData) => {
    setSelectedCarForStatus(car);
    setShowStatusDialog(true);
  };

  const handleStatusUpdate = (carId: string, status: 'in_stock' | 'sold' | 'reserved', clientInfo?: any) => {
    setCars(prev => {
      const updatedCars = prev.map(car => 
        car.id === carId 
          ? { 
              ...car, 
              status,
              ...clientInfo,
              lastUpdated: new Date().toISOString()
            }
          : car
      );
      saveCarsToStorage(updatedCars);
      return updatedCars;
    });

    const carModel = cars.find(c => c.id === carId)?.model;
    toast({
      title: "Status Updated", 
      description: `${carModel} status updated to ${status}`,
    });
  };

  const handleCustomsClick = (car: CarData) => {
    setCustomsCar(car);
    setShowCustomsDialog(true);
  };

  const handleCustomsUpdate = (carId: string, customsData: any) => {
    setCars(prev => {
      const updatedCars = prev.map(c => c.id === carId ? { ...c, ...customsData, lastModified: new Date().toISOString() } : c);
      try { localStorage.setItem('showroomFloor2Cars', JSON.stringify(updatedCars)); } catch {}
      return updatedCars;
    });
    toast({ title: 'Customs Updated', description: 'Customs information updated successfully' });
  };

  const handleCarUpdate = (carId: string, updates: any) => {
    setCars(prev => {
      const updatedCars = prev.map(car => 
        car.id === carId ? { ...car, ...updates } : car
      );
      saveCarsToStorage(updatedCars);
      return updatedCars;
    });
  };

  const handleOpenSoftwareDialog = (car: CarData) => {
    setSelectedCarForSoftware(car);
    setShowSoftwareDialog(true);
  };

  const handleSoftwareUpdate = (carId: string, softwareData: any) => {
    setCars(prev => {
      const updatedCars = prev.map(car => 
        car.id === carId ? { 
          ...car, 
          ...softwareData,
          lastUpdated: new Date().toISOString()
        } : car
      );
      saveCarsToStorage(updatedCars);
      return updatedCars;
    });
    
    toast({
      title: "Software Updated",
      description: "Car software information has been updated"
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

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Car className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Showroom Floor 2</h1>
            <p className="text-gray-600">Premium upper floor display area</p>
          </div>
        </div>

        {/* Action Buttons */}
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
              <Car className="h-5 w-5" />
              Cars on Display ({filteredCars.length} {searchQuery ? `of ${cars.length}` : ''})
            </CardTitle>
            <TableSearch
              id="showroom-floor2-search"
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search VINs, models, clients, colors..."
              className="w-full sm:w-auto"
            />
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
                  <TableHead className="font-semibold">Color interior</TableHead>
                  <TableHead className="font-semibold">Price</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Warranty Life</TableHead>
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
                    <TableCell>{(car as any).interiorColor || (car as any).interior_color || '-'}</TableCell>
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
                      <SmartActionDropdown
                        options={[
                          { value: 'details', label: 'View Details' },
                          { value: 'edit', label: 'Edit Car' },
                          { 
                            value: 'move', 
                            label: 'Move Car',
                            isMoveAction: true,
                            carId: car.id,
                            currentFloor: 'SHOWROOM_2' as const,
                            tableContext: 'FLOOR_2' as const
                          }
                        ]}
                        onAction={(action) => {
                          if (action === 'details') handleViewDetails(car);
                          else if (action === 'edit') { setSelectedCar(car); setShowEditDialog(true); }
                          else if (action === 'move') { setSelectedCar(car); setShowMoveDialog(true); }
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
        targetLocation="Showroom Floor 2"
        onCarMoved={(carId, fromLocation, toLocation) => {
          toast({
            title: "Car Moved",
            description: `Car moved from ${fromLocation} to ${toLocation}`,
          });
          // Refresh cars list after move
          window.location.reload();
        }}
        onCarAdded={handleCarAdded}
      />

      {/* Using EnhancedCarDetailDialog below for View Details */}

      {/* Simplified Manual Add Dialog */}
      <Dialog open={showManualAddDialog} onOpenChange={setShowManualAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Add Car to Showroom Floor 2
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
                <Input
                  id="model"
                  value={newCar.model}
                  onChange={(e) => setNewCar(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="Enter model name"
                  required
                />
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
                  onChange={(e) => setNewCar(prev => ({ ...prev, price: safeParseInt(e.target.value, 0) }))}
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
                  onChange={(e) => setNewCar(prev => ({ ...prev, batteryPercentage: safeParseInt(e.target.value, 85) }))}
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
                  onChange={(e) => setNewCar(prev => ({ ...prev, range: safeParseInt(e.target.value, 520) }))}
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

          {selectedCar && (
        <>
          {/* Test Drive Selection Dialog */}
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

          <TestDriveDialog
            isOpen={showTestDriveDialog}
            onClose={() => {
              setShowTestDriveDialog(false);
              setSelectedCar(null);
            }}
            car={selectedCar}
            onScheduleTestDrive={handleActualTestDriveSchedule}
            isClientTestDrive={isClientTestDrive}
          />

          <EditCarDialog
            isOpen={showEditDialog}
            onClose={() => {
              setShowEditDialog(false);
              setSelectedCar(null);
            }}
            car={selectedCar}
            onSave={handleEditCar}
          />

          <MoveCarDialog
            isOpen={showMoveDialog}
            onClose={() => {
              setShowMoveDialog(false);
              setSelectedCar(null);
            }}
            car={selectedCar}
            onMoveCar={handleMoveCar}
          />

          <PdiViewDialog
            isOpen={showPdiDialog}
            onClose={() => {
              setShowPdiDialog(false);
              setSelectedCar(null);
            }}
            car={selectedCar}
            onPdiComplete={handlePdiComplete}
          />
        </>
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
          onCarUpdate={handleCarUpdate}
        />
      )}

      {/* Customs Management Dialog */}
      {customsCar && (
        <CustomsManagementDialog
          open={showCustomsDialog}
          onOpenChange={setShowCustomsDialog}
          car={customsCar as any}
          onCustomsUpdate={handleCustomsUpdate}
        />
      )}

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

export default ShowroomFloor2Page;
