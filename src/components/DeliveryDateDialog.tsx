import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock } from 'lucide-react';
import { CustomCalendarIcon } from '@/components/icons/CustomCalendarIcon';
import { toast } from '@/hooks/use-toast';

interface DeliveryDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: {
    id: string;
    model: string;
    vinNumber: string;
    status: string;
    deliveryDate?: string;
    deliveryNotes?: string;
    pdiCompleted?: boolean;
    clientName?: string;
  } | null;
  onSave: (carId: string, deliveryData: {
    deliveryDate: string;
    deliveryNotes: string;
  }) => void;
}

export const DeliveryDateDialog: React.FC<DeliveryDateDialogProps> = ({
  open,
  onOpenChange,
  car,
  onSave
}) => {
  const [deliveryDate, setDeliveryDate] = useState(car?.deliveryDate || '');
  const [deliveryNotes, setDeliveryNotes] = useState(car?.deliveryNotes || '');

  // Reset state when car changes
  React.useEffect(() => {
    if (car) {
      setDeliveryDate(car.deliveryDate || '');
      setDeliveryNotes(car.deliveryNotes || '');
    }
  }, [car]);

  const handleSave = () => {
    if (!car || !deliveryDate) {
      toast({
        title: "Error",
        description: "Please select a delivery date",
        variant: "destructive"
      });
      return;
    }

    onSave(car.id, {
      deliveryDate,
      deliveryNotes
    });

    toast({
      title: "Delivery Date Set",
      description: `Delivery scheduled for ${new Date(deliveryDate).toLocaleDateString()} for ${car.model}`,
    });

    onOpenChange(false);
  };

  const getDaysUntilDelivery = () => {
    if (!deliveryDate) return null;
    const today = new Date();
    const delivery = new Date(deliveryDate);
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDelivery = getDaysUntilDelivery();
  const isUrgent = daysUntilDelivery !== null && daysUntilDelivery <= 3 && daysUntilDelivery >= 0;
  const isOverdue = daysUntilDelivery !== null && daysUntilDelivery < 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white border border-gray-300 shadow-xl">
        <DialogHeader className="border-b border-gray-200 pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <Clock className="w-5 h-5 text-monza-yellow" />
            Set Delivery Date
          </DialogTitle>
        </DialogHeader>

        {car && (
          <div className="space-y-4">
            {/* Car Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Vehicle Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Model:</span>
                  <span className="ml-2 font-medium">{car.model}</span>
                </div>
                <div>
                  <span className="text-gray-600">VIN:</span>
                  <span className="ml-2 font-mono">{car.vinNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <Badge 
                    variant={car.status === 'sold' ? 'default' : 'secondary'}
                    className="ml-2"
                  >
                    {car.status === 'sold' ? 'Sold' : 'Reserved'}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">PDI Status:</span>
                  <Badge 
                    variant={car.pdiCompleted ? 'default' : 'secondary'}
                    className={`ml-2 ${car.pdiCompleted ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}`}
                  >
                    {car.pdiCompleted ? (
                      <>
                        Complete
                      </>
                    ) : (
                      <>
                        Pending
                      </>
                    )}
                  </Badge>
                </div>
                {car.clientName && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Client:</span>
                    <span className="ml-2 font-medium">{car.clientName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* PDI Warning */}
            {!car.pdiCompleted && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">PDI Required</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Pre-Delivery Inspection must be completed before vehicle delivery
                </p>
              </div>
            )}

            {/* Delivery Date Input */}
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Delivery Date *</Label>
              <div className="relative">
                <Input
                  id="deliveryDate"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => {
                    console.log('Date changed:', e.target.value);
                    setDeliveryDate(e.target.value);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-yellow-50 border-2 border-yellow-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 text-black pr-12"
                  placeholder="Select delivery date"
                  style={{
                    colorScheme: 'light',
                    fontSize: '14px'
                  }}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                </div>
              </div>
              {daysUntilDelivery !== null && (
                <div className="text-sm">
                  {isOverdue ? (
                    <span className="text-red-600 font-medium">
                      Overdue by {Math.abs(daysUntilDelivery)} day(s)
                    </span>
                  ) : isUrgent ? (
                    <span className="text-yellow-600 font-medium">
                      Delivery in {daysUntilDelivery} day(s) - PDI urgent!
                    </span>
                  ) : (
                    <span className="text-gray-600">
                      {daysUntilDelivery} day(s) until delivery
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Notes */}
            <div className="space-y-2">
              <Label htmlFor="deliveryNotes">Delivery Notes</Label>
              <Textarea
                id="deliveryNotes"
                placeholder="Special delivery instructions, location, time preferences, etc."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <Button 
            type="button"
            variant="outline" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Cancel clicked');
              setDeliveryDate(car?.deliveryDate || '');
              setDeliveryNotes(car?.deliveryNotes || '');
              onOpenChange(false);
            }}
            className="flex-1 h-11 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Save clicked, deliveryDate:', deliveryDate);
              if (!deliveryDate) {
                toast({
                  title: "Missing Date",
                  description: "Please select a delivery date",
                  variant: "destructive"
                });
                return;
              }
              handleSave();
            }}
            disabled={!deliveryDate || !deliveryDate.trim()}
            className="flex-1 h-11 bg-monza-yellow text-monza-black hover:bg-monza-yellow/90 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed border-2 border-monza-yellow hover:border-monza-yellow/90 font-semibold transition-all"
          >
            {deliveryDate ? 'Save Delivery Date' : 'Select Date First'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryDateDialog; 