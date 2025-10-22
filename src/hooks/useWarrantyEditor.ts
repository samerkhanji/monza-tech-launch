import { useState, useCallback } from 'react';

interface WarrantyData {
  warranty_life?: string | null;
  delivery_date?: string | null;
  vehicle_expiry_date?: string | null;
  battery_expiry_date?: string | null;
  dms_deadline_date?: string | null;
}

interface UseWarrantyEditorReturn {
  isWarrantyDialogOpen: boolean;
  selectedCarWarranty: WarrantyData | null;
  selectedCarId: string | null;
  selectedTableName: 'cars' | 'car_inventory' | 'garage_cars' | null;
  openWarrantyDialog: (carId: string, tableName: 'cars' | 'car_inventory' | 'garage_cars', warrantyData?: WarrantyData) => void;
  closeWarrantyDialog: () => void;
  handleWarrantySave: (warrantyData: any) => void;
}

export const useWarrantyEditor = (onWarrantyUpdate?: (carId: string, warrantyData: any) => void): UseWarrantyEditorReturn => {
  const [isWarrantyDialogOpen, setIsWarrantyDialogOpen] = useState(false);
  const [selectedCarWarranty, setSelectedCarWarranty] = useState<WarrantyData | null>(null);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedTableName, setSelectedTableName] = useState<'cars' | 'car_inventory' | 'garage_cars' | null>(null);

  const openWarrantyDialog = useCallback((
    carId: string, 
    tableName: 'cars' | 'car_inventory' | 'garage_cars', 
    warrantyData?: WarrantyData
  ) => {
    setSelectedCarId(carId);
    setSelectedTableName(tableName);
    setSelectedCarWarranty(warrantyData || null);
    setIsWarrantyDialogOpen(true);
  }, []);

  const closeWarrantyDialog = useCallback(() => {
    setIsWarrantyDialogOpen(false);
    setSelectedCarId(null);
    setSelectedTableName(null);
    setSelectedCarWarranty(null);
  }, []);

  const handleWarrantySave = useCallback((warrantyData: any) => {
    if (selectedCarId && onWarrantyUpdate) {
      onWarrantyUpdate(selectedCarId, warrantyData);
    }
    closeWarrantyDialog();
  }, [selectedCarId, onWarrantyUpdate, closeWarrantyDialog]);

  return {
    isWarrantyDialogOpen,
    selectedCarWarranty,
    selectedCarId,
    selectedTableName,
    openWarrantyDialog,
    closeWarrantyDialog,
    handleWarrantySave
  };
};
