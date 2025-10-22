// Clear garage data from localStorage - Run this in browser console
console.log('Clearing garage data from localStorage...');

// Clear all garage-related localStorage keys
localStorage.removeItem('garageCars');
localStorage.removeItem('garageInventory');
localStorage.removeItem('garageSchedule');
localStorage.removeItem('garageSchedules');
localStorage.removeItem('inventoryGarage');

console.log('Garage data cleared successfully!');
console.log('Please refresh the page to see the changes.');

// Force page refresh
window.location.reload();
