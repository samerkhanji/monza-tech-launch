
import { toast } from '@/hooks/use-toast';
import { NewCarArrival } from '../types';

export const usePdiManagement = (
  newCars: NewCarArrival[],
  setNewCars: React.Dispatch<React.SetStateAction<NewCarArrival[]>>,
  technician: string,
  pdiNotes: string,
  setShowPdiForm: React.Dispatch<React.SetStateAction<boolean>>,
  setTechnician: React.Dispatch<React.SetStateAction<string>>,
  setPdiNotes: React.Dispatch<React.SetStateAction<string>>
) => {
  const handleAssignPdiTechnician = (carId: string) => {
    if (!technician.trim()) {
      toast({
        title: "Error",
        description: "Please enter the name of the technician who performed the PDI",
        variant: "destructive"
      });
      return;
    }
    
    setNewCars(prevCars => {
      const updatedCars = prevCars.map(car => 
        car.id === carId 
          ? { ...car, pdiPerformedBy: technician, notes: pdiNotes || car.notes } 
          : car
      );
      
      return updatedCars;
    });
    
    setShowPdiForm(false);
    setTechnician('');
    setPdiNotes('');
    
    toast({
      title: "PDI Completed",
      description: `PDI was performed by ${technician}`,
    });
  };

  return { handleAssignPdiTechnician };
};
