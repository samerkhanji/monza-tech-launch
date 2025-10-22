import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QrCode, Plus, Package, Truck, CheckCircle, Clock } from 'lucide-react';
import VinScannerDialog from '@/components/VinScannerDialog';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  StatusBadge
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { NewCar, createNewCar } from './types';
import { safeParseInt, safeLocalStorageGet } from '@/utils/errorHandling';

const NewCarArrivalsPage: React.FC = () => {
  const [newCars, setNewCars] = useState<NewCar[]>([]);
  const [showVinScanner, setShowVinScanner] = useState(false);
  const [showManualAddDialog, setShowManualAddDialog] = useState(false);

  // Manual add form state
  const [newCar, setNewCar] = useState({
    vinNumber: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    arrivalDate: new Date().toISOString(),
  });

  useEffect(() => {
    // Sample data for new car arrivals
    const sampleNewCars = [
      createNewCar({
        id: '1',
        vinNumber: '1234567890ABCDEFG',
        model: 'Mercedes-Benz S-Class',
        year: 2024,
        color: 'Obsidian Black',
        arrivalDate: new Date().toISOString(),
      }),
      createNewCar({
        id: '2',
        vinNumber: '9876543210ZYXWVUT',
        model: 'Porsche 911',
        year: 2023,
        color: 'Guards Red',
        arrivalDate: new Date().toISOString(),
      }),
    ];
    setNewCars(sampleNewCars);
  }, []);

  const handleVinScanned = (vin: string) => {
    // Check if VIN exists in ordered cars
    const orderedCars = safeLocalStorageGet<any[]>('orderedCars', []);
    const existingOrder = orderedCars.find((order: any) => order.vin_number === vin);

    setShowVinScanner(false); // Close scanner regardless of outcome
    
    if (existingOrder) {
      // Move from ordered cars to arrivals
      const updatedOrderedCars = orderedCars.filter((order: any) => order.vin_number !== vin);
      localStorage.setItem('orderedCars', JSON.stringify(updatedOrderedCars));
      
      // Create new arrival with data from order
      const newArrival = createNewCar({
        id: `arrival-${Date.now()}`,
        vinNumber: vin,
        model: existingOrder.model || `Vehicle ${vin.slice(-4)}`,
        year: existingOrder.year || new Date().getFullYear(),
        color: existingOrder.color || 'Unknown',
        arrivalDate: new Date().toISOString(),
        brand: existingOrder.brand || 'Unknown',
        category: existingOrder.category || 'EV' // Assuming default to EV if category not in order
      });

      setNewCars(prev => [...prev, newArrival]);
      
      toast({
        title: "Car Moved to Arrivals",
        description: `${existingOrder.model || 'Vehicle'} (VIN: ${vin}) moved from Ordered Cars to New Arrivals`
      });
      return; // Stop processing if found in ordered cars
    }

    // If not found in ordered cars, check if already in arrivals
      const existingCar = newCars.find(c => c.vinNumber === vin || c.vin === vin);
      if (existingCar) {
        toast({
          title: "Car Already Exists",
          description: `${existingCar.model} is already in New Arrivals`,
          variant: "destructive"
        });
      return; // Stop processing if already in arrivals
      }

    // If not found in ordered cars or arrivals, create new car from scanned VIN
      const newScannedCar = createNewCar({
        id: `new-arrival-${Date.now()}`,
        vinNumber: vin,
      model: `Vehicle ${vin.slice(-4)}`, // Basic model name
        year: new Date().getFullYear(),
        color: 'Unknown',
        arrivalDate: new Date().toISOString()
      });

      setNewCars(prev => [...prev, newScannedCar]);
      
      toast({
      title: "New Car Added", // Changed toast title for clarity
        description: `Vehicle with VIN ${vin} added to New Arrivals`
      });
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

    const existingCar = newCars.find(c => c.vinNumber === newCar.vinNumber || c.vin === newCar.vinNumber);
    if (existingCar) {
      toast({
        title: "VIN Already Exists",
        description: "A car with this VIN is already in New Arrivals",
        variant: "destructive"
      });
      return;
    }

    const manualCar = createNewCar({
      id: `new-arrival-manual-${Date.now()}`,
      ...newCar
    });

    setNewCars(prev => [...prev, manualCar]);
    setShowManualAddDialog(false);

    // Reset form
    setNewCar({
      vinNumber: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      arrivalDate: new Date().toISOString(),
    });

    toast({
      title: "Car Added",
      description: `${newCar.model} added to New Arrivals`
    });
  };

  const handleRemoveCar = (carId: string) => {
    setNewCars(prev => prev.filter(car => car.id !== carId));
    toast({
      title: "Car Removed",
      description: "Car removed from New Arrivals"
    });
  };

  const handleMoveToInventory = (carId: string) => {
    const car = newCars.find(c => c.id === carId);
    if (!car) return;

    // Move car to inventory
    const inventoryCar = {
      id: `inv-${Date.now()}`,
      vinNumber: car.vin || car.vinNumber,
      model: car.model,
      year: car.year,
      color: car.color,
      status: 'in_stock',
      batteryPercentage: car.batteryPercentage,
      category: car.category || 'EV',
      arrivalDate: car.arrivalDate,
      notes: car.notes,
      photos: car.photos,
      damages: car.damages
    };

    // Save to localStorage (or your inventory system)
    const existingInventory = safeLocalStorageGet<any[]>('carInventory', []);
    existingInventory.push(inventoryCar);
    localStorage.setItem('carInventory', JSON.stringify(existingInventory));

    // Remove from arrivals
    setNewCars(prev => prev.filter(c => c.id !== carId));

    toast({
      title: "Car Moved to Inventory",
      description: `${car.model} has been moved to Car Inventory`
    });
  };

  const getPdiStatusVariant = (completed?: boolean) => {
    return completed ? 'success' : 'warning';
  };

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-monza-yellow p-3 rounded-lg">
            <Truck className="h-8 w-8 text-monza-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-monza-black">New Car Arrivals</h1>
            <p className="text-gray-600 mt-1">Newly arrived vehicles awaiting processing</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowVinScanner(true)}
            className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <QrCode className="h-4 w-4" />
            Scan VIN
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
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="text-monza-black">
            New Car Arrivals ({newCars.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold text-monza-black">VIN</TableHead>
                  <TableHead className="font-semibold text-monza-black">Model</TableHead>
                  <TableHead className="font-semibold text-monza-black">Year</TableHead>
                  <TableHead className="font-semibold text-monza-black">Color</TableHead>
                  <TableHead className="font-semibold text-monza-black">PDI Status</TableHead>
                  <TableHead className="font-semibold text-monza-black">Arrival Date</TableHead>
                  <TableHead className="font-semibold text-monza-black text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newCars.map((car) => (
                  <TableRow key={car.id} className="hover:bg-monza-yellow/5">
                    <TableCell className="font-mono text-sm">{car.vin || car.vinNumber}</TableCell>
                    <TableCell className="font-medium text-monza-black">{car.model}</TableCell>
                    <TableCell>{car.year}</TableCell>
                    <TableCell>{car.color}</TableCell>
                    <TableCell>
                      <div 
                        className="cursor-pointer"
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
                    <TableCell>{new Date(car.arrivalDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveToInventory(car.id)}
                          className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Move to Inventory
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveCar(car.id)}
                        >
                          Remove
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

      {/* VIN Scanner Dialog */}
      <VinScannerDialog
        isOpen={showVinScanner}
        onClose={() => setShowVinScanner(false)}
        onVinScanned={handleVinScanned}
        
      />

      {/* Manual Add Dialog */}
      <Dialog open={showManualAddDialog} onOpenChange={setShowManualAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Car to New Arrivals</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vin">VIN Number</Label>
              <Input
                id="vin"
                value={newCar.vinNumber}
                onChange={(e) => setNewCar(prev => ({ ...prev, vinNumber: e.target.value }))}
                placeholder="17-character VIN"
                maxLength={17}
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={newCar.model}
                onChange={(e) => setNewCar(prev => ({ ...prev, model: e.target.value }))}
                placeholder="Car model"
              />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={newCar.year}
                onChange={(e) => setNewCar(prev => ({ ...prev, year: safeParseInt(e.target.value, 2024) }))}
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                value={newCar.color}
                onChange={(e) => setNewCar(prev => ({ ...prev, color: e.target.value }))}
                placeholder="Car color"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowManualAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleManualAdd} className="bg-monza-yellow hover:bg-monza-yellow/90 text-monza-black">
              Add Car
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewCarArrivalsPage;
