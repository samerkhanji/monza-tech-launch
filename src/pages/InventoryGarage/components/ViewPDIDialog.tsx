import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarDays, FileText, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { dateUtils } from '@/lib/utils';
import { InventoryItem } from '@/types/inventory';

interface ViewPDIDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
}

const getPDIStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-500';
    case 'in progress':
      return 'bg-yellow-500';
    case 'pending':
      return 'bg-gray-500';
    case 'failed':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const ViewPDIDialog: React.FC<ViewPDIDialogProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>PDI Status</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Vehicle Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Model:</span>
                  <span className="ml-2">{item.carModel}</span>
                </div>
                <div>
                  <span className="text-gray-600">VIN:</span>
                  <span className="ml-2">{item.vin}</span>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2">{item.location.room}</span>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2">{item.lastUpdated}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">PDI Status</h3>
              <div className="flex items-center gap-2">
                <Badge className={getPDIStatusColor(item.pdiStatus)}>
                  {item.pdiStatus === 'completed' ? (
                    <><span className="mr-1 text-lg">☺</span>Complete</>
                  ) : item.pdiStatus === 'in progress' ? (
                    <><span className="mr-1 text-lg">☹</span>In Progress</>
                  ) : item.pdiStatus === 'failed' ? (
                    <><span className="mr-1 text-lg">☹</span>Failed</>
                  ) : (
                    <><span className="mr-1 text-lg">☹</span>Pending</>
                  )}
                </Badge>
              </div>
            </div>

            {item.pdiNotes && (
              <div className="space-y-2">
                <h3 className="font-medium">Notes</h3>
                <p className="text-sm text-gray-600">{item.pdiNotes}</p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 