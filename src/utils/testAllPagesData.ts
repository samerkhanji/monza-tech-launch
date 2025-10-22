import { safeLocalStorageGet } from '@/utils/errorHandling';

// Test utility to verify all pages have their data
export const testAllPagesData = () => {
  console.log('🔍 Testing All Pages Data...');
  
  const pageData = {
    // Car-related pages
    carInventory: safeLocalStorageGet<any[]>('carInventory', []),
    showroomFloor1: safeLocalStorageGet<any[]>('showroomFloor1Cars', []),
    showroomFloor2: safeLocalStorageGet<any[]>('showroomFloor2Cars', []),
    garageInventory: safeLocalStorageGet<any[]>('garageInventoryCars', []),
    inventoryFloor2: safeLocalStorageGet<any[]>('inventoryFloor2Cars', []),
    
    // Test drive pages
    testDrives: safeLocalStorageGet<any[]>('testDriveLogs', []),
    testDrivesData: safeLocalStorageGet<any[]>('testDrivesData', []),
    
    // Repair pages
    repairHistory: safeLocalStorageGet<any[]>('repairHistoryLogs', []),
    repairHistoryData: safeLocalStorageGet<any[]>('repairHistoryData', []),
    
    // Parts pages
    partsManagement: safeLocalStorageGet<any[]>('partsManagement', []),
    inventoryItems: safeLocalStorageGet<any[]>('inventoryItemsData', []),
    
    // Ordered items pages
    orderedParts: safeLocalStorageGet<any[]>('orderedPartsManagement', []),
    orderedPartsData: safeLocalStorageGet<any[]>('orderedPartsData', []),
    orderedCars: safeLocalStorageGet<any[]>('orderedCarsManagement', []),
    orderedCarsData: safeLocalStorageGet<any[]>('orderedCarsData', []),
    
    // Marketing pages
    marketingCRM: safeLocalStorageGet<any[]>('marketingCRMLeads', []),
    marketingCRMData: safeLocalStorageGet<any[]>('marketingCRMData', [])
  };
  
  console.log('📊 Page Data Summary:');
  console.log(`   🚗 Car Inventory: ${pageData.carInventory.length} cars`);
  console.log(`   🏢 Showroom Floor 1: ${pageData.showroomFloor1.length} cars`);
  console.log(`   🏢 Showroom Floor 2: ${pageData.showroomFloor2.length} cars`);
  console.log(`   🔧 Garage Inventory: ${pageData.garageInventory.length} cars`);
  console.log(`   📦 Inventory Floor 2: ${pageData.inventoryFloor2.length} cars`);
  console.log(`   🚗 Test Drives: ${pageData.testDrives.length} logs`);
  console.log(`   🔧 Repair History: ${pageData.repairHistory.length} repairs`);
  console.log(`   🔩 Parts Management: ${pageData.partsManagement.length} parts`);
  console.log(`   📦 Ordered Parts: ${pageData.orderedParts.length} orders`);
  console.log(`   🚗 Ordered Cars: ${pageData.orderedCars.length} orders`);
  console.log(`   📞 Marketing CRM: ${pageData.marketingCRM.length} leads`);
  
  // Check for empty pages
  const emptyPages = Object.entries(pageData)
    .filter(([key, data]) => data.length === 0)
    .map(([key]) => key);
  
  if (emptyPages.length > 0) {
    console.warn('⚠️ Empty pages detected:', emptyPages);
  } else {
    console.log('✅ All pages have data');
  }
  
  return pageData;
};

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).testAllPagesData = testAllPagesData;
  console.log('💡 You can now call testAllPagesData() from the browser console');
} 