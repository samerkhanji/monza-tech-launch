import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Camera } from 'lucide-react';
import { ScheduledCar } from '@/types';
import VinScannerDialog from '@/components/VinScannerDialog';
import { Car } from '@/pages/CarInventory/types';
import { NewCarArrival } from '@/pages/NewCarArrivals/types';

interface GarageScheduleCarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (carData: Omit<ScheduledCar, 'id'>, targetDate: string) => void;
  targetDate: string;
  defaultWorkType?: ScheduledCar['workType'];
}

const GarageScheduleCarDialog: React.FC<GarageScheduleCarDialogProps> = ({
  open,
  onOpenChange,
  onSchedule,
  targetDate,
  defaultWorkType = 'mechanic'
}) => {
  const [formData, setFormData] = useState<Omit<ScheduledCar, 'id'>>({
    carCode: '',
    carModel: '',
    customerName: '',
    priority: 'medium',
    estimatedDuration: '2',
    workType: defaultWorkType,
    assignedMechanic: '',
    notes: '',
    status: 'scheduled'
  });
  const [showVinScanner, setShowVinScanner] = useState(false);

  useEffect(() => {
    setFormData(prev => ({ ...prev, workType: defaultWorkType }));
  }, [defaultWorkType]);

  const lookupCarByVIN = (vin: string) => {
    // Check car inventory first
    const savedInventory = localStorage.getItem('carInventory');
    if (savedInventory) {
      const cars: Car[] = JSON.parse(savedInventory);
      const foundCar = cars.find(car => car.vinNumber === vin);
      if (foundCar) {
        return {
          carCode: foundCar.vinNumber,
          carModel: `${foundCar.model} ${foundCar.year}`,
          customerName: foundCar.clientName || '',
          color: foundCar.color,
          batteryPercentage: foundCar.batteryPercentage
        };
      }
    }

    // Check new car arrivals
    const savedNewArrivals = localStorage.getItem('newCarArrivals');
    if (savedNewArrivals) {
      const newCars: NewCarArrival[] = JSON.parse(savedNewArrivals);
      const foundCar = newCars.find(car => car.vin === vin);
      if (foundCar) {
        return {
          carCode: foundCar.vin,
          carModel: foundCar.model,
          customerName: '', // New arrivals don't have customer names yet
          color: foundCar.color,
          batteryPercentage: foundCar.batteryPercentage
        };
      }
    }

    return null;
  };

  const handleSubmit = () => {
    if (formData.carCode && formData.carModel && formData.customerName) {
      onSchedule(formData, targetDate);
      onOpenChange(false);
      // Reset form
      setFormData({
        carCode: '',
        carModel: '',
        customerName: '',
        priority: 'medium',
        estimatedDuration: '2',
        workType: defaultWorkType,
        assignedMechanic: '',
        notes: '',
        status: 'scheduled'
      });
    }
  };

  const handleVinScanned = (scannedData: string) => {
    console.log('VIN scanned in garage schedule dialog:', scannedData);
    
    // Look up car information by VIN
    const carInfo = lookupCarByVIN(scannedData);
    
    if (carInfo) {
      setFormData(prev => ({
        ...prev,
        carCode: carInfo.carCode,
        carModel: carInfo.carModel,
        customerName: carInfo.customerName,
        notes: carInfo.color ? `Color: ${carInfo.color}${carInfo.batteryPercentage ? `, Battery: ${carInfo.batteryPercentage}%` : ''}` : ''
      }));
      console.log('Car information populated from lookup:', carInfo);
    } else {
      // If no car found, just populate the VIN
      setFormData(prev => ({
        ...prev,
        carCode: scannedData
      }));
      console.log('No car found in database, populated VIN only');
    }
    
    setShowVinScanner(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Car for Garage</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="carCode" className="text-right">Car Code</Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="carCode"
                  value={formData.carCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, carCode: e.target.value }))}
                  placeholder="Enter car code or VIN"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVinScanner(true)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="carModel" className="text-right">Car Model</Label>
              <Input
                id="carModel"
                value={formData.carModel}
                onChange={(e) => setFormData(prev => ({ ...prev, carModel: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Voyah Free 2024"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="customerName" className="text-right">Customer</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className="col-span-3"
                placeholder="Customer name"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="workType" className="text-right">Work Type</Label>
              <Select
                value={formData.workType}
                onValueChange={(value: ScheduledCar['workType']) => 
                  setFormData(prev => ({ ...prev, workType: value }))
                }
              >
                <SelectTrigger id="workType" className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="painter">Painter</SelectItem>
                  <SelectItem value="detailer">Detailer</SelectItem>
                  <SelectItem value="mechanic">Mechanic</SelectItem>
                  <SelectItem value="body_work">Body Work</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: ScheduledCar['priority']) => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger id="priority" className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="estimatedDuration" className="text-right">Duration (hrs)</Label>
              <Input
                id="estimatedDuration"
                type="number"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                className="col-span-3"
                min="0.5"
                step="0.5"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="assignedMechanic" className="text-right">Assigned To</Label>
              <Input
                id="assignedMechanic"
                value={formData.assignedMechanic}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedMechanic: e.target.value }))}
                className="col-span-3"
                placeholder="Employee name (optional)"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="col-span-3"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.carCode || !formData.carModel || !formData.customerName}
            >
              Schedule Car
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VinScannerDialog
        isOpen={showVinScanner}
        onClose={() => setShowVinScanner(false)}
        onVinScanned={handleVinScanned}
      />
    </>
  );
};

export default GarageScheduleCarDialog;
