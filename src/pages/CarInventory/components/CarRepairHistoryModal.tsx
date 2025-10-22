import React, { useState, useEffect } from 'react';
import { dateUtils, numberUtils, stringUtils, validationUtils } from '@/lib/utils';
import { format } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Car } from '../types';
import { RepairRecord } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Wrench, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CarRepairHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
}

const CarRepairHistoryModal: React.FC<CarRepairHistoryModalProps> = ({
  isOpen,
  onClose,
  car
}) => {
  const [repairHistory, setRepairHistory] = useState<RepairRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      // Load repair history from localStorage
      const fetchRepairHistory = () => {
        try {
          const savedHistory = localStorage.getItem('repairHistory');
          if (savedHistory) {
            const allHistory = JSON.parse(savedHistory) as RepairRecord[];
            
            // Filter repair history for this specific car
            // Match by VIN number - using startsWith since carCode might be first 6 chars of VIN
            const carRepairs = allHistory.filter(repair => 
              car.vinNumber.startsWith(repair.carCode) || 
              repair.carCode.includes(car.vinNumber.substring(0, 6))
            );
            
            setRepairHistory(carRepairs);
          }
        } catch (error) {
          console.error('Error loading repair history:', error);
          setRepairHistory([]);
        }
        setLoading(false);
      };
      
      fetchRepairHistory();
    }
  }, [isOpen, car]);

  // Removed local formatDateTime - using dateUtils.formatDateTime from utils

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl h-[90vh] overflow-hidden bg-white opacity-100 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-monza-yellow" />
            Repair History for {car.model} ({car.year})
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            VIN: {car.vinNumber}
          </div>
        </DialogHeader>

        <Separator className="my-2" />

        <ScrollArea className="flex-1 pr-4">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading repair history...
            </div>
          ) : repairHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No repair history found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This vehicle has no recorded repair history in the system.
              </p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {repairHistory.map((repair) => (
                <div 
                  key={repair.id} 
                  className="bg-white border rounded-lg p-4 hover:border-monza-yellow transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{repair.repairStage === 'completed' ? 'Completed Repair' : repair.repairStage.replace('_', ' ')}</h3>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {repair.repairStage}
                        </Badge>
                      </div>
                      <p className="text-sm">{repair.description || repair.issueDescription || 'No description available'}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Started: {dateUtils.formatDateTime(repair.startTimestamp)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Completed: {dateUtils.formatDateTime(repair.endTimestamp)}</span>
                    </div>
                  </div>
                  
                  {repair.mechanics && repair.mechanics.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium mb-1 flex items-center gap-1">
                        <Wrench className="h-3 w-3" />
                        Mechanics:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {repair.mechanics.map((mechanic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {mechanic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {repair.partsUsed && repair.partsUsed.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium mb-1">Parts Used:</div>
                      <div className="flex flex-wrap gap-1">
                        {repair.partsUsed.map((part, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-amber-50">
                            {part}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {repair.workNotes && repair.workNotes !== repair.partsUsed?.join(', ') && (
                    <div className="mt-3">
                      <div className="text-xs font-medium mb-1">Work Notes:</div>
                      <p className="text-xs bg-slate-50 p-2 rounded">{repair.workNotes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Make sure the History icon is properly imported to avoid TypeScript errors
import { History } from 'lucide-react';

export default CarRepairHistoryModal;
