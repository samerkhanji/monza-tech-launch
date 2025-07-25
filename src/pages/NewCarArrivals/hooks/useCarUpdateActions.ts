
import { NewCarArrival } from '../types';

export const useCarUpdateActions = (
  setNewCars: React.Dispatch<React.SetStateAction<NewCarArrival[]>>
) => {
  const handleUpdateNotes = (carId: string, notes: string) => {
    setNewCars(prevCars => 
      prevCars.map(car => 
        car.id === carId ? { ...car, notes } : car
      )
    );
  };

  const handleAddPhoto = (carId: string, photoUrl: string) => {
    setNewCars(prevCars => 
      prevCars.map(car => {
        if (car.id === carId) {
          const updatedPhotos = car.photos ? [...car.photos, photoUrl] : [photoUrl];
          return { ...car, photos: updatedPhotos };
        }
        return car;
      })
    );
  };

  return {
    handleUpdateNotes,
    handleAddPhoto
  };
};
