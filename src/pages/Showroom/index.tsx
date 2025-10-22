import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car } from '../CarInventory/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CarIcon, QrCode, Filter, ScanQrCode } from 'lucide-react';
import ShowroomToggleDialog from '../CarInventory/components/ShowroomToggleDialog';
import { toggleShowroomStatus } from '../CarInventory/index';
import { useToast } from '@/hooks/use-toast';

const ShowroomPage: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isShowroomDialogOpen, setIsShowroomDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load cars from localStorage
  useEffect(() => {
    const loadCars = () => {
      const savedInventory = localStorage.getItem('carInventory');
      if (savedInventory) {
        const allCars: Car[] = JSON.parse(savedInventory);
        // Filter only cars in showroom
        return allCars.filter(car => car.inShowroom);
      }
      return [];
    };

    setCars(loadCars());
    
    // Listen for storage changes (for cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'carInventory' && e.newValue) {
        try {
          const updatedInventory: Car[] = JSON.parse(e.newValue);
          setCars(updatedInventory.filter(car => car.inShowroom));
        } catch (error) {
          console.error('Error parsing car inventory from storage event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter cars based on search term
  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      const searchLower = searchTerm.toLowerCase();
      return car.vinNumber.toLowerCase().includes(searchLower) ||
             car.model.toLowerCase().includes(searchLower) ||
             car.color.toLowerCase().includes(searchLower);
    });
  }, [cars, searchTerm]);

  const handleRemoveFromShowroom = (car: Car) => {
    setSelectedCar(car);
    setIsShowroomDialogOpen(true);
  };

  const handleShowroomConfirm = (note: string, removeReason?: 'sold' | 'moved' | 'other') => {
    if (selectedCar) {
      // Update car in localStorage
      const updatedCar = toggleShowroomStatus(selectedCar.id, false, note, removeReason);
      
      if (updatedCar) {
        // Update local state
        setCars(prevCars => prevCars.filter(car => car.id !== selectedCar.id));
        
        // Show appropriate notification based on removal reason
        const statusMessage = removeReason === 'sold' 
          ? 'has been marked as sold and removed from the showroom'
          : removeReason === 'moved'
          ? 'has been moved and location updated to N/A'
          : 'has been removed from the showroom';
        
        toast({
          title: "Removed from showroom",
          description: `${selectedCar.model} (${selectedCar.vinNumber}) ${statusMessage}.`,
        });
      }
      
      setIsShowroomDialogOpen(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy');
  };
  
  const handleScanVIN = () => {
    navigate('/scan-vin');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Showroom</h1>
          <p className="text-muted-foreground mt-1">
            Manage vehicles currently on display in the showroom
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleScanVIN}>
            <ScanQrCode className="mr-2 h-4 w-4" />
            Scan VIN
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row mb-6 gap-4">
        <div className="w-full sm:w-1/2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by VIN, model or color..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-full sm:w-1/2">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md flex items-start gap-2">
            <CarIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Currently displaying: {cars.length} vehicles</p>
              <p className="text-sm text-amber-700 mt-0.5">
                To add more vehicles, use the Scan VIN button or go to Car Inventory.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>Vehicles currently in showroom</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>VIN Number</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Color interior</TableHead>
                <TableHead>Entry Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCars.length > 0 ? (
                filteredCars.map((car) => (
                  <TableRow key={car.id}>
                    <TableCell className="font-medium">
                      {car.model} ({car.year})
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {car.vinNumber}
                    </TableCell>
                    <TableCell>{car.color}</TableCell>
                    <TableCell>{(car as any).interiorColor || (car as any).interior_color || '-'}</TableCell>
                    <TableCell>{formatDate(car.showroomEntryDate)}</TableCell>
                    <TableCell>
                      {car.showroomNote ? (
                        <span className="text-sm">{car.showroomNote}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">No notes</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={car.status === 'sold' ? 'secondary' : 'default'}>
                        {car.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleRemoveFromShowroom(car)}
                      >
                        <QrCode className="mr-1 h-4 w-4" />
                        <span>Remove</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <CarIcon className="h-8 w-8 text-muted-foreground" />
                      <p className="font-medium">No cars in showroom</p>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Add cars to the showroom by scanning their VIN or using the Car Inventory page.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => navigate('/car-inventory')}
                      >
                        Go to Car Inventory
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {selectedCar && (
        <ShowroomToggleDialog
          isOpen={isShowroomDialogOpen}
          onClose={() => setIsShowroomDialogOpen(false)}
          car={selectedCar}
          onConfirm={handleShowroomConfirm}
        />
      )}
    </div>
  );
};

export default ShowroomPage;
