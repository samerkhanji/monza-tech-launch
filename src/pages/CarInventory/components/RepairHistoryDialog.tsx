import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Car, RepairHistoryRecord } from '../types';
import { Wrench, User, FileText } from 'lucide-react';

interface RepairHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
}

const RepairHistoryDialog: React.FC<RepairHistoryDialogProps> = ({ 
  isOpen, 
  onClose, 
  car 
}) => {
  const repairHistory = car.repairHistory || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl h-[90vh] z-50 bg-white opacity-100 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Repair History - {car.model}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm"><strong>VIN:</strong> {car.vinNumber}</p>
              <p className="text-sm"><strong>Model:</strong> {car.model}</p>
              <p className="text-sm"><strong>Color:</strong> {car.color}</p>
            </div>

            {repairHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No repair history found for this vehicle.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {repairHistory.map((repair) => (
                  <div key={repair.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {format(new Date(repair.date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{repair.technician}</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <p className="font-medium text-gray-900">{repair.description}</p>
                      {repair.notes && (
                        <p className="text-sm text-gray-600 mt-1">{repair.notes}</p>
                      )}
                    </div>

                    {repair.partsUsed.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Parts Used:</h4>
                        <div className="space-y-1">
                          {repair.partsUsed.map((part, index) => (
                            <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                              <span>{part.partName}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {part.partNumber}
                                </Badge>
                                <span className="text-gray-600">Qty: {part.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {repair.photos && repair.photos.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <FileText className="h-4 w-4" />
                        <span>{repair.photos.length} photo{repair.photos.length !== 1 ? 's' : ''} attached</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default RepairHistoryDialog;
