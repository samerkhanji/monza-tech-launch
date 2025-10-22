import React, { useEffect, useRef } from 'react';
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
  // Render nothing until opened with a valid car to avoid unnecessary renders/logs
  if (!isOpen || !car) {
    return null;
  }
  const handlePdiSave = (carId: string, pdiData: any) => {
    // Persist PDI data for showroom floor 1
    
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
          <PdiProInjector active={isOpen} />
          <div id="pdi-pro" data-pdi="pro" className="flex-1 overflow-y-auto p-5">
            <PdiChecklistPdf car={car} onSave={handlePdiSave} />
          </div>
        </AppModal>
    </>
  );
};

export default PdiViewDialog;

function PdiProInjector({ active }: { active: boolean }) {
  const injectedRef = useRef(false);
  useEffect(() => {
    if (!active || injectedRef.current) return;
    try {
      const CSS = `
      [data-pdi="pro"] { --b:#e5e7eb; --head:#f3f4f6; color:#111827; font-family: Inter, system-ui, Arial, sans-serif; }
      [data-pdi="pro"] h1 { font-size:28px; font-weight:800; letter-spacing:-0.01em; margin:16px 0; }
      [data-pdi="pro"] h2 { font-size:20px; font-weight:700; margin:12px 0; }
      [data-pdi="pro"] .pdi-card{ background:#fff; border:1px solid var(--b); border-radius:10px; }
      [data-pdi="pro"] .pdi-card-head{ background:var(--head); font-weight:600; padding:10px 14px; border-bottom:1px solid var(--b); border-radius:10px 10px 0 0; }
      [data-pdi="pro"] .pdi-card-body{ padding:14px; background:#fff; }
      [data-pdi="pro"] table{ width:100%; border-collapse:collapse; background:#fff; }
      [data-pdi="pro"] th,[data-pdi="pro"] td{ border:1px solid var(--b) !important; padding:10px 12px; vertical-align:middle; }
      [data-pdi="pro"] thead th{ background:var(--head); font-weight:600; }
      [data-pdi="pro"] input[type="text"],[data-pdi="pro"] input[type="date"],[data-pdi="pro"] input[type="number"],[data-pdi="pro"] textarea{
        height:44px; padding:0 12px; border:1px solid #d1d5db; border-radius:8px; background:#fff; box-shadow:0 1px 0 rgba(0,0,0,.03);
      }
      [data-pdi="pro"] textarea{ min-height:56px; padding-top:10px; padding-bottom:10px; }
      [data-pdi="pro"] input:focus,[data-pdi="pro"] textarea:focus{ outline:2px solid #facc15; border-color:#facc15; }
      [data-pdi="pro"] input[type="checkbox"],[data-pdi="pro"] input[type="radio"]{ width:18px; height:18px; cursor:pointer; }
      [data-pdi="pro"] label{ cursor:default; }
      [data-pdi="pro"] label input,[data-pdi="pro"] .pdi-field input,[data-pdi="pro"] .pdi-field textarea{ cursor:text; }
      `;
      const style = document.createElement('style');
      style.id = 'pdi-pro-inject';
      style.textContent = CSS;
      document.head.appendChild(style);
      injectedRef.current = true;
    } catch (e) {
      // ignore
    }
  }, [active]);
  return null;
}
