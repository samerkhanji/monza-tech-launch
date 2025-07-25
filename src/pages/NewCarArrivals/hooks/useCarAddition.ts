
import { toast } from 'sonner';
import { NewCarArrival, createNewCar } from '../types';

export const useCarAddition = (
  newCars: NewCarArrival[],
  setNewCars: React.Dispatch<React.SetStateAction<NewCarArrival[]>>,
  newVin: string,
  newModel: string,
  newColor: string,
  newNotes: string,
  newBatteryPercentage: number,
  vehicleCategory: 'EV' | 'REV' | 'ICEV' | 'Other',
  hasDamages: boolean,
  damageDescription: string,
  resetForm: () => void
) => {
  const handleAddNewCar = () => {
    if (!newVin || !newModel) {
      toast.error('Please fill in VIN and Model fields');
      return;
    }

    // Extract brand and model from the newModel string
    const parts = newModel.split(' ');
    const brand = parts[0] || 'Unknown';
    const model = parts.slice(1).join(' ') || newModel;

    const newCar = createNewCar({
      id: crypto.randomUUID(),
      vinNumber: newVin,
      model: model,
      year: new Date().getFullYear(),
      color: newColor,
      arrivalDate: new Date().toISOString(),
      brand: brand,
      vehicleCategory: vehicleCategory,
      notes: newNotes,
      batteryPercentage: vehicleCategory === 'EV' || vehicleCategory === 'REV' ? newBatteryPercentage : undefined,
      hasDamages: hasDamages,
      damageDescription: hasDamages ? damageDescription : undefined,
      damages: hasDamages && damageDescription ? [{
        id: crypto.randomUUID(),
        description: damageDescription,
        severity: 'minor' as const,
        location: 'General',
        timestamp: new Date().toISOString()
      }] : undefined
    });

    setNewCars(prev => [...prev, newCar]);
    resetForm();
    toast.success('New car arrival added successfully');
  };

  return { handleAddNewCar };
};
