import { Floor1Table } from './Floor1Table';
import { Floor2Table } from './Floor2Table';
import { CarInventoryTable } from './CarInventoryTable';
import { GarageScheduleTable } from './GarageScheduleTable';
import { OrderedCarsTable } from './OrderedCarsTable';
import { GarageInventoryTable } from './GarageInventoryTable';

export class DatabaseManager {
  // Floor 1 operations
  static async getFloor1Cars() {
    return await Floor1Table.getAllCars();
  }

  static async getFloor1Count() {
    return await Floor1Table.getCarCount();
  }

  static async addCarToFloor1(carId: string, notes?: string) {
    return await Floor1Table.addCar(carId, notes);
  }

  // Floor 2 operations
  static async getFloor2Cars() {
    return await Floor2Table.getAllCars();
  }

  static async getFloor2Count() {
    return await Floor2Table.getCarCount();
  }

  static async addCarToFloor2(carId: string, notes?: string) {
    return await Floor2Table.addCar(carId, notes);
  }

  // Car Inventory operations
  static async getInventoryCars() {
    return await CarInventoryTable.getAllCars();
  }

  static async getInventoryCount() {
    return await CarInventoryTable.getCarCount();
  }

  static async getTotalCarCount() {
    return await CarInventoryTable.getTotalCarCount();
  }

  // Garage Schedule operations
  static async getScheduledCars() {
    return await GarageScheduleTable.getAllScheduledCars();
  }

  static async getScheduledCount() {
    return await GarageScheduleTable.getScheduledCarCount();
  }

  static async addCarToSchedule(carData: any, notes?: string) {
    return await GarageScheduleTable.addCarToSchedule(carData, notes);
  }

  // Garage Inventory operations
  static async getGarageCars() {
    return await GarageInventoryTable.getAllCars();
  }

  static async getGarageCount() {
    return await GarageInventoryTable.getCarCount();
  }

  static async addCarToGarage(carId: string, notes?: string) {
    return await GarageInventoryTable.addCar(carId, notes);
  }

  // Ordered Cars operations
  static async getOrderedCars() {
    return await OrderedCarsTable.getAllOrderedCars();
  }

  static async getOrderedCount() {
    return await OrderedCarsTable.getOrderedCarCount();
  }

  // Move car between locations
  static async moveCar(carId: string, destination: string, notes?: string): Promise<boolean> {
    try {
      let success = false;
      
      switch (destination) {
        case 'floor1':
          success = await Floor1Table.addCar(carId, notes);
          break;
        case 'floor2':
          success = await Floor2Table.addCar(carId, notes);
          break;
        case 'garage':
          success = await GarageInventoryTable.addCar(carId, notes);
          break;
        case 'garage-schedule':
          // First add to garage inventory, then to schedule
          success = await GarageInventoryTable.addCar(carId, notes);
          if (success) {
            const carData = await CarInventoryTable.getCarById(carId);
            if (carData) {
              success = await GarageScheduleTable.addCarToSchedule(carData, notes);
            }
          }
          break;
        default:
          console.warn(`Unknown destination: ${destination}`);
          return false;
      }
      
      return success;
    } catch (error) {
      console.error('Error moving car:', error);
      return false;
    }
  }

  // Get all counts for dashboard
  static async getAllCounts() {
    try {
      const [
        inventoryCount,
        floor1Count,
        floor2Count,
        garageCount,
        scheduledCount,
        orderedCount
      ] = await Promise.all([
        CarInventoryTable.getCarCount(),
        Floor1Table.getCarCount(),
        Floor2Table.getCarCount(),
        GarageInventoryTable.getCarCount(),
        GarageScheduleTable.getScheduledCarCount(),
        OrderedCarsTable.getOrderedCarCount()
      ]);

      return {
        inventory: inventoryCount,
        floor1: floor1Count,
        floor2: floor2Count,
        garage: garageCount,
        scheduled: scheduledCount,
        ordered: orderedCount
      };
    } catch (error) {
      console.error('Error getting all counts:', error);
      return {
        inventory: 0,
        floor1: 0,
        floor2: 0,
        garage: 0,
        scheduled: 0,
        ordered: 0
      };
    }
  }

  // Clear all data from all locations (reset to inventory)
  static async clearAllLocations(): Promise<boolean> {
    try {
      const results = await Promise.all([
        Floor1Table.clearAllCars(),
        Floor2Table.clearAllCars(),
        GarageInventoryTable.clearAllCars(),
        GarageScheduleTable.clearAllScheduledCars()
      ]);

      return results.every(result => result === true);
    } catch (error) {
      console.error('Error clearing all locations:', error);
      return false;
    }
  }
}
