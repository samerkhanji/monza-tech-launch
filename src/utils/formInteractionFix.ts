// Form Interaction Fix Utility
// Actively removes any blocking overlays or interactions

export const initFormInteractionFix = () => {
  console.log('🔧 EMERGENCY INTERACTION FIX INITIALIZING (DISABLED TO PREVENT OVERLAY RESURRECTION)...');
  return; // DISABLED - This was causing overlays to keep coming back
  
  // IMMEDIATE EMERGENCY FIX
  document.body.style.setProperty('pointer-events', 'auto', 'important');
  document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
  
  // Remove any blocking overlays immediately
  const blockingElements = document.querySelectorAll('[style*="pointer-events: none"]:not([data-radix-dialog-overlay])');
  blockingElements.forEach(el => {
    (el as HTMLElement).style.setProperty('pointer-events', 'auto', 'important');
  });

  // Function to fix all interactive elements
  const fixInteractiveElements = () => {
    // EMERGENCY FIX - Fix ALL elements
    const allElements = document.querySelectorAll('*');
    allElements.forEach(element => {
      const el = element as HTMLElement;
      el.style.setProperty('pointer-events', 'auto', 'important');
      el.style.setProperty('user-select', 'auto', 'important');
      el.style.setProperty('cursor', 'auto', 'important');
    });

    // Fix all form elements specifically
    const formElements = document.querySelectorAll('form, input, select, textarea, button, [role="button"], a');
    formElements.forEach(element => {
      const el = element as HTMLElement;
      el.style.setProperty('pointer-events', 'auto', 'important');
      el.style.setProperty('user-select', 'auto', 'important');
      el.style.setProperty('cursor', 'pointer', 'important');
      
      // Remove any blocking attributes
      if (el.hasAttribute('inert')) {
        el.removeAttribute('inert');
      }
      
      // Fix opacity and visibility
      if (el.style.opacity === '0' && el.tagName !== 'DIV') {
        el.style.setProperty('opacity', '1', 'important');
      }
      
      if (el.style.visibility === 'hidden' && el.tagName !== 'DIV') {
        el.style.setProperty('visibility', 'visible', 'important');
      }
    });

    // Fix dialog content
    const dialogElements = document.querySelectorAll('[data-radix-dialog-content], [role="dialog"]');
    dialogElements.forEach(element => {
      const el = element as HTMLElement;
      el.style.setProperty('pointer-events', 'auto', 'important');
      el.style.setProperty('z-index', '1000001', 'important');
      
      // Fix all children
      const children = el.querySelectorAll('*');
      children.forEach(child => {
        const childEl = child as HTMLElement;
        childEl.style.setProperty('pointer-events', 'auto', 'important');
      });
    });

    // Remove blocking overlays that shouldn't be there
    const suspiciousOverlays = document.querySelectorAll('div[style*="pointer-events: none"]:not([data-radix-dialog-overlay]):not([data-overlay]):not(.sidebar-overlay)');
    suspiciousOverlays.forEach(overlay => {
      const overlayEl = overlay as HTMLElement;
      // Only remove if it's a full-screen overlay without proper dialog content
      if (overlayEl.style.position === 'fixed' && 
          overlayEl.style.inset === '0' && 
          !overlayEl.querySelector('[data-radix-dialog-content]') &&
          !overlayEl.querySelector('[role="dialog"]')) {
        console.log('🗑️ Removing blocking overlay:', overlayEl);
        overlayEl.remove();
      }
    });

    // Remove any blur effects
    document.querySelectorAll('*').forEach(element => {
      const el = element as HTMLElement;
      if (el.style.backdropFilter || el.style.filter) {
        el.style.setProperty('backdrop-filter', 'none', 'important');
        el.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
        el.style.setProperty('filter', 'none', 'important');
      }
    });

    // Fix body pointer events
    if (document.body.style.pointerEvents === 'none') {
      document.body.style.setProperty('pointer-events', 'auto', 'important');
      console.log('🔧 Fixed body pointer events');
    }

    // Fix html pointer events
    if (document.documentElement.style.pointerEvents === 'none') {
      document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
      console.log('🔧 Fixed html pointer events');
    }
  };

  // Run the fix immediately
  fixInteractiveElements();

  // Run the fix when DOM changes
  const observer = new MutationObserver((mutations) => {
    let shouldFix = false;
    
    mutations.forEach(mutation => {
      // Check if any dialogs or forms were added
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.matches('form, [role="dialog"], [data-radix-dialog-content]') ||
                element.querySelector('form, [role="dialog"], [data-radix-dialog-content]')) {
              shouldFix = true;
            }
          }
        });
      }
      
      // Check if style attributes changed
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const target = mutation.target as HTMLElement;
        if (target.style.pointerEvents === 'none' && 
            (target.matches('form, input, select, textarea, button') || 
             target.closest('form, [role="dialog"], [data-radix-dialog-content]'))) {
          shouldFix = true;
        }
      }
    });

    if (shouldFix) {
      // Debounce the fix
      setTimeout(fixInteractiveElements, 50);
    }
  });

  // Observe the entire document
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'aria-hidden', 'inert']
  });

  // Also run the fix on focus events (in case something gets blocked)
  document.addEventListener('focusin', (e) => {
    const target = e.target as HTMLElement;
    if (target && (target.matches('input, select, textarea, button') || target.closest('form'))) {
      if (target.style.pointerEvents === 'none') {
        target.style.setProperty('pointer-events', 'auto', 'important');
        console.log('🔧 Fixed pointer events on focus:', target);
      }
    }
  });

  // Run the fix periodically as a safety net
  setInterval(fixInteractiveElements, 5000);

  console.log('✅ Form interaction fix initialized');
};

// Export a function to manually trigger the fix
export const fixFormInteraction = () => {
  console.log('🚨 EMERGENCY MANUAL FIX RUNNING...');
  
  // Fix EVERYTHING
  const allElements = document.querySelectorAll('*');
  allElements.forEach(element => {
    const el = element as HTMLElement;
    el.style.setProperty('pointer-events', 'auto', 'important');
    el.style.setProperty('user-select', 'auto', 'important');
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('cursor', 'auto', 'important');
  });
  
  // Fix body and html
  document.body.style.setProperty('pointer-events', 'auto', 'important');
  document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
  
  console.log('🔧 EMERGENCY Manual fix applied to ALL elements');
};

// Make it globally available for emergency use
(window as any).emergencyFix = fixFormInteraction;
