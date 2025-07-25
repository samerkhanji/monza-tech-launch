console.log('🔧 Loading Button Fix Patch...');

// COMPREHENSIVE BUTTON FIX SYSTEM
function fixAllButtons() {
  console.log('🔧 Fixing all buttons...');
  
  const selectors = [
    'button',
    '[role="button"]',
    '.cursor-pointer',
    'input[type="submit"]',
    'input[type="button"]',
    '[data-radix-dropdown-menu-trigger]',
    '[data-radix-select-trigger]',
    '.badge[onclick]',
    '.badge.cursor-pointer',
    'td button',
    'th button'
  ];

  const buttons = document.querySelectorAll(selectors.join(', '));
  let fixed = 0;

  buttons.forEach((button, index) => {
    try {
      // Force enable pointer events
      button.style.setProperty('pointer-events', 'auto', 'important');
      button.style.setProperty('cursor', 'pointer', 'important');
      button.style.setProperty('position', 'relative', 'important');
      
      // Set proper z-index based on context
      const isInTable = button.closest('table');
      const isInDialog = button.closest('[data-radix-dialog-content]');
      
      if (isInDialog) {
        button.style.setProperty('z-index', '999999', 'important');
      } else if (isInTable) {
        button.style.setProperty('z-index', '9999', 'important');
      } else {
        button.style.setProperty('z-index', '999', 'important');
      }
      
      // Mobile improvements
      if (window.innerWidth <= 768) {
        button.style.setProperty('min-height', '44px', 'important');
        button.style.setProperty('min-width', '44px', 'important');
        button.style.setProperty('touch-action', 'manipulation', 'important');
      }
      
      // Add event handler if missing
      if (!button.hasAttribute('data-button-fixed')) {
        const handler = function(e) {
          console.log('🎯 Button clicked:', button.textContent?.trim() || 'No text');
          
          // Don't interfere with forms
          if (button.type === 'submit' || button.closest('form')) {
            return;
          }
          
          // Prevent bubbling issues
          e.stopPropagation();
          
          // Skip Radix components
          if (button.hasAttribute('data-radix-dropdown-menu-trigger') || 
              button.hasAttribute('data-radix-select-trigger')) {
            return;
          }
          
          // Dispatch synthetic event for React
          const syntheticEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          
          setTimeout(() => {
            button.dispatchEvent(syntheticEvent);
          }, 0);
        };
        
        button.addEventListener('click', handler, { capture: true });
        button.setAttribute('data-button-fixed', 'true');
      }
      
      fixed++;
    } catch (error) {
      console.warn('Button fix error:', error);
    }
  });

  console.log(`✅ Fixed ${fixed}/${buttons.length} buttons`);
  return { fixed, total: buttons.length };
}

// Test button functionality
function testButtons() {
  console.log('🧪 Testing buttons...');
  
  const buttons = document.querySelectorAll('button, [role="button"], .cursor-pointer');
  let working = 0, broken = 0;
  
  buttons.forEach((button) => {
    const rect = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);
    
    const isVisible = rect.width > 0 && rect.height > 0;
    const isClickable = style.pointerEvents !== 'none';
    const hasHandler = button.onclick || 
                      Object.keys(button).some(k => k.includes('react')) ||
                      button.hasAttribute('data-button-fixed');
    
    if (isVisible && isClickable && (hasHandler || button.disabled)) {
      working++;
      button.style.removeProperty('outline');
    } else {
      broken++;
      button.style.setProperty('outline', '2px solid red', 'important');
      button.title = 'BROKEN BUTTON: ' + (button.textContent?.trim() || 'No text');
    }
  });
  
  const successRate = buttons.length > 0 ? ((working / buttons.length) * 100).toFixed(1) : '0';
  console.log(`🧪 Results: ${working}/${buttons.length} working (${successRate}%)`);
  
  return { working, broken, total: buttons.length, successRate: parseFloat(successRate) };
}

// Monitor for new buttons
function startMonitoring() {
  console.log('👀 Starting button monitoring...');
  
  // Initial fix
  fixAllButtons();
  
  // Watch for new elements
  const observer = new MutationObserver(() => {
    setTimeout(fixAllButtons, 100);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Periodic testing
  setInterval(() => {
    const results = testButtons();
    if (results.successRate < 90) {
      console.log('⚠️ Button success rate low, applying fixes...');
      fixAllButtons();
    }
  }, 5000);
}

// Global functions
window.fixAllButtons = fixAllButtons;
window.testButtons = testButtons;
window.startMonitoring = startMonitoring;

// Auto-start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(startMonitoring, 1000);
  });
} else {
  setTimeout(startMonitoring, 1000);
}

console.log('✅ Button Fix Patch loaded - use fixAllButtons() or testButtons() in console'); 