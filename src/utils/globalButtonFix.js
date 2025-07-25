/**
 * Global Button Fix Script
 * Automatically fixes button reactivity issues across the entire application
 */

// Run on DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
  fixGlobalButtonReactivity();
});

// Also run after React hydration (for SPA)
if (typeof window !== 'undefined') {
  setTimeout(fixGlobalButtonReactivity, 100);
}

function fixGlobalButtonReactivity() {
  console.log('🔧 Fixing global button reactivity...');
  
  // Fix all buttons to ensure they're clickable
  const allButtons = document.querySelectorAll('button, [role="button"], .cursor-pointer');
  
  allButtons.forEach(button => {
    // Ensure button is clickable
    if (button.style) {
      button.style.pointerEvents = 'auto';
      button.style.cursor = 'pointer';
      button.style.userSelect = 'none';
    }
    
    // Add touch-action for mobile
    button.style.touchAction = 'manipulation';
    
    // Ensure z-index is appropriate
    if (button.closest('td') || button.closest('[role="gridcell"]')) {
      button.style.position = 'relative';
      button.style.zIndex = '1';
    }
  });
  
  // Fix dropdown triggers
  const dropdownTriggers = document.querySelectorAll('[data-radix-dropdown-menu-trigger]');
  dropdownTriggers.forEach(trigger => {
    if (trigger.style) {
      trigger.style.pointerEvents = 'auto';
      trigger.style.zIndex = '10';
    }
  });
  
  // Fix select triggers  
  const selectTriggers = document.querySelectorAll('[data-radix-select-trigger]');
  selectTriggers.forEach(trigger => {
    if (trigger.style) {
      trigger.style.pointerEvents = 'auto';
      trigger.style.cursor = 'pointer';
      trigger.style.zIndex = '10';
    }
  });
  
  // Fix badge buttons in tables
  const badgeButtons = document.querySelectorAll('td .cursor-pointer, [role="gridcell"] .cursor-pointer');
  badgeButtons.forEach(badge => {
    if (!badge.onclick && !badge.getAttribute('onclick')) {
      badge.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('Badge clicked:', this);
      });
    }
  });
  
  // Fix modal and dialog buttons
  const modalButtons = document.querySelectorAll('[data-radix-dialog-content] button');
  modalButtons.forEach(button => {
    if (button.style) {
      button.style.pointerEvents = 'auto';
      button.style.position = 'relative';
      button.style.zIndex = 'auto';
    }
  });
  
  // Fix file input buttons
  const fileButtons = document.querySelectorAll('button[type="button"]');
  fileButtons.forEach(button => {
    if (button.textContent && (
      button.textContent.includes('Upload') || 
      button.textContent.includes('Photo') ||
      button.textContent.includes('File')
    )) {
      button.style.pointerEvents = 'auto';
      button.style.cursor = 'pointer';
    }
  });
  
  console.log(`✅ Fixed ${allButtons.length} buttons for reactivity`);
}

// Add event delegation for dynamically added buttons
document.addEventListener('click', function(e) {
  const button = e.target.closest('button, [role="button"], .cursor-pointer');
  
  if (button && button.closest('td, [role="gridcell"]')) {
    // Stop event propagation for table cell buttons
    e.stopPropagation();
  }
}, true);

// Export for manual use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { fixGlobalButtonReactivity };
}
if (typeof window !== 'undefined') {
  window.fixGlobalButtonReactivity = fixGlobalButtonReactivity;
} 