// Browser Script to Clear All Mock Data
// Copy and paste this entire script into your browser console (F12) and press Enter

console.log('🧹 Clearing all mock data from browser storage...');

const mockDataKeys = [
  'carInventory', 'carInventoryData', 'garageInventory', 'showroomFloor1', 'showroomFloor2',
  'garageCarInventory', 'inventoryFloor2', 'garageSchedules', 'repairHistory',
  'inventoryItems', 'orderedCars', 'orderedParts', 'marketingCRM',
  'employees', 'financialData', 'testDrives', 'activities', 'mileageRecords', 
  'newCarArrivals', 'sales', 'analytics',
  'showroomFloor1Cars', 'showroomFloor2Cars', 'garageInventoryCars', 'inventoryFloor2Cars',
  'repairHistoryData', 'inventoryItemsData', 'orderedCarsData', 'orderedPartsData',
  'testDrivesData', 'marketingCRMData',
  'testDriveLogs', 'repairHistoryLogs', 'partsManagement', 'orderedPartsManagement',
  'orderedCarsManagement', 'marketingCRMLeads', 'garageCars'
];

let removedCount = 0;
mockDataKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    removedCount++;
    console.log('   ✅ Removed: ' + key);
  }
});

console.log('📊 Summary:');
console.log('   - Total keys checked: ' + mockDataKeys.length);
console.log('   - Keys removed: ' + removedCount);
console.log('   - Remaining localStorage keys: ' + Object.keys(localStorage).length);

if (removedCount > 0) {
  console.log('✅ Mock data clearing completed!');
  console.log('🔄 Please refresh the page to see changes');
} else {
  console.log('ℹ️ No mock data found to clear');
} 