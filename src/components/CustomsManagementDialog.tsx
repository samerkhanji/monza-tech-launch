import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import CustomsFormV2 from '@/components/inventory/CustomsFormV2';

interface CarData {
  id: string;
  vinNumber: string;
  model: string;
  year: number;
  color: string;
  brand?: string;
  customs?: 'paid' | 'not paid';
  customsAmount?: number;
  shippingCost?: number;
  customsDate?: string;
  customsDocumentation?: string;
  customsNotes?: string;
  customsProcessedBy?: string;
  current_location?: string | null;
  floor_bay?: string | null;
  condition_on_arrival?: string | null;
  shipping_status?: 'paid' | 'not paid';
  [key: string]: any;
}

interface CustomsManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: CarData;
  onCustomsUpdate: (carId: string, update: Record<string, any>) => void;
}

const CustomsManagementDialog: React.FC<CustomsManagementDialogProps> = ({
  open,
  onOpenChange,
  car,
  onCustomsUpdate,
}) => {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    status: (car as any).customs_status || car.customs || 'not paid',
    customsCost: (car as any).customs_cost?.toString() || (car.customsAmount?.toString() || ''),
    shippingCost: (car as any).shipping_cost?.toString() || (car.shippingCost?.toString() || ''),
    processedBy: (car as any).processed_by || car.customsProcessedBy || '',
    paymentDate: (car as any).payment_date || car.customsDate || '',
    documentRef: (car as any).customs_doc_ref || car.customsDocumentation || '',
    notes: (car as any).customs_notes || car.customsNotes || '',
    currentLocation: (car as any).current_location || (car as any).currentFloor || '',
    floorBay: (car as any).floor_bay || '',
    carStatus: (car as any).status || '',
    conditionOnArrival: (car as any).condition_on_arrival || 'New',
    shippingStatus: (car as any).shipping_status || 'not paid',
  });

  const handleSave = async () => {
    setSaving(true);
    const toNumber = (v: string) => (v === '' || v === 'N/A') ? null : (Number.isNaN(Number(v)) ? null : Number(v));
    const update = {
      customs_status: form.status,
      customs_cost: toNumber(form.customsCost || ''),
      shipping_cost: toNumber(form.shippingCost || ''),
      processed_by: form.processedBy || null,
      payment_date: form.paymentDate || null,
      customs_doc_ref: form.documentRef || null,
      customs_notes: form.notes || null,
      current_location: form.currentLocation || null,
      floor_bay: form.floorBay || null,
      status: form.carStatus || null,
      condition_on_arrival: form.conditionOnArrival || null,
      shipping_status: form.shippingStatus,
    } as Record<string, any>;

    try {
      await onCustomsUpdate(car.id, update);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating customs:', error);
      // Don't close dialog on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b border-gray-200 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Customs Management - {car.model}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-6 customs-dialog-content">
          <CustomsFormV2
            value={form}
            onChange={(patch) => setForm((s) => ({ ...s, ...patch }))}
            onSave={handleSave}
            saving={saving}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t flex-shrink-0 px-6 pb-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Update Customs Status'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomsManagementDialog;


