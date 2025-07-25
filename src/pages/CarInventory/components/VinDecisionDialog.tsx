import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, MapPin, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CarData {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  status: string;
  currentFloor?: string;
  inShowroom: boolean;
}

interface VinDecisionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vinNumber: string;
  onMoveToInventory: (car: CarData) => void;
  onAddToNewArrivals: (vinNumber: string) => void;
  onAddToInventory: (vinNumber: string) => void;
}

const VinDecisionDialog: React.FC<VinDecisionDialogProps> = ({
  isOpen,
  onClose,
  vinNumber,
  onMoveToInventory,
  onAddToNewArrivals,
  onAddToInventory,
}) => {
  const [existingCar, setExistingCar] = useState<CarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<'pending' | 'move' | 'new-arrivals' | 'inventory'>('pending');

  useEffect(() => {
    if (isOpen && vinNumber) {
      checkExistingCar();
    }
  }, [isOpen, vinNumber]);

  const checkExistingCar = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('car_inventory')
        .select('*')
        .eq('vin_number', vinNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking car:', error);
        toast({
          title: "Error",
          description: "Failed to check existing cars",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setExistingCar({
          id: data.id,
          vinNumber: data.vin_number,
          model: data.model,
          year: data.year,
          color: data.color,
          status: data.status,
          currentFloor: data.current_floor || undefined,
          inShowroom: data.in_showroom || false
        });
      } else {
        setExistingCar(null);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to check existing cars",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveToInventory = () => {
    if (existingCar) {
      onMoveToInventory(existingCar);
      onClose();
    }
  };

  const handleAddToNewArrivals = () => {
    onAddToNewArrivals(vinNumber);
    onClose();
  };

  const handleAddToInventory = () => {
    onAddToInventory(vinNumber);
    onClose();
  };

  const resetDialog = () => {
    setDecision('pending');
    setExistingCar(null);
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Checking VIN...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-monza-yellow"></div>
            <span className="ml-3">Searching for VIN: {vinNumber}</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            VIN Scanned: {vinNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {existingCar ? (
            // Existing car found
            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium text-blue-900">Car Found in System</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    This vehicle already exists in our database.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Model:</span>
                  <p className="font-medium">{existingCar.model}</p>
                </div>
                <div>
                  <span className="text-gray-600">Year:</span>
                  <p className="font-medium">{existingCar.year}</p>
                </div>
                <div>
                  <span className="text-gray-600">Color:</span>
                  <p className="font-medium">{existingCar.color}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={existingCar.status === 'in_stock' ? 'default' : 'secondary'}>
                    {existingCar.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Current Location:</span>
                  <p className="font-medium">{existingCar.currentFloor || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-gray-600">In Showroom:</span>
                  <Badge variant={existingCar.inShowroom ? 'default' : 'secondary'}>
                    {existingCar.inShowroom ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={handleMoveToInventory}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Move to Inventory
                </Button>
              </div>
            </div>
          ) : (
            // New car
            <div className="border rounded-lg p-4 bg-yellow-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-900">New Vehicle Detected</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    This VIN is not found in our system. Where would you like to add this vehicle?
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <Button
                  onClick={handleAddToInventory}
                  variant="outline"
                  className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Add to Car Inventory</div>
                    <div className="text-xs text-blue-600">Add new vehicle directly to inventory for sale</div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VinDecisionDialog; 