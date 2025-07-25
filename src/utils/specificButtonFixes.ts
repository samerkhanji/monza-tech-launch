// SPECIFIC BUTTON FIXES FOR IDENTIFIED ISSUES
export const applySpecificFixes = () => {
  console.log('🎯 Applying specific button fixes...');

  // Fix 1: Car Inventory Table Action Buttons
  const fixCarInventoryButtons = () => {
    const tableButtons = document.querySelectorAll(`
      table button,
      td button,
      th button,
      .table-container button,
      [class*="inventory"] button,
      [class*="car"] button
    `);

    tableButtons.forEach(button => {
      const btn = button as HTMLElement;
      
      // Force proper styling
      btn.style.setProperty('pointer-events', 'auto', 'important');
      btn.style.setProperty('cursor', 'pointer', 'important');
      btn.style.setProperty('z-index', '9999', 'important');
      btn.style.setProperty('position', 'relative', 'important');
      btn.style.setProperty('min-height', '32px', 'important');
      btn.style.setProperty('min-width', '32px', 'important');
      
      // Enhanced click handler for table buttons
      if (!btn.hasAttribute('data-table-fixed')) {
        const handler = (e: Event) => {
          console.log('🚗 Car inventory button clicked:', btn.textContent?.trim());
          e.stopPropagation();
          e.preventDefault();
          
          // Dispatch multiple event types
          setTimeout(() => {
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }, 0);
        };
        
        btn.addEventListener('click', handler, { capture: true });
        btn.setAttribute('data-table-fixed', 'true');
      }
    });
    
    console.log(`✅ Fixed ${tableButtons.length} table buttons`);
  };

  // Fix 2: Status Badge Buttons
  const fixStatusBadges = () => {
    const statusBadges = document.querySelectorAll(`
      .badge.cursor-pointer,
      .status-badge,
      [class*="status"] .badge,
      .badge[onclick]
    `);

    statusBadges.forEach(badge => {
      const bdg = badge as HTMLElement;
      
      bdg.style.setProperty('pointer-events', 'auto', 'important');
      bdg.style.setProperty('cursor', 'pointer', 'important');
      bdg.style.setProperty('z-index', '999', 'important');
      bdg.style.setProperty('user-select', 'none', 'important');
      
      if (!bdg.hasAttribute('data-badge-fixed')) {
        const handler = (e: Event) => {
          console.log('🏷️ Status badge clicked:', bdg.textContent?.trim());
          e.stopPropagation();
          e.preventDefault();
          
          setTimeout(() => {
            bdg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }, 0);
        };
        
        bdg.addEventListener('click', handler, { capture: true });
        bdg.setAttribute('data-badge-fixed', 'true');
      }
    });
    
    console.log(`✅ Fixed ${statusBadges.length} status badges`);
  };

  // Fix 3: Dialog Buttons
  const fixDialogButtons = () => {
    const dialogButtons = document.querySelectorAll(`
      [data-radix-dialog-content] button,
      .dialog button,
      [role="dialog"] button
    `);

    dialogButtons.forEach(button => {
      const btn = button as HTMLElement;
      
      btn.style.setProperty('pointer-events', 'auto', 'important');
      btn.style.setProperty('cursor', 'pointer', 'important');
      btn.style.setProperty('z-index', '999999', 'important');
      btn.style.setProperty('position', 'relative', 'important');
      
      if (!btn.hasAttribute('data-dialog-fixed')) {
        const handler = (e: Event) => {
          console.log('💬 Dialog button clicked:', btn.textContent?.trim());
          
          if ((btn as HTMLButtonElement).type === 'submit') {
            return; // Let form handle it
          }
          
          e.stopPropagation();
          
          setTimeout(() => {
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }, 0);
        };
        
        btn.addEventListener('click', handler, { capture: true });
        btn.setAttribute('data-dialog-fixed', 'true');
      }
    });
    
    console.log(`✅ Fixed ${dialogButtons.length} dialog buttons`);
  };

  // Fix 4: Dropdown/Select Triggers
  const fixDropdownTriggers = () => {
    const triggers = document.querySelectorAll(`
      [data-radix-dropdown-menu-trigger],
      [data-radix-select-trigger],
      .dropdown-trigger,
      .select-trigger
    `);

    triggers.forEach(trigger => {
      const trg = trigger as HTMLElement;
      
      trg.style.setProperty('pointer-events', 'auto', 'important');
      trg.style.setProperty('cursor', 'pointer', 'important');
      trg.style.setProperty('z-index', '999998', 'important');
      
      if (!trg.hasAttribute('data-dropdown-fixed')) {
        const handler = (e: Event) => {
          console.log('📋 Dropdown trigger clicked:', trg.textContent?.trim());
          // Let Radix handle these naturally
        };
        
        trg.addEventListener('click', handler, { capture: false });
        trg.setAttribute('data-dropdown-fixed', 'true');
      }
    });
    
    console.log(`✅ Fixed ${triggers.length} dropdown triggers`);
  };

  // Apply all fixes
  fixCarInventoryButtons();
  fixStatusBadges();
  fixDialogButtons();
  fixDropdownTriggers();
  
  console.log('🎯 All specific fixes applied!');
};

// Auto-apply fixes when DOM changes
let fixTimeout: NodeJS.Timeout;
const observer = new MutationObserver(() => {
  clearTimeout(fixTimeout);
  fixTimeout = setTimeout(applySpecificFixes, 100);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Apply immediately if DOM is ready
if (document.readyState !== 'loading') {
  setTimeout(applySpecificFixes, 500);
} else {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(applySpecificFixes, 500);
  });
}

// Make available globally
(window as any).applySpecificFixes = applySpecificFixes; 