import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import PdiChecklistPdf from '@/components/PdiChecklistPdf';

interface PdiViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: any;
  onPdiComplete?: (carId: string, pdiData: { technician: string, notes: string, photos: string[] }) => void;
}

const PdiViewDialog: React.FC<PdiViewDialogProps> = ({
  isOpen,
  onClose,
  car,
  onPdiComplete,
}) => {
  const handlePdiSave = (carId: string, pdiData: any) => {
    console.log('Saving PDI for showroom floor 1:', carId, pdiData);
    
    if (onPdiComplete) {
      // Extract relevant data for the callback
      const callbackData = {
        technician: pdiData.signatures?.technician?.date || '',
        notes: Object.values(pdiData.overhauls || {}).join(', '),
        photos: [] // Could add photo functionality later
      };
      onPdiComplete(carId, callbackData);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              PDI Checklist - {car?.model} ({car?.vinNumber})
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <PdiChecklistPdf car={car} onSave={handlePdiSave} />
      </DialogContent>
    </Dialog>
  );
};

export default PdiViewDialog;
