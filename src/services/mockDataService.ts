/**
 * MOCK DATA SERVICE
 * Injects comprehensive test data into localStorage for testing
 */

// import { mockData, mockCarsInventory, mockEmployees, mockParts } from '../data/mockData';

// Mock data placeholders
const mockCarsInventory: Array<{
  id: string;
  vinNumber: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  status: string;
  [key: string]: unknown;
}> = [];
const mockEmployees: Array<{
  id: string;
  name: string;
  role: string;
  email: string;
  [key: string]: unknown;
}> = [];
const mockParts: Array<{
  id: string;
  partNumber: string;
  partName: string;
  category: string;
  [key: string]: unknown;
}> = [];

class MockDataService {
  private isInitialized = false;

  // Initialize all mock data
  public initializeMockData(force = false): void {
    if (this.isInitialized && !force) {
      console.log('📋 Mock data already initialized');
      return;
    }

    console.log('🚀 Initializing comprehensive mock data...');

    try {
      // Cars Inventory
      this.setCarInventoryData();
      
      // Employee Data
      this.setEmployeeData();
      
      // Parts Inventory
      this.setPartsData();

      this.isInitialized = true;
      console.log('✅ Mock data initialization complete!');
      
    } catch (error) {
      console.error('❌ Error initializing mock data:', error);
    }
  }

  // Set car inventory data
  private setCarInventoryData(): void {
    localStorage.setItem('cars', JSON.stringify(mockCarsInventory));
    localStorage.setItem('CarInventory_cars', JSON.stringify(mockCarsInventory));
    console.log(`📋 Cars data set: ${mockCarsInventory.length} vehicles`);
  }

  // Set employee data
  private setEmployeeData(): void {
    localStorage.setItem('employees', JSON.stringify(mockEmployees));
    localStorage.setItem('currentUser', JSON.stringify(mockEmployees[0]));
    console.log(`👥 Employee data set: ${mockEmployees.length} employees`);
  }

  // Set parts data
  private setPartsData(): void {
    localStorage.setItem('parts', JSON.stringify(mockParts));
    console.log(`🔧 Parts data set: ${mockParts.length} parts`);
  }
}

// Export singleton instance
export const mockDataService = new MockDataService();

// Auto-initialize on import
if (typeof window !== 'undefined') {
  mockDataService.initializeMockData();
  (window as { mockDataService?: MockDataService }).mockDataService = mockDataService;
}

export default mockDataService; 