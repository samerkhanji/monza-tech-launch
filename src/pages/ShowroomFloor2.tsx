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
import PdiViewDialog from '@/pages/ShowroomFloor1/components/PdiViewDialog';
import { CarStatusSelectionDialog } from '@/components/CarStatusSelectionDialog';
import EnhancedCarDetailDialog from '@/components/EnhancedCarDetailDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ITSoftwareUpdateDialog from '@/components/ITSoftwareUpdateDialog';
import TableSearch from '@/components/ui/table-search';

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
  customs?: 'paid' | 'not paid';
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
}

const ShowroomFloor2Page: React.FC = () => {
  const [cars, setCars] = useState<CarData[]>([]);
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null);
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [showTestDriveSelectionDialog, setShowTestDriveSelectionDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
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

  useEffect(() => {
    // Updated sample data with Voyah vehicles for showroom floor 2
    const sampleCars: CarData[] = [
      {
        id: 'floor2-1',
        vinNumber: 'LVGBB22E5NG000001',
        model: 'Voyah FREE',
        brand: 'Voyah',
        year: 2024,
        color: 'Pearl White',
        price: 89000,
        status: 'in_stock',
        category: 'REV',
        batteryPercentage: 95,
        range: 860,
        currentFloor: 'Showroom 2',
        features: ['Premium Audio', 'Air Suspension', 'Panoramic Roof'],
        arrivalDate: new Date().toISOString(),
        pdiCompleted: true,
        pdiTechnician: 'Mike Johnson',
        pdiDate: new Date().toISOString(),
        pdiNotes: 'Vehicle passed all inspection points. Ready for display.'
      },
      {
        id: 'floor2-2',
        vinNumber: 'LVGBB22E5NG000002',
        model: 'Voyah DREAM',
        brand: 'Voyah',
        year: 2024,
        color: 'Midnight Black',
        price: 125000,
        status: 'reserved',
        category: 'EV',
        batteryPercentage: 88,
        range: 605,
        currentFloor: 'Showroom 2',
        features: ['Executive Package', 'Massage Seats', 'Premium Sound'],
        arrivalDate: new Date().toISOString(),
        pdiCompleted: false,
        clientName: 'Ahmed Al-Mansouri',
        clientPhone: '+971-50-123-4567'
      }
    ];
    setCars(sampleCars);
  }, []);

  const handleVinScanned = (vin: string) => {
    const existingCar = cars.find(c => c.vinNumber === vin);
    if (existingCar) {
      toast({
        title: "Car Exists",
        description: `Car with VIN ${vin} already exists on Floor 2 (${existingCar.model})`,
      });
      return;
    }

    // Create new car from scanned VIN
    const newScannedCar: CarData = {
      id: `floor2-${Date.now()}`,
      vinNumber: vin,
      model: `Vehicle (VIN: ${vin.slice(-4)})`,
      year: new Date().getFullYear(),
      color: 'Unknown',
      price: 0,
      status: 'in_stock',
      category: 'EV',
      batteryPercentage: 100,
      range: 0,
      features: [],
      arrivalDate: new Date().toISOString(),
      pdiCompleted: false
    };

    setCars(prev => [...prev, newScannedCar]);
    setShowVinScanner(false);
    
    toast({
      title: "Vehicle Added",
      description: `Vehicle with VIN ${vin} added to Floor 2`,
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

    setCars(prev => [...prev, manualCar]);
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
    setSelectedCar(car);
    setShowTestDriveSelectionDialog(true);
  };

  const handleTestDriveTypeSelection = (isClientTestDrive: boolean) => {
    setIsClientTestDrive(isClientTestDrive);
    setShowTestDriveSelectionDialog(false);
    setShowTestDriveDialog(true);
  };

  const handleActualTestDriveSchedule = (carId: string, testDriveInfo: any) => {
    setCars(prevCars => 
      prevCars.map(car => 
        car.id === carId 
          ? { 
              ...car, 
              testDriveInfo: {
                ...testDriveInfo,
                isOnTestDrive: true
              }
            }
          : car
      )
    );
    
    toast({
      title: "Test Drive Scheduled",
      description: `${testDriveInfo.isClientTestDrive ? 'Client' : 'Employee'} test drive scheduled`,
    });
    
    setShowTestDriveDialog(false);
    setSelectedCar(null);
  };

  const handleTestDriveEnd = (carId: string) => {
    setCars(prevCars => 
      prevCars.map(car => 
        car.id === carId 
          ? { ...car, testDriveInfo: undefined }
          : car
      )
    );
    
    toast({
      title: "Test Drive Ended",
      description: "Test drive has been completed and car is now available.",
    });
  };

  const handleRemoveCar = (carId: string) => {
    setCars(prev => prev.filter(car => car.id !== carId));
    toast({
      title: "Car Removed",
      description: "Car removed from Floor 2",
    });
  };

  const handleEditCar = (carId: string, updates: Partial<CarData>) => {
    setCars(prev => 
      prev.map(car => 
        car.id === carId ? { ...car, ...updates } : car
      )
    );
  };

  const handleMoveCar = (destination: string, notes?: string) => {
    if (!selectedCar) return;

    toast({
      title: "Car Moving",
      description: `${selectedCar.model} is being moved to ${destination}`,
    });

    // In a real app, you would update the car's location in the database
    // and potentially add a record to a car_movements table.
    // For this example, we'll just remove it from this floor.
    setCars(prev => prev.filter(car => car.id !== selectedCar.id));
    setShowMoveDialog(false);
    setSelectedCar(null);

    // You might also want to add the car to the destination list if it's another floor
    // or update its status if it's moved to service/sold etc.
  };

  const handlePdiSaved = (carId: string, pdiCompleted: boolean) => {
    setCars(prevCars =>
      prevCars.map(car =>
        car.id === carId ? { ...car, pdiCompleted: pdiCompleted } : car
      )
    );
    // PDI status updated
  };

  const handlePdiComplete = (carId: string, pdiData: { technician: string, notes: string, photos: string[] }) => {
    setCars(prev => 
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
  };

  const handleViewDetails = (car: CarData) => {
    setSelectedCar(car);
    setShowDetailsDialog(true);
  };

  const handleViewPdi = (car: CarData) => {
    setSelectedCar(car);
    setShowPdiDialog(true);
  };

  const handleStatusClick = (car: CarData) => {
    setSelectedCarForStatus(car);
    setShowStatusDialog(true);
  };

  const handleStatusUpdate = (carId: string, status: 'in_stock' | 'sold' | 'reserved', clientInfo?: any) => {
    setCars(prev => 
      prev.map(car => 
        car.id === carId 
          ? { 
              ...car, 
              status,
              ...clientInfo,
              lastUpdated: new Date().toISOString()
            }
          : car
      )
    );

    const carModel = cars.find(c => c.id === carId)?.model;
    toast({
      title: "Status Updated", 
      description: `${carModel} status updated to ${status}`,
    });
  };

  const handleCustomsClick = (car: CarData) => {
    setSelectedCarForDetails(car);
    setShowEnhancedDetailsDialog(true);
  };

  const handleCarUpdate = (carId: string, updates: any) => {
    setCars(prev => 
      prev.map(car => 
        car.id === carId ? { ...car, ...updates } : car
      )
    );
  };

  const handleOpenSoftwareDialog = (car: CarData) => {
    setSelectedCarForSoftware(car);
    setShowSoftwareDialog(true);
  };

  const handleSoftwareUpdate = (carId: string, softwareData: any) => {
    setCars(prev => 
      prev.map(car => 
        car.id === carId ? { 
          ...car, 
          ...softwareData,
          lastUpdated: new Date().toISOString()
        } : car
      )
    );
    
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
                      <div className="flex gap-1">
                        {/* Enhanced Actions Dropdown */}
                        <div className="relative">
                          <select
                            onChange={(e) => {
                              const action = e.target.value;
                              if (action === 'view') {
                                handleViewDetails(car);
                              } else if (action === 'edit') {
                                setSelectedCar(car);
                                setShowEditDialog(true);
                              } else if (action === 'move') {
                                setSelectedCar(car);
                                setShowMoveDialog(true);
                              }
                              // Reset select
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

      {/* Car Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Details - {selectedCar?.model}
            </DialogTitle>
          </DialogHeader>
          {selectedCar && (
            <div className="space-y-6">
              {/* Vehicle Overview */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
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
                    <p className="font-medium">{(selectedCar as any).brand || 'Voyah'}</p>
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
                      <p className="font-medium mt-1">Showroom Floor 2</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Arrival Date</Label>
                      <p className="font-medium mt-1">{(selectedCar as any).arrivalDate || 'N/A'}</p>
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
                    <div>
                      <Label className="text-sm text-gray-600">Horsepower</Label>
                      <p className="font-medium mt-1">{(selectedCar as any).horsePower || (selectedCar as any).horse_power || 'N/A'} HP</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Torque</Label>
                      <p className="font-medium mt-1">{(selectedCar as any).torque || 'N/A'} Nm</p>
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
                      <p className="font-medium">${((selectedCar as any).purchasePrice || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Features & Equipment */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Features & Equipment</h3>
                  {selectedCar.features && selectedCar.features.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedCar.features.map((feature: string, index: number) => (
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
              {(selectedCar as any).clientName && (
                <div className="space-y-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-lg border-b border-amber-200 pb-2">Client Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Client Name</Label>
                      <p className="font-medium">{(selectedCar as any).clientName}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Phone Number</Label>
                      <p className="font-medium">{(selectedCar as any).clientPhone || 'N/A'}</p>
                    </div>
                    {(selectedCar as any).clientLicensePlate && (
                      <div>
                        <Label className="text-sm text-gray-600">License Plate</Label>
                        <p className="font-medium">{(selectedCar as any).clientLicensePlate}</p>
                      </div>
                    )}
                    {(selectedCar as any).expectedDeliveryDate && (
                      <div>
                        <Label className="text-sm text-gray-600">Expected Delivery</Label>
                        <p className="font-medium">{(selectedCar as any).expectedDeliveryDate}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Performance Specifications */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Performance Specifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Acceleration (0-100 km/h)</Label>
                    <p className="font-medium">{(selectedCar as any).acceleration || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Top Speed</Label>
                    <p className="font-medium">{(selectedCar as any).topSpeed || 'N/A'} km/h</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Charging Time</Label>
                    <p className="font-medium">{(selectedCar as any).chargingTime || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Warranty Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Warranty & Service</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Warranty Period</Label>
                    <p className="font-medium">{(selectedCar as any).warranty || 'Standard warranty applies'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Service Due</Label>
                    <p className="font-medium">{(selectedCar as any).nextServiceDate || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              {(selectedCar as any).notes && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Additional Notes</h3>
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{(selectedCar as any).notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
