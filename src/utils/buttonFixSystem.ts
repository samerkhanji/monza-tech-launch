// COMPREHENSIVE BUTTON FIX SYSTEM
// Resolves all button responsiveness issues across the application

export class ButtonFixSystem {
  private fixedButtons = new Set<Element>();
  private observer: MutationObserver | null = null;
  private isActive = false;

  constructor() {
    console.log('🔧 ButtonFixSystem initialized');
  }

  // Main fix function - applies all button fixes
  public fixAllButtons(): { fixed: number; total: number; errors: string[] } {
    console.log('🔧 Starting comprehensive button fix...');
    
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
      '[onclick]',
      'td button',
      'th button',
      '.action-button',
      '.status-badge.cursor-pointer'
    ];

    const buttons = document.querySelectorAll(selectors.join(', '));
    let fixed = 0;
    const errors: string[] = [];

    buttons.forEach((button, index) => {
      try {
        if (this.fixButton(button as HTMLElement)) {
          fixed++;
        }
      } catch (error) {
        errors.push(`Button ${index}: ${error}`);
        console.warn('Button fix error:', error);
      }
    });

    console.log(`🔧 Fixed ${fixed}/${buttons.length} buttons`);
    
    return {
      fixed,
      total: buttons.length,
      errors
    };
  }

  // Fix individual button
  private fixButton(button: HTMLElement): boolean {
    if (this.fixedButtons.has(button)) {
      return false; // Already fixed
    }

    // 1. Force enable pointer events
    button.style.setProperty('pointer-events', 'auto', 'important');
    button.style.setProperty('cursor', 'pointer', 'important');
    
    // 2. Ensure proper z-index
    const isInTable = button.closest('table, tbody, thead, tr, td, th');
    const isInDialog = button.closest('[data-radix-dialog-content]');
    const isInDropdown = button.closest('[data-radix-dropdown-menu-content]');
    
    if (isInDialog) {
      button.style.setProperty('z-index', '999999', 'important');
    } else if (isInDropdown) {
      button.style.setProperty('z-index', '999998', 'important');
    } else if (isInTable) {
      button.style.setProperty('z-index', '9999', 'important');
    } else {
      button.style.setProperty('z-index', '999', 'important');
    }
    
    // 3. Ensure proper positioning
    button.style.setProperty('position', 'relative', 'important');
    
    // 4. Mobile touch improvements
    if (this.isMobileDevice()) {
      button.style.setProperty('min-height', '44px', 'important');
      button.style.setProperty('min-width', '44px', 'important');
      button.style.setProperty('touch-action', 'manipulation', 'important');
    }
    
    // 5. Add comprehensive event handler
    this.addEventHandler(button);
    
    // 6. Mark as fixed
    button.setAttribute('data-button-fixed', 'true');
    this.fixedButtons.add(button);
    
    return true;
  }

  // Add comprehensive event handler
  private addEventHandler(button: HTMLElement): void {
    // Remove existing handlers to prevent duplicates
    const existingHandler = (button as any).__buttonFixHandler;
    if (existingHandler) {
      button.removeEventListener('click', existingHandler, true);
    }

    const handler = (e: Event) => {
      console.log('🎯 Button clicked:', {
        text: button.textContent?.trim() || 'No text',
        id: button.id || 'No ID',
        classes: button.className || 'No classes',
        type: (button as HTMLButtonElement).type || 'No type'
      });

      // Don't interfere with forms
      if ((button as HTMLButtonElement).type === 'submit' || button.closest('form')) {
        console.log('✅ Form button - allowing normal behavior');
        return;
      }

      // Prevent event bubbling issues
      e.stopPropagation();

      // Handle special button types
      if (button.hasAttribute('data-radix-dropdown-menu-trigger')) {
        console.log('📋 Dropdown trigger clicked');
        // Let Radix handle dropdown
        return;
      }

      if (button.hasAttribute('data-radix-select-trigger')) {
        console.log('🔽 Select trigger clicked');
        // Let Radix handle select
        return;
      }

      // For regular buttons, dispatch synthetic React event
      try {
        const syntheticEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          detail: 1
        });
        
        button.dispatchEvent(syntheticEvent);
        console.log('✅ Synthetic event dispatched');
      } catch (error) {
        console.warn('❌ Failed to dispatch synthetic event:', error);
      }
    };

    // Store handler reference
    (button as any).__buttonFixHandler = handler;
    
    // Add event listener with capture
    button.addEventListener('click', handler, { capture: true, passive: false });
  }

  // Test button functionality
  public testButtons(): {
    working: number;
    broken: number;
    total: number;
    successRate: number;
    brokenButtons: Array<{
      text: string;
      id: string;
      classes: string;
      issues: string[];
    }>;
  } {
    console.log('🧪 Testing button functionality...');
    
    const buttons = document.querySelectorAll(`
      button, [role="button"], .cursor-pointer,
      input[type="submit"], input[type="button"]
    `);
    
    let working = 0;
    let broken = 0;
    const brokenButtons: any[] = [];

    buttons.forEach((button) => {
      const issues = this.checkButtonIssues(button as HTMLElement);
      
      if (issues.length === 0) {
        working++;
        // Remove error styling
        (button as HTMLElement).style.removeProperty('outline');
        (button as HTMLElement).style.removeProperty('box-shadow');
      } else {
        broken++;
        // Add error styling
        (button as HTMLElement).style.setProperty('outline', '2px solid red', 'important');
        (button as HTMLElement).style.setProperty('box-shadow', '0 0 8px rgba(255,0,0,0.6)', 'important');
        
        brokenButtons.push({
          text: button.textContent?.trim() || 'No text',
          id: (button as HTMLElement).id || 'No ID',
          classes: (button as HTMLElement).className || 'No classes',
          issues
        });
      }
    });

    const total = buttons.length;
    const successRate = total > 0 ? (working / total) * 100 : 0;

    console.log(`🧪 Test Results: ${working}/${total} working (${successRate.toFixed(1)}%)`);
    
    if (brokenButtons.length > 0) {
      console.log('❌ Broken buttons:', brokenButtons);
    }

    return {
      working,
      broken,
      total,
      successRate,
      brokenButtons
    };
  }

  // Check for button issues
  private checkButtonIssues(button: HTMLElement): string[] {
    const issues: string[] = [];
    
    // Check visibility
    const rect = button.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      issues.push('Not visible');
    }
    
    // Check pointer events
    const style = window.getComputedStyle(button);
    if (style.pointerEvents === 'none') {
      issues.push('Pointer events disabled');
    }
    
    // Check if disabled
    const buttonEl = button as HTMLButtonElement;
    if (buttonEl.disabled) {
      issues.push('Button disabled');
    }
    
    // Check for event handlers
    const hasReactHandler = Object.keys(button).some(k => k.includes('react'));
    const hasOnClick = buttonEl.onclick !== null;
    const hasFixedHandler = button.hasAttribute('data-button-fixed');
    
    if (!hasReactHandler && !hasOnClick && !hasFixedHandler) {
      issues.push('No event handler');
    }

    // Check mobile touch size
    if (this.isMobileDevice()) {
      if (rect.width < 44 || rect.height < 44) {
        issues.push('Too small for touch');
      }
    }
    
    return issues;
  }

  // Start monitoring for new buttons
  public startMonitoring(): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    console.log('👀 Starting button monitoring...');

    // Initial fix
    this.fixAllButtons();

    // Monitor for new elements
    this.observer = new MutationObserver((mutations) => {
      let needsFix = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (this.isButton(element) || element.querySelector('button, [role="button"], .cursor-pointer')) {
                needsFix = true;
              }
            }
          });
        }
      });

      if (needsFix) {
        setTimeout(() => this.fixAllButtons(), 100);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Periodic maintenance
    setInterval(() => {
      const results = this.testButtons();
      if (results.successRate < 90) {
        console.log('⚠️ Button success rate below 90%, applying fixes...');
        this.fixAllButtons();
      }
    }, 10000); // Every 10 seconds
  }

  // Stop monitoring
  public stopMonitoring(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.isActive = false;
    console.log('🛑 Button monitoring stopped');
  }

  // Check if element is a button
  private isButton(element: Element): boolean {
    return element.matches(`
      button, [role="button"], .cursor-pointer,
      input[type="submit"], input[type="button"],
      [data-radix-dropdown-menu-trigger],
      [data-radix-select-trigger]
    `);
  }

  // Detect mobile device
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }

  // Emergency reset
  public emergencyReset(): void {
    console.log('🚨 Emergency button reset...');
    
    // Clear all fixed buttons
    this.fixedButtons.clear();
    
    // Remove all our custom styling
    document.querySelectorAll('[data-button-fixed]').forEach(button => {
      button.removeAttribute('data-button-fixed');
      (button as HTMLElement).style.removeProperty('pointer-events');
      (button as HTMLElement).style.removeProperty('cursor');
      (button as HTMLElement).style.removeProperty('z-index');
      (button as HTMLElement).style.removeProperty('position');
      (button as HTMLElement).style.removeProperty('outline');
      (button as HTMLElement).style.removeProperty('box-shadow');
    });
    
    // Re-apply fixes
    setTimeout(() => this.fixAllButtons(), 100);
  }
}

// Create global instance
const buttonFixSystem = new ButtonFixSystem();

// Global functions for console access
(window as any).fixAllButtons = () => buttonFixSystem.fixAllButtons();
(window as any).testButtons = () => buttonFixSystem.testButtons();
(window as any).startButtonMonitoring = () => buttonFixSystem.startMonitoring();
(window as any).stopButtonMonitoring = () => buttonFixSystem.stopMonitoring();
(window as any).emergencyButtonReset = () => buttonFixSystem.emergencyReset();

export default buttonFixSystem; 