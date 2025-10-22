#!/usr/bin/env node

// Comprehensive data clearing script for Monza TECH
// This script clears ALL sample data from localStorage and provides a clean slate

console.log('🧹 COMPREHENSIVE DATA CLEARING - Monza TECH');
console.log('============================================');

// All possible localStorage keys that contain sample/mock data
const allDataKeys = [
  // Car inventories
  'carInventory', 'carInventoryData', 'realCarData', 'garageInventory', 
  'showroomFloor1', 'showroomFloor1Cars', 'showroomFloor2', 'showroomFloor2Cars',
  'garageCarInventory', 'garageCars', 'inventoryFloor2', 'inventoryFloor2Cars',
  
  // Schedule and repair data
  'garageSchedule', 'garageSchedules', 'garageScheduleHistory', 'repairHistory',
  'repairHistoryData', 'repairHistoryLogs', 'garageWorkflow',
  
  // Inventory and parts
  'inventoryItems', 'inventoryItemsData', 'partsInventory', 'partsManagement',
  'lowStockParts', 'orderedParts', 'orderedPartsData', 'orderedPartsManagement',
  'toolsEquipment',
  
  // Orders and logistics
  'orderedCars', 'orderedCarsData', 'orderedCarsManagement', 'deliveries',
  'shippingETA', 'newCarArrivals',
  
  // CRM and marketing
  'marketingCRM', 'marketingCRMData', 'marketingCRMLeads', 'crmLeads',
  'clientRequests', 'customerData', 'leads',
  
  // Sales and test drives
  'sales', 'testDrives', 'testDrivesData', 'testDriveLogs', 'mileageRecords',
  
  // Employee and user data
  'employees', 'userActivity', 'activities', 'timeTracking',
  
  // Financial data
  'financialData', 'kpiData', 'analyticsData',
  
  // Analytics and reports
  'analytics', 'businessActivityLogs', 'activityLogs', 'processLogs',
  
  // Dashboard data
  'dashboardData', 'dashboardSettings', 'enhancedDashboardData',
  
  // Settings and preferences
  'userPreferences', 'appSettings',
  
  // Network and security
  'networkData', 'securityLogs',
  
  // Backup and sync
  'backupData', 'syncData',
  
  // Tutorial and onboarding
  'monza_tutorial_completed', 'monza_tutorial_button_visible', 'monza_first_time_user',
  
  // Workflow data
  'workflowData',
  
  // Request and messaging data
  'requests', 'messages', 'channels', 'notifications',
  'request_notifications_cache',
  
  // Cache and temporary data
  'cached_data', 'temp_data', 'session_data'
];

// Keys to preserve (authentication and essential settings)
const preservedKeys = [
  'monza_auth_user',        // Keep authentication
  'monza_user_session',     // Keep session
  'app_language',           // Keep language preference
  'theme_preference'        // Keep theme preference
];

console.log('🔍 Scanning localStorage for data to clear...');
console.log(`📊 Found ${Object.keys(localStorage).length} total localStorage keys`);

let removedCount = 0;
let preservedCount = 0;
let currentKeys = Object.keys(localStorage);

// Remove all data keys
allDataKeys.forEach(key => {
  if (localStorage.getItem(key) !== null) {
    localStorage.removeItem(key);
    removedCount++;
    console.log(`   ✅ Removed: ${key}`);
  }
});

// Also remove any keys that look like data keys but aren't in our list
currentKeys.forEach(key => {
  if (!preservedKeys.includes(key) && localStorage.getItem(key) !== null) {
    // Check if it's likely a data key
    if (key.includes('data') || key.includes('Data') || 
        key.includes('inventory') || key.includes('Inventory') ||
        key.includes('cars') || key.includes('Cars') ||
        key.includes('garage') || key.includes('Garage') ||
        key.includes('repair') || key.includes('Repair') ||
        key.includes('schedule') || key.includes('Schedule') ||
        key.includes('sample') || key.includes('Sample') ||
        key.includes('mock') || key.includes('Mock') ||
        key.includes('test') || key.includes('Test')) {
      localStorage.removeItem(key);
      removedCount++;
      console.log(`   ✅ Removed (pattern match): ${key}`);
    }
  }
});

// Check what's preserved
preservedKeys.forEach(key => {
  if (localStorage.getItem(key) !== null) {
    preservedCount++;
    console.log(`   🔒 Preserved: ${key}`);
  }
});

// Clear sessionStorage as well
console.log('\n🧹 Clearing sessionStorage...');
const sessionCount = Object.keys(sessionStorage).length;
sessionStorage.clear();
console.log(`   ✅ Cleared ${sessionCount} sessionStorage items`);

// Summary
console.log('\n📊 CLEARING SUMMARY:');
console.log('==================');
console.log(`✅ Removed: ${removedCount} localStorage items`);
console.log(`🔒 Preserved: ${preservedCount} essential items`);
console.log(`🧹 Cleared: ${sessionCount} sessionStorage items`);
console.log(`📋 Remaining: ${Object.keys(localStorage).length} localStorage items`);

if (Object.keys(localStorage).length > preservedCount) {
  console.log('\n🔍 Remaining localStorage items:');
  Object.keys(localStorage).forEach(key => {
    console.log(`   📝 ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
  });
}

console.log('\n🎉 Data clearing completed!');
console.log('💡 Refresh your browser to see the clean application.');
console.log('⚠️  Note: Real company data should be loaded from Supabase, not localStorage.');
