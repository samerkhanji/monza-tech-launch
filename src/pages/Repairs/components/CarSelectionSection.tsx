import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Plus, Search } from 'lucide-react';
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
} from "@/components/ui/table"

interface CarSelectionSectionProps {
  onCarSelect: (vin: string) => void;
  selectedCar?: any;
  setSelectedCar?: (car: any) => void;
  carCode?: string;
  setCarCode?: (code: string) => void;
  handleGenerateCarCode?: (modelId: string) => void;
}

const CarSelectionSection: React.FC<CarSelectionSectionProps> = ({ 
  onCarSelect,
  selectedCar,
  setSelectedCar,
  carCode,
  setCarCode,
  handleGenerateCarCode
}) => {
  const [vinInput, setVinInput] = useState('');
  const [showVinScanner, setShowVinScanner] = useState(false);
  const [availableCars, setAvailableCars] = useState([
    { vinNumber: '1234567890ABCDEFG', model: 'Tesla Model S', year: 2023 },
    { vinNumber: 'ABCDEFG1234567890', model: 'BMW i8', year: 2020 },
    { vinNumber: '9876543210ZYXWVUT', model: 'Porsche Taycan', year: 2022 },
  ]);
  const [filteredCars, setFilteredCars] = useState(availableCars);

  useEffect(() => {
    setFilteredCars(availableCars);
  }, [availableCars]);

  const handleVinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setVinInput(value);

    // Filter cars as the VIN is typed
    if (value) {
      const filtered = availableCars.filter(car =>
        car.vinNumber.includes(value)
      );
      setFilteredCars(filtered);
    } else {
      setFilteredCars(availableCars);
    }
  };

  const handleVinScanned = (vin: string) => {
    setVinInput(vin);
    onCarSelect(vin);
    
    // Update selected car if setter is provided
    if (setSelectedCar) {
      const car = availableCars.find(c => c.vinNumber === vin);
      if (car) {
        setSelectedCar(car);
      }
    }

    toast({
      title: "VIN Scanned",
      description: `VIN ${vin} has been selected.`
    });
  };

  const handleManualVinEntry = () => {
    if (vinInput.length !== 17) {
      toast({
        title: "Invalid VIN",
        description: "Please enter a valid 17-character VIN number",
        variant: "destructive"
      });
      return;
    }
    onCarSelect(vinInput);
  };

  const handleCarSelect = (vin: string) => {
    setVinInput(vin);
    onCarSelect(vin);
    
    // Update selected car if setter is provided
    if (setSelectedCar) {
      const car = availableCars.find(c => c.vinNumber === vin);
      if (car) {
        setSelectedCar(car);
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Vehicle</CardTitle>
        <CardDescription>Choose an existing vehicle or add a new one.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="vin">Enter VIN</Label>
            <Input
              id="vin"
              placeholder="17-character VIN"
              value={vinInput}
              onChange={handleVinInputChange}
              className="font-mono"
            />
          </div>
          <div className="flex items-end space-x-2">
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setShowVinScanner(true)}
            >
              <QrCode className="h-4 w-4" />
              Scan VIN
            </Button>
            <Button
              type="button"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={handleManualVinEntry}
            >
              <Search className="h-4 w-4" />
              Search VIN
            </Button>
          </div>
        </div>

        {/* Display selected car information */}
        {selectedCar && (
          <div className="p-3 bg-monza-yellow/10 rounded-md border border-monza-yellow/20">
            <h4 className="font-medium text-monza-black">Selected Car</h4>
            <p className="text-sm text-gray-600">
              {selectedCar.model} ({selectedCar.year}) - VIN: {selectedCar.vinNumber}
            </p>
            {carCode && (
              <p className="text-sm text-gray-600">Car Code: {carCode}</p>
            )}
          </div>
        )}

        <VinScannerDialog
          isOpen={showVinScanner}
          onClose={() => setShowVinScanner(false)}
          onVinScanned={handleVinScanned}
        />

        <div className="relative overflow-x-auto">
          <Table>
            <TableCaption>Select from available vehicles</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>VIN</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCars.map((car) => (
                <TableRow key={car.vinNumber}>
                  <TableCell className="font-mono text-sm">{car.vinNumber}</TableCell>
                  <TableCell>{car.model}</TableCell>
                  <TableCell>{car.year}</TableCell>
                  <TableCell>
                    <Button 
                      variant="secondary" 
                      onClick={() => handleCarSelect(car.vinNumber)}
                      className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/80"
                    >
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarSelectionSection;
