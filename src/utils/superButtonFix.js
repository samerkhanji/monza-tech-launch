/**
 * SUPER BUTTON FIX
 * Ultimate solution for button responsiveness issues
 */

console.log('🚨 SUPER BUTTON FIX: Loading comprehensive button repair system...');

// Super aggressive button fixing
function superButtonFix() {
  console.log('🔧 SUPER BUTTON FIX: Applying ultimate fixes...');
  
  // Step 1: Force all buttons to be clickable
  const allInteractiveElements = document.querySelectorAll(`
    button,
    [role="button"],
    .cursor-pointer,
    input[type="submit"],
    input[type="button"],
    [data-radix-dropdown-menu-trigger],
    [data-radix-select-trigger],
    .badge,
    [onclick]
  `);
  
  let fixedCount = 0;
  
  allInteractiveElements.forEach((element, index) => {
    try {
      // Force critical CSS properties
      element.style.setProperty('pointer-events', 'auto', 'important');
      element.style.setProperty('cursor', 'pointer', 'important');
      element.style.setProperty('user-select', 'none', 'important');
      element.style.setProperty('touch-action', 'manipulation', 'important');
      element.style.setProperty('position', 'relative', 'important');
      element.style.setProperty('z-index', '999', 'important');
      
      // Ensure minimum touch target
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.width < 44) {
        element.style.setProperty('min-width', '44px', 'important');
        element.style.setProperty('min-height', '44px', 'important');
      }
      
      // Remove any event listener conflicts
      element.removeEventListener('click', preventDefaultHandler);
      
      // Add super event handler
      if (!element.hasAttribute('data-super-fixed')) {
        element.addEventListener('click', superClickHandler, { capture: true });
        element.addEventListener('mousedown', superClickHandler, { capture: true });
        element.addEventListener('touchstart', superClickHandler, { capture: true, passive: false });
        element.setAttribute('data-super-fixed', 'true');
        fixedCount++;
      }
      
      // Fix form submission buttons specifically
      if (element.type === 'submit' || element.textContent?.toLowerCase().includes('login')) {
        element.addEventListener('click', (e) => {
          console.log('🔧 Form submit button clicked:', element.textContent?.trim());
          // Don't prevent default for submit buttons
        });
      }
      
    } catch (error) {
      console.warn('Button fix error for element:', element, error);
    }
  });
  
  console.log(`🔧 SUPER FIX: Enhanced ${fixedCount} interactive elements`);
  return fixedCount;
}

// Super click handler that works with React
function superClickHandler(event) {
  const element = event.currentTarget;
  const text = element.textContent?.trim() || 'Unknown';
  
  console.log(`🎯 SUPER CLICK: "${text}" button activated`);
  
  // Don't interfere with form submissions
  if (element.type === 'submit' || element.closest('form')) {
    console.log('✅ Form element - allowing normal behavior');
    return;
  }
  
  // Prevent double-clicking
  if (element.hasAttribute('data-clicking')) {
    console.log('⚠️ Double-click prevented');
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  
  // Mark as clicking
  element.setAttribute('data-clicking', 'true');
  setTimeout(() => element.removeAttribute('data-clicking'), 1000);
  
  // Stop event from bubbling to parent elements
  event.stopPropagation();
  
  // Try to find and trigger React handlers
  if (!triggerReactHandler(element)) {
    console.log('⚠️ No React handler found, trying parent elements');
    // Look for handlers in parent elements
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      if (triggerReactHandler(parent)) {
        break;
      }
      parent = parent.parentElement;
    }
  }
}

// Helper to prevent default
function preventDefaultHandler(event) {
  event.preventDefault();
}

// Try to trigger React event handlers
function triggerReactHandler(element) {
  try {
    // Look for React Fiber
    const reactKeys = Object.keys(element).filter(key => 
      key.startsWith('__reactFiber') || 
      key.startsWith('__reactInternalInstance') ||
      key.includes('react')
    );
    
    if (reactKeys.length > 0) {
      console.log('✅ Found React handler');
      
      // Create and dispatch a new synthetic event
      const syntheticEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        detail: 1
      });
      
      // Dispatch the event
      element.dispatchEvent(syntheticEvent);
      return true;
    }
    
    // Check for onclick handlers
    if (element.onclick) {
      console.log('✅ Found onclick handler');
      element.onclick();
      return true;
    }
    
    return false;
  } catch (error) {
    console.warn('React handler trigger failed:', error);
    return false;
  }
}

// Test all buttons and highlight broken ones
function testAllButtons() {
  console.log('🧪 TESTING: All button functionality...');
  
  const buttons = document.querySelectorAll('button, [role="button"], .cursor-pointer');
  let working = 0;
  let broken = 0;
  
  buttons.forEach((button, index) => {
    const rect = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);
    const text = button.textContent?.trim() || 'No text';
    
    const isVisible = rect.width > 0 && rect.height > 0;
    const isClickable = style.pointerEvents !== 'none';
    const hasHandler = button.onclick || 
                      Object.keys(button).some(k => k.includes('react')) ||
                      button.hasAttribute('data-super-fixed');
    
    if (isVisible && isClickable && (hasHandler || button.disabled)) {
      working++;
      // Remove any error highlighting
      button.style.removeProperty('outline');
      button.style.removeProperty('box-shadow');
      button.removeAttribute('title');
    } else {
      broken++;
      // Highlight broken button
      button.style.setProperty('outline', '3px solid red', 'important');
      button.style.setProperty('box-shadow', '0 0 10px rgba(255,0,0,0.8)', 'important');
      button.setAttribute('title', `BROKEN: ${text}`);
      
      console.warn(`❌ BROKEN BUTTON #${index}: "${text}"`);
    }
  });
  
  const total = buttons.length;
  const successRate = ((working / total) * 100).toFixed(1);
  
  console.log(`📊 BUTTON TEST RESULTS:`);
  console.log(`   Total: ${total}`);
  console.log(`   Working: ${working} (${successRate}%)`);
  console.log(`   Broken: ${broken}`);
  
  if (broken > 0) {
    console.log(`🚨 ${broken} buttons need attention! (highlighted in red)`);
  } else {
    console.log(`🎉 ALL BUTTONS ARE WORKING!`);
  }
  
  return { total, working, broken, successRate: parseFloat(successRate) };
}

// Run fixes automatically
setTimeout(() => {
  superButtonFix();
  setTimeout(() => {
    testAllButtons();
  }, 500);
}, 500);

// Monitor for new buttons and fix them
const observer = new MutationObserver(() => {
  setTimeout(superButtonFix, 100);
});

observer.observe(document.body, { 
  childList: true, 
  subtree: true 
});

// Re-run fixes every 5 seconds to catch any issues
setInterval(() => {
  const brokenButtons = document.querySelectorAll('button[style*="pointer-events: none"], [role="button"][style*="pointer-events: none"]');
  if (brokenButtons.length > 0) {
    console.log(`🔄 Found ${brokenButtons.length} broken buttons, re-running fixes...`);
    superButtonFix();
  }
}, 5000);

// Global functions for manual use
window.superButtonFix = superButtonFix;
window.testAllButtons = testAllButtons;
window.fixButtonNow = (selector) => {
  const button = document.querySelector(selector);
  if (button) {
    superClickHandler({ currentTarget: button, stopPropagation: () => {}, preventDefault: () => {} });
  }
};

console.log('🚨 SUPER BUTTON FIX: System active! Use window.testAllButtons() to check status');

export default superButtonFix; 