// Service for handling kilometers driven updates
// This will work with the current data structure and can be updated when the database migration is applied

export interface KilometersUpdate {
  carId: string;
  vinNumber: string;
  model: string;
  kilometersDriven: number;
  updatedAt: string;
  updatedBy?: string;
}

class KilometersService {
  private storageKey = 'monza_kilometers_updates';

  // Get kilometers driven for a car
  getKilometersDriven(carId: string): number {
    try {
      const updates = this.getStoredUpdates();
      const carUpdate = updates.find(update => update.carId === carId);
      return carUpdate?.kilometersDriven || 0;
    } catch (error) {
      console.error('Error getting kilometers driven:', error);
      return 0;
    }
  }

  // Update kilometers driven for a car
  updateKilometersDriven(carId: string, vinNumber: string, model: string, kilometers: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const updates = this.getStoredUpdates();
        
        // Find existing update or create new one
        const existingIndex = updates.findIndex(update => update.carId === carId);
        const update: KilometersUpdate = {
          carId,
          vinNumber,
          model,
          kilometersDriven: kilometers,
          updatedAt: new Date().toISOString(),
          updatedBy: 'current_user' // This can be updated when user auth is available
        };

        if (existingIndex >= 0) {
          updates[existingIndex] = update;
        } else {
          updates.push(update);
        }

        // Store updates
        localStorage.setItem(this.storageKey, JSON.stringify(updates));
        
        // TODO: When database migration is applied, update the database here
        // await supabase.from('cars').update({ kilometers_driven: kilometers }).eq('id', carId);
        
        resolve();
      } catch (error) {
        console.error('Error updating kilometers driven:', error);
        reject(error);
      }
    });
  }

  // Get all stored updates
  getStoredUpdates(): KilometersUpdate[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored updates:', error);
      return [];
    }
  }

  // Clear all stored updates (for testing)
  clearStoredUpdates(): void {
    localStorage.removeItem(this.storageKey);
  }

  // Get kilometers history for a car
  getKilometersHistory(carId: string): KilometersUpdate[] {
    const updates = this.getStoredUpdates();
    return updates.filter(update => update.carId === carId);
  }

  // Get all cars with kilometers data
  getAllCarsWithKilometers(): { carId: string; vinNumber: string; model: string; kilometersDriven: number }[] {
    const updates = this.getStoredUpdates();
    return updates.map(update => ({
      carId: update.carId,
      vinNumber: update.vinNumber,
      model: update.model,
      kilometersDriven: update.kilometersDriven
    }));
  }
}

export const kilometersService = new KilometersService(); 