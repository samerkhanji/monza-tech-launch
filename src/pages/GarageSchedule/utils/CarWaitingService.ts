import { safeLocalStorageGet } from '@/utils/errorHandling';

interface WaitingCar {
  id: string;
  vinNumber: string;
  model: string;
  issue: string;
  priority: 'high' | 'medium' | 'low';
  waitingSince: string;
  estimatedWork: number; // hours
  workType: 'electrical' | 'mechanic' | 'body_work' | 'painter' | 'detailer';
  clientName?: string;
  lastReminder?: string;
  location?: string;
}

export class CarWaitingService {
  private static readonly WAITING_CARS_KEY = 'carsWaitingForRepair';
  
  // Load cars waiting for repair from various sources
  static loadWaitingCars(): WaitingCar[] {
    // Load from dedicated waiting list
    const savedWaitingCars = this.getStoredWaitingCars();
    
    // Load from garage cars that need repair
    const garageCars = this.getGarageCarsNeedingRepair();
    
    // Load from showroom cars with issues
    const showroomCars = this.getShowroomCarsWithIssues();
    
    // Load from inventory cars marked for repair
    const inventoryCars = this.getInventoryCarsForRepair();
    
    // Combine all sources
    const allWaitingCars = [
      ...savedWaitingCars,
      ...garageCars,
      ...showroomCars,
      ...inventoryCars
    ];
    
    // Remove duplicates based on VIN
    const uniqueCars = this.removeDuplicatesByVin(allWaitingCars);
    
    // Sort by priority and waiting time
    return this.sortByPriorityAndTime(uniqueCars);
  }
  
  // Save a car to the waiting list
  static addCarToWaitingList(car: Omit<WaitingCar, 'id' | 'waitingSince'>): void {
    const waitingCars = this.getStoredWaitingCars();
    
    const newWaitingCar: WaitingCar = {
      ...car,
      id: `waiting-${Date.now()}`,
      waitingSince: new Date().toISOString().split('T')[0]
    };
    
    waitingCars.push(newWaitingCar);
    localStorage.setItem(this.WAITING_CARS_KEY, JSON.stringify(waitingCars));
  }
  
  // Remove a car from waiting list (when scheduled)
  static removeFromWaitingList(carId: string): void {
    const waitingCars = this.getStoredWaitingCars();
    const filteredCars = waitingCars.filter(car => car.id !== carId);
    localStorage.setItem(this.WAITING_CARS_KEY, JSON.stringify(filteredCars));
  }
  
  // Update reminder date
  static updateReminderDate(carId: string, date: string): void {
    const waitingCars = this.getStoredWaitingCars();
    const updatedCars = waitingCars.map(car => 
      car.id === carId ? { ...car, lastReminder: date } : car
    );
    localStorage.setItem(this.WAITING_CARS_KEY, JSON.stringify(updatedCars));
  }
  
  // Get high priority cars that need reminders
  static getHighPriorityCarsNeedingReminders(): WaitingCar[] {
    const today = new Date().toISOString().split('T')[0];
    const waitingCars = this.loadWaitingCars();
    
    return waitingCars.filter(car => 
      car.priority === 'high' && 
      (!car.lastReminder || car.lastReminder !== today)
    );
  }
  
  // Private helper methods
  private static getStoredWaitingCars(): WaitingCar[] {
    try {
      const stored = localStorage.getItem(this.WAITING_CARS_KEY);
      return stored ? JSON.parse(stored) : this.getDefaultWaitingCars();
    } catch (error) {
      console.error('Error loading waiting cars:', error);
      return this.getDefaultWaitingCars();
    }
  }
  
  private static getDefaultWaitingCars(): WaitingCar[] {
    return [
      {
        id: 'waiting-1',
        vinNumber: 'LNBSCPKV5GV123456',
        model: 'Voyah Free',
        issue: 'Battery diagnostics needed - intermittent power loss',
        priority: 'high',
        waitingSince: '2024-06-28',
        estimatedWork: 3,
        workType: 'electrical',
        clientName: 'Ahmed Al-Mansouri',
        location: 'Garage Bay 3'
      },
      {
        id: 'waiting-2',
        vinNumber: 'LNBSCPKV5GV789012',
        model: 'Voyah Dreamer',
        issue: 'Paint touch-up required on front bumper',
        priority: 'medium',
        waitingSince: '2024-06-29',
        estimatedWork: 4,
        workType: 'painter',
        clientName: 'Sara Al-Zahra',
        location: 'Showroom Floor 1'
      },
      {
        id: 'waiting-3',
        vinNumber: 'LNBSCPKV5GV345678',
        model: 'Voyah Free',
        issue: 'Suspension noise investigation - front left',
        priority: 'medium',
        waitingSince: '2024-06-25',
        estimatedWork: 2,
        workType: 'mechanic',
        clientName: 'Omar Khalil',
        location: 'Garage Bay 1'
      },
      {
        id: 'waiting-4',
        vinNumber: 'LNBSCPKV5GV456789',
        model: 'Voyah Dreamer',
        issue: 'Interior detailing and leather conditioning',
        priority: 'low',
        waitingSince: '2024-06-27',
        estimatedWork: 3,
        workType: 'detailer',
        clientName: 'Fatima Hassan',
        location: 'Car Inventory'
      },
      {
        id: 'waiting-5',
        vinNumber: 'LNBSCPKV5GV567890',
        model: 'Voyah Free',
        issue: 'Door panel alignment and body work',
        priority: 'high',
        waitingSince: '2024-06-26',
        estimatedWork: 6,
        workType: 'body_work',
        clientName: 'Ali Mohammed',
        location: 'Garage Bay 2'
      }
    ];
  }
  
  private static getGarageCarsNeedingRepair(): WaitingCar[] {
    try {
      const garageCars = safeLocalStorageGet<any[]>('garageCars', []);
      return garageCars
        .filter((car: any) => car.garageStatus === 'awaiting_parts' || car.garageStatus === 'stored')
        .map((car: any) => ({
          id: `garage-${car.id}`,
          vinNumber: car.vinNumber,
          model: car.model,
          issue: car.garageNotes || 'General maintenance required',
          priority: this.determinePriority(car),
          waitingSince: car.garageEntryDate || new Date().toISOString().split('T')[0],
          estimatedWork: 2,
          workType: this.determineWorkType(car),
          clientName: car.clientName,
          location: car.garageLocation || 'Garage'
        }));
    } catch (error) {
      console.error('Error loading garage cars:', error);
      return [];
    }
  }
  
  private static getShowroomCarsWithIssues(): WaitingCar[] {
    try {
      const showroom1Cars = safeLocalStorageGet<any[]>('showroomFloor1Cars', []);
      const showroom2Cars = safeLocalStorageGet<any[]>('showroomFloor2Cars', []);
      
      const allShowroomCars = [...showroom1Cars, ...showroom2Cars];
      
      return allShowroomCars
        .filter((car: any) => car.status === 'in_stock' && !car.pdiCompleted)
        .map((car: any) => ({
          id: `showroom-${car.id}`,
          vinNumber: car.vinNumber,
          model: car.model,
          issue: 'PDI completion required',
          priority: 'medium',
          waitingSince: car.arrivalDate || new Date().toISOString().split('T')[0],
          estimatedWork: 1,
          workType: 'mechanic' as const,
          clientName: car.clientName,
          location: car.currentFloor || 'Showroom'
        }));
    } catch (error) {
      console.error('Error loading showroom cars:', error);
      return [];
    }
  }
  
  private static getInventoryCarsForRepair(): WaitingCar[] {
    try {
      const inventoryCars = safeLocalStorageGet<any[]>('carInventory', []);
      
      return inventoryCars
        .filter((car: any) => car.status === 'in_stock' && car.batteryPercentage < 50)
        .map((car: any) => ({
          id: `inventory-${car.id}`,
          vinNumber: car.vinNumber,
          model: car.model,
          issue: `Battery charging needed (${car.batteryPercentage}%)`,
          priority: car.batteryPercentage < 20 ? 'high' : 'medium',
          waitingSince: car.arrivalDate || new Date().toISOString().split('T')[0],
          estimatedWork: 1,
          workType: 'electrical' as const,
          clientName: car.clientName,
          location: car.currentFloor || 'Car Inventory'
        }));
    } catch (error) {
      console.error('Error loading inventory cars:', error);
      return [];
    }
  }
  
  private static removeDuplicatesByVin(cars: WaitingCar[]): WaitingCar[] {
    const seen = new Set<string>();
    return cars.filter(car => {
      if (seen.has(car.vinNumber)) {
        return false;
      }
      seen.add(car.vinNumber);
      return true;
    });
  }
  
  private static sortByPriorityAndTime(cars: WaitingCar[]): WaitingCar[] {
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    
    return cars.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by waiting time (longer waiting time first)
      return new Date(a.waitingSince).getTime() - new Date(b.waitingSince).getTime();
    });
  }
  
  private static determinePriority(car: any): 'high' | 'medium' | 'low' {
    if (car.garageStatus === 'awaiting_parts') return 'high';
    if (car.batteryPercentage && car.batteryPercentage < 20) return 'high';
    if (car.clientName) return 'medium';
    return 'low';
  }
  
  private static determineWorkType(car: any): WaitingCar['workType'] {
    if (car.garageNotes?.toLowerCase().includes('electric') || car.batteryPercentage < 50) return 'electrical';
    if (car.garageNotes?.toLowerCase().includes('paint')) return 'painter';
    if (car.garageNotes?.toLowerCase().includes('body')) return 'body_work';
    if (car.garageNotes?.toLowerCase().includes('detail')) return 'detailer';
    return 'mechanic';
  }
} 