import React from 'react';
import AppModal from '@/components/AppModal';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import PdiChecklistPdf from '@/components/PdiChecklistPdf';
import '@/styles/pdi-checklist-dialog.css';

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
  console.log('PdiViewDialog render - isOpen:', isOpen, 'car:', car?.model);
  const handlePdiSave = (carId: string, pdiData: any) => {
    console.log('Saving PDI for car inventory:', carId, pdiData);
    
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
    <>
      <style>
        {`
          /* PDI Scrollbar Styles */
          .overflow-y-auto::-webkit-scrollbar {
            width: 8px !important;
          }
          
          .overflow-y-auto::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
            border-radius: 4px !important;
          }
          
          .overflow-y-auto::-webkit-scrollbar-thumb {
            background: #888 !important;
            border-radius: 4px !important;
          }
          
          .overflow-y-auto::-webkit-scrollbar-thumb:hover {
            background: #555 !important;
          }
        `}
      </style>
      <AppModal open={isOpen} onClose={onClose} maxWidth="max-w-6xl">
        <div className="flex-shrink-0 border-b pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              PDI Checklist - {car?.model} ({car?.vinNumber})
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
          
          {/* PDI Content unified styling */}
          <div id="pdi-pro" data-pdi="pro" className="flex-1 overflow-y-auto p-5">
            <PdiChecklistPdf car={car} onSave={handlePdiSave} />
          </div>
        </AppModal>
    </>
  );
};

export default PdiViewDialog; 