
import { GarageCar } from '../types';
import { toast } from '@/hooks/use-toast';

export const useMechanicManagement = (
  cars: GarageCar[], 
  setCars: React.Dispatch<React.SetStateAction<GarageCar[]>>
) => {
  const changeMechanics = (car: GarageCar, mechanics: string[], reason: string) => {
    const now = new Date();
    const nowISOString = now.toISOString();
    
    const updatedCars = cars.map(c => {
      if (c.id === car.id) {
        return {
          ...c, 
          mechanics,
          lastUpdated: nowISOString,
          // Add a note about the mechanic change in work notes
          workNotes: c.workNotes 
            ? `${c.workNotes}\n\n[${nowISOString}] Mechanics changed: ${mechanics.join(', ')}. Reason: ${reason}`
            : `[${nowISOString}] Mechanics assigned: ${mechanics.join(', ')}. Reason: ${reason}`
        };
      }
      return c;
    });
    
    setCars(updatedCars);
    
    // Save to localStorage
    localStorage.setItem('garageCars', JSON.stringify(updatedCars));
    
    toast({
      title: "Mechanics Updated",
      description: `${car.carCode} mechanics changed: ${mechanics.join(', ')}`
    });
  };

  return {
    changeMechanics
  };
};
