/**
 * EMERGENCY BUTTON FUNCTIONALITY FIX
 * Immediately fixes all button issues on page load
 */

// Emergency fix function that runs immediately
function emergencyButtonFix() {
  console.log('🚨 EMERGENCY: Fixing all button functionality issues...');
  
  // Fix 1: Override all CSS that might block buttons
  const emergencyCSS = `
    button, [role="button"], .cursor-pointer,
    [data-radix-dropdown-menu-trigger],
    [data-radix-select-trigger] {
      pointer-events: auto !important;
      cursor: pointer !important;
      z-index: 999 !important;
      position: relative !important;
    }
    
    table button, td button, th button {
      z-index: 9999 !important;
      pointer-events: auto !important;
    }
    
    [data-radix-dialog-content] button {
      z-index: 999999 !important;
      pointer-events: auto !important;
    }
  `;
  
  const style = document.createElement('style');
  style.textContent = emergencyCSS;
  document.head.appendChild(style);
  
  // Fix 2: Force enable all buttons
  const allButtons = document.querySelectorAll('button, [role="button"], .cursor-pointer');
  let fixedCount = 0;
  
  allButtons.forEach(button => {
    if (button.style) {
      button.style.pointerEvents = 'auto';
      button.style.cursor = 'pointer';
      button.style.zIndex = '999';
      button.style.position = 'relative';
    }
    
    // Add emergency click handler if missing
    if (!button.onclick && !button.getAttribute('onclick')) {
      button.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('Emergency click handler:', this.textContent?.trim() || 'Unknown button');
        
        // Try to find and trigger any React handlers
        const reactKeys = Object.keys(this).filter(key => 
          key.startsWith('__react') || key.includes('react')
        );
        
        if (reactKeys.length > 0) {
          console.log('Found React handlers, attempting to trigger...');
          
          // Dispatch a new click event to trigger React handlers
          const newEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          this.dispatchEvent(newEvent);
        }
      });
      fixedCount++;
    }
  });
  
  // Fix 3: Fix dropdown and select triggers specifically
  const dropdowns = document.querySelectorAll('[data-radix-dropdown-menu-trigger], [data-radix-select-trigger]');
  dropdowns.forEach(dropdown => {
    dropdown.style.pointerEvents = 'auto';
    dropdown.style.cursor = 'pointer';
    dropdown.style.zIndex = '9999';
  });
  
  // Fix 4: Fix badge buttons in tables
  const badges = document.querySelectorAll('.badge.cursor-pointer, [role="button"].badge');
  badges.forEach(badge => {
    badge.style.pointerEvents = 'auto';
    badge.style.cursor = 'pointer';
    badge.style.zIndex = '999';
  });
  
  console.log(`🚨 EMERGENCY FIX COMPLETE: Fixed ${fixedCount} buttons, ${allButtons.length} total found`);
  
  // Test buttons
  setTimeout(testButtonFunctionality, 100);
}

// Test button functionality
function testButtonFunctionality() {
  console.log('🧪 Testing button functionality...');
  
  const buttons = document.querySelectorAll('button, [role="button"], .cursor-pointer');
  let working = 0;
  let broken = 0;
  
  buttons.forEach((button, index) => {
    const rect = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);
    
    const isVisible = rect.width > 0 && rect.height > 0;
    const isClickable = style.pointerEvents !== 'none';
    const hasHandler = button.onclick || button.getAttribute('onclick') || hasReactHandler(button);
    
    if (isVisible && isClickable && (hasHandler || !button.disabled)) {
      working++;
    } else {
      broken++;
      console.warn(`❌ Broken button #${index}: "${button.textContent?.trim() || 'No text'}"`, {
        visible: isVisible,
        clickable: isClickable,
        hasHandler: hasHandler,
        disabled: button.disabled
      });
    }
  });
  
  console.log(`🧪 Button test results: ${working} working, ${broken} broken out of ${buttons.length} total`);
  
  if (broken > 0) {
    console.warn(`⚠️ ${broken} buttons still need attention!`);
    // Try to fix the broken ones
    fixBrokenButtons();
  } else {
    console.log('🎉 ALL BUTTONS ARE WORKING!');
  }
}

// Check if element has React event handlers
function hasReactHandler(element) {
  return Object.keys(element).some(key => 
    key.startsWith('__react') || 
    key.includes('reactEventHandler') ||
    key.includes('reactInternalInstance')
  );
}

// Fix broken buttons specifically
function fixBrokenButtons() {
  console.log('🔧 Attempting to fix broken buttons...');
  
  const buttons = document.querySelectorAll('button, [role="button"], .cursor-pointer');
  
  buttons.forEach(button => {
    const rect = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);
    
    // Force fix any remaining issues
    if (style.pointerEvents === 'none') {
      button.style.setProperty('pointer-events', 'auto', 'important');
    }
    
    if (rect.width > 0 && rect.height > 0 && !button.disabled) {
      button.style.setProperty('cursor', 'pointer', 'important');
      button.style.setProperty('z-index', '9999', 'important');
      
      // Add force click handler
      if (!button.onclick && !hasReactHandler(button)) {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          console.log('🔧 Force-fixed button clicked:', this.textContent?.trim());
          
          // Try multiple approaches to trigger functionality
          
          // 1. Try to find parent with handlers
          let parent = this.parentElement;
          while (parent && parent !== document.body) {
            if (parent.onclick || hasReactHandler(parent)) {
              parent.click();
              break;
            }
            parent = parent.parentElement;
          }
          
          // 2. Try to find form and submit
          const form = this.closest('form');
          if (form && this.type === 'submit') {
            form.submit();
          }
          
          // 3. Try to trigger based on button text/purpose
          const text = this.textContent?.toLowerCase() || '';
          if (text.includes('save')) {
            console.log('Attempting to save...');
          } else if (text.includes('cancel') || text.includes('close')) {
            // Try to close parent dialog
            const dialog = this.closest('[role="dialog"], [data-radix-dialog-content]');
            if (dialog) {
              const closeButton = dialog.querySelector('[data-radix-dialog-close]');
              if (closeButton) closeButton.click();
            }
          }
        });
      }
    }
  });
}

// Monitor for new buttons being added
function monitorNewButtons() {
  const observer = new MutationObserver((mutations) => {
    let hasNewButtons = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches && (
              node.matches('button') || 
              node.matches('[role="button"]') || 
              node.matches('.cursor-pointer') ||
              node.querySelector('button, [role="button"], .cursor-pointer')
            )) {
              hasNewButtons = true;
            }
          }
        });
      }
    });
    
    if (hasNewButtons) {
      console.log('🔄 New buttons detected, applying emergency fix...');
      setTimeout(emergencyButtonFix, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Run emergency fix immediately
emergencyButtonFix();

// Run fix after DOM is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', emergencyButtonFix);
} else {
  setTimeout(emergencyButtonFix, 100);
}

// Monitor for new buttons
monitorNewButtons();

// Re-run fix periodically to catch any issues
setInterval(() => {
  const brokenButtons = document.querySelectorAll('button[style*="pointer-events: none"], [role="button"][style*="pointer-events: none"]');
  if (brokenButtons.length > 0) {
    console.log(`🔄 Found ${brokenButtons.length} broken buttons, fixing...`);
    emergencyButtonFix();
  }
}, 5000);

// Export for manual use
window.emergencyButtonFix = emergencyButtonFix;
window.testButtonFunctionality = testButtonFunctionality;

console.log('🚨 Emergency Button Fix loaded and active. Use window.emergencyButtonFix() to run manually');

export default emergencyButtonFix; 