// Comprehensive Mock Data Removal Script
// Copy and paste this entire script into your browser console (F12) and press Enter

console.log('🧹 Starting comprehensive mock data removal...');

// 1. Clear all localStorage
console.log('📦 Clearing localStorage...');
localStorage.clear();

// 2. Clear sessionStorage
console.log('📦 Clearing sessionStorage...');
sessionStorage.clear();

// 3. Remove specific flags that trigger data reloading
const flagsToRemove = [
  'realDataLoaded',
  'monza_tutorial_completed',
  'monza_tutorial_button_visible',
  'monza_first_time_user'
];

flagsToRemove.forEach(flag => {
  localStorage.removeItem(flag);
  sessionStorage.removeItem(flag);
});

// 4. Clear any cached data in memory (if accessible)
if (typeof window !== 'undefined') {
  // Clear any global data variables that might exist
  window.mockDataLoaded = false;
  window.hasLoadedRealData = false;
}

// 5. Clear IndexedDB if it exists
if ('indexedDB' in window) {
  console.log('🗄️ Clearing IndexedDB...');
  const deleteDB = indexedDB.deleteDatabase('monza-tech-db');
  deleteDB.onsuccess = () => console.log('✅ IndexedDB cleared');
  deleteDB.onerror = () => console.log('ℹ️ No IndexedDB to clear');
}

// 6. Clear cache storage if available
if ('caches' in window) {
  console.log('🧹 Clearing cache storage...');
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
    console.log('✅ Cache storage cleared');
  }).catch(() => console.log('ℹ️ No cache storage to clear'));
}

// 7. Final verification
setTimeout(() => {
  const remainingKeys = Object.keys(localStorage);
  console.log('📊 Final Check:');
  console.log(`   - localStorage keys remaining: ${remainingKeys.length}`);
  console.log(`   - sessionStorage keys remaining: ${Object.keys(sessionStorage).length}`);
  
  if (remainingKeys.length === 0) {
    console.log('🎉 SUCCESS: All mock data completely removed!');
    console.log('💡 Your application is now completely clean');
    console.log('🔄 Refresh the page to see the clean state');
  } else {
    console.log('⚠️ Some data still remains:', remainingKeys);
  }
}, 1000);

console.log('✅ Mock data removal completed!');
console.log('🔄 Please refresh your browser to see the clean application'); 