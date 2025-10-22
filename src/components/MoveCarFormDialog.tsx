import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Car, Building, Wrench, Calendar, Package } from 'lucide-react';

interface MoveCarFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: {
    id: string;
    vinNumber: string;
    model: string;
    brand?: string;
    year?: number;
    color?: string;
  };
  currentLocation: string;
  onMoveComplete?: () => void;
}

interface Destination {
  id: string;
  label: string;
  description: string;
  icon: any;
  floorValue: string;
}

const MoveCarFormDialog: React.FC<MoveCarFormDialogProps> = ({
  isOpen,
  onClose,
  car,
  currentLocation,
  onMoveComplete
}) => {
  const [selectedDestination, setSelectedDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const { toast } = useToast();

  // Define available destinations based on current location
  const getAvailableDestinations = (): Destination[] => {
    const allDestinations: Destination[] = [
      {
        id: 'showroom-floor-1',
        label: 'Showroom Floor 1',
        description: 'Main showroom display area',
        icon: Building,
        floorValue: 'SHOWROOM_1'
      },
      {
        id: 'showroom-floor-2', 
        label: 'Showroom Floor 2',
        description: 'Premium showroom display area',
        icon: Building,
        floorValue: 'SHOWROOM_2'
      },
      {
        id: 'car-inventory',
        label: 'Car Inventory',
        description: 'General inventory storage',
        icon: Package,
        floorValue: 'CAR_INVENTORY'
      },
      {
        id: 'garage-inventory',
        label: 'Garage Inventory', 
        description: 'Service and repair area inventory',
        icon: Wrench,
        floorValue: 'GARAGE_INVENTORY'
      },
      {
        id: 'schedule',
        label: 'Schedule',
        description: 'Scheduled for service or delivery',
        icon: Calendar,
        floorValue: 'SCHEDULE'
      }
    ];

    // Filter out current location
    return allDestinations.filter(dest => dest.floorValue !== currentLocation);
  };

  const destinations = getAvailableDestinations();

  // Debug log when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      console.log('🔓 Move Car Form Dialog opened');
      console.log('🚗 Car data:', car);
      console.log('📍 Current location:', currentLocation);
      console.log('🎯 Available destinations:', destinations);
    }
  }, [isOpen, car, currentLocation, destinations]);

  // Debug state changes
  React.useEffect(() => {
    console.log('🔄 State changed:', { selectedDestination, isMoving, buttonDisabled: isMoving || !selectedDestination });
  }, [selectedDestination, isMoving]);

  const handleMove = async () => {
    console.log('🎯 Move Car Form - handleMove triggered');
    console.log('📝 Form state:', { selectedDestination, notes, car });
    
    if (!selectedDestination) {
      console.log('❌ No destination selected');
      toast({
        title: "Error",
        description: "Please select a destination.",
        variant: "destructive"
      });
      return;
    }

    const destination = destinations.find(d => d.id === selectedDestination);
    if (!destination) {
      console.log('❌ Invalid destination:', selectedDestination);
      toast({
        title: "Error", 
        description: "Invalid destination selected.",
        variant: "destructive"
      });
      return;
    }

    console.log('✅ Destination found:', destination);
    setIsMoving(true);
    console.log('⏳ Setting isMoving to true');

    try {
      // Test Supabase connection first
      console.log('🔗 Testing Supabase connection...');
      const { data: testData, error: testError } = await supabase
        .from('car_inventory')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Supabase connection failed:', testError);
        throw new Error(`Database connection failed: ${testError.message}`);
      }
      
      console.log('✅ Supabase connection successful');

      console.log('🚗 Starting move operation:', {
        carId: car.id,
        carVin: car.vinNumber,
        from: currentLocation,
        to: destination.floorValue,
        notes,
        destinationLabel: destination.label
      });

      // First, verify the car exists in the database
      console.log('🔍 Checking if car exists in database...');
      const { data: existingCar, error: checkError } = await supabase
        .from('car_inventory')
        .select('id, vin, model, current_floor, current_location')
        .eq('id', car.id)
        .single();

      if (checkError) {
        console.error('❌ Car not found in database:', checkError);
        throw new Error(`Car not found in database: ${checkError.message}`);
      }

      console.log('✅ Car found in database:', existingCar);

      // Use the proper RPC function to move the car
      console.log('🔄 Using RPC function to move car...');
      console.log('📊 Move parameters:', {
        p_car_id: car.id,
        p_to: destination.floorValue,
        p_notes: notes
      });
      
      let data, error;
      try {
        // Try the new move_car_manual RPC function first (with notes support)
        if (notes && notes.trim()) {
          console.log('🔄 Using move_car_manual RPC with notes...');
          const rpcResult = await supabase.rpc('move_car_manual', {
            p_car_id: car.id,
            p_to: destination.floorValue,
            p_notes: notes
          });
          
          data = rpcResult.data;
          error = rpcResult.error;
        } else {
          // Use the simpler move_car RPC function
          console.log('🔄 Using move_car RPC function...');
          const rpcResult = await supabase.rpc('move_car', {
            p_car_id: car.id,
            p_to: destination.floorValue
          });
          
          data = rpcResult.data;
          error = rpcResult.error;
        }
      } catch (rpcError) {
        console.log('⚠️ RPC failed, trying direct update as fallback...');
        // Fallback to direct update if RPC functions don't exist yet
        try {
          const updateData = {
            location: destination.floorValue, // Use 'location' field for the cars table
            updated_at: new Date().toISOString(),
            notes: notes ? `${notes} (Moved on ${new Date().toLocaleDateString()})` : undefined
          };
          
          const result = await supabase
            .from('car_inventory') // This should be a view pointing to cars table
            .update(updateData)
            .eq('id', car.id)
            .select()
            .single();
            
          data = result.data;
          error = result.error;
        } catch (directError) {
          console.error('❌ Both RPC and direct update failed:', directError);
          error = rpcError; // Use the original RPC error
        }
      }

      if (error) {
        console.error('❌ Database update failed:', error);
        console.error('Error details:', { message: error.message, code: error.code, details: error.details });
        
        // Provide helpful error messages
        if (error.message && error.message.includes('audit_log')) {
          throw new Error('Database audit system needs to be configured. Please run the complete-database-fix.sql script in Supabase.');
        } else if (error.message && error.message.includes('car_inventory')) {
          throw new Error('Database table structure mismatch. Please run the complete-database-fix.sql script in Supabase to create the required views.');
        } else if (error.message && error.message.includes('move_car')) {
          throw new Error('Database RPC functions missing. Please run the complete-database-fix.sql script in Supabase.');
        }
        throw error;
      }

      console.log('✅ Database update successful:', data);
      
      toast({
        title: "Car Moved Successfully",
        description: `${car.brand || ''} ${car.model} has been moved to ${destination.label}.`,
      });

      // Call completion callback
      if (onMoveComplete) {
        onMoveComplete();
      }

      // Close dialog and reset form
      onClose();
      setSelectedDestination('');
      setNotes('');

      // Reload page to refresh car lists
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error: any) {
      console.error('❌ Move operation failed:', error);
      toast({
        title: "Move Failed",
        description: error.message || "Failed to move car. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsMoving(false);
    }
  };

  const handleCancel = () => {
    setSelectedDestination('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Move Car
          </DialogTitle>
          <DialogDescription id="move-car-desc">
            Choose where to move this vehicle. This updates its current location in the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Car Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="font-medium text-sm text-gray-700 mb-1">Moving Vehicle:</h3>
            <p className="text-sm">
              <span className="font-medium">{car.brand || ''} {car.model}</span>
              {car.year && <span className="text-gray-600"> ({car.year})</span>}
            </p>
            <p className="text-xs text-gray-600 font-mono">VIN: {car.vinNumber}</p>
            {car.color && <p className="text-xs text-gray-600">Color: {car.color}</p>}
          </div>

          {/* Destination Selection */}
          <div>
            <Label className="text-sm font-medium">Select Destination *</Label>
            {selectedDestination && (
              <p className="text-xs text-green-600 mt-1">
                ✅ Selected: {destinations.find(d => d.id === selectedDestination)?.label}
              </p>
            )}
            <div className="grid gap-2 mt-2">
              {destinations.map((destination) => {
                const IconComponent = destination.icon;
                return (
                  <Card
                    key={destination.id}
                    className={`p-3 cursor-pointer transition-all hover:bg-gray-50 ${
                      selectedDestination === destination.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                    onClick={() => {
                      console.log('🎯 Destination selected:', destination);
                      setSelectedDestination(destination.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{destination.label}</p>
                        <p className="text-xs text-gray-600">{destination.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedDestination === destination.id
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedDestination === destination.id && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="move-notes" className="text-sm font-medium">
              Move Notes (Optional)
            </Label>
            <Textarea
              id="move-notes"
              placeholder="Add any notes about this move..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isMoving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔘 Move Car button clicked!');
                console.log('📊 Button state:', { isMoving, selectedDestination, disabled: isMoving || !selectedDestination });
                console.log('📊 Event details:', { type: e.type, target: e.target });
                handleMove();
              }}
              onMouseDown={(e) => {
                console.log('🖱️ Move Car button mouse down!');
              }}
              disabled={isMoving || !selectedDestination}
              className="flex-1 bg-blue-600 hover:bg-blue-700 !cursor-pointer"
              style={{ pointerEvents: 'auto' }}
            >
              {isMoving ? 'Moving...' : 'Move Car'}
            </Button>
          </div>
          
          {/* Test Alternative Button */}
          <div className="mt-2">
            <button
              onClick={() => {
                console.log('🧪 TEST BUTTON clicked!');
                handleMove();
              }}
              disabled={isMoving || !selectedDestination}
              className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              🧪 TEST: Move Car (Alternative Button)
            </button>
          </div>

          {/* Debug Info */}
          <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
            <p>🔍 Debug: selectedDestination = "{selectedDestination}"</p>
            <p>🔍 Debug: isMoving = {isMoving.toString()}</p>
            <p>🔍 Debug: buttonDisabled = {(isMoving || !selectedDestination).toString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoveCarFormDialog;
