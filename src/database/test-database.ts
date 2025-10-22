import { DatabaseManager } from './DatabaseManager';

export async function testDatabaseTables() {
  console.log('🧪 Testing Database Tables...');
  
  try {
    // Test getting all counts
    console.log('📊 Getting all counts...');
    const counts = await DatabaseManager.getAllCounts();
    console.log('Counts:', counts);
    
    // Test getting floor 1 cars
    console.log('🏢 Getting Floor 1 cars...');
    const floor1Cars = await DatabaseManager.getFloor1Cars();
    console.log('Floor 1 cars:', floor1Cars.length);
    
    // Test getting floor 2 cars
    console.log('🏢 Getting Floor 2 cars...');
    const floor2Cars = await DatabaseManager.getFloor2Cars();
    console.log('Floor 2 cars:', floor2Cars.length);
    
    // Test getting inventory cars
    console.log('📦 Getting Inventory cars...');
    const inventoryCars = await DatabaseManager.getInventoryCars();
    console.log('Inventory cars:', inventoryCars.length);
    
    // Test getting garage cars
    console.log('🔧 Getting Garage cars...');
    const garageCars = await DatabaseManager.getGarageCars();
    console.log('Garage cars:', garageCars.length);
    
    // Test getting scheduled cars
    console.log('📅 Getting Scheduled cars...');
    const scheduledCars = await DatabaseManager.getScheduledCars();
    console.log('Scheduled cars:', scheduledCars.length);
    
    // Test getting ordered cars
    console.log('🛒 Getting Ordered cars...');
    const orderedCars = await DatabaseManager.getOrderedCars();
    console.log('Ordered cars:', orderedCars.length);
    
    console.log('✅ Database test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testDatabaseTables = testDatabaseTables;
}
