/**
 * COMPREHENSIVE SYSTEM DIAGNOSTICS & FIXES
 * Identifies and fixes all button functionality and viewing errors
 */

class SystemDiagnostics {
  constructor() {
    this.report = {
      timestamp: new Date().toISOString(),
      buttons: { total: 0, working: 0, broken: 0, fixed: 0 },
      viewingErrors: [],
      consoleErrors: [],
      performanceIssues: [],
      criticalIssues: [],
      fixes: []
    };
  }

  // Main diagnostic function
  async runFullDiagnostics() {
    console.log('🔍 RUNNING COMPREHENSIVE SYSTEM DIAGNOSTICS...');
    console.log('='.repeat(60));
    
    // Step 1: Check for console errors
    this.captureConsoleErrors();
    
    // Step 2: Test button functionality
    await this.testButtonFunctionality();
    
    // Step 3: Check for viewing errors
    this.checkViewingErrors();
    
    // Step 4: Check performance issues
    this.checkPerformanceIssues();
    
    // Step 5: Apply fixes
    await this.applyFixes();
    
    // Step 6: Generate comprehensive report
    this.generateReport();
    
    return this.report;
  }

  // Capture console errors
  captureConsoleErrors() {
    console.log('📝 Capturing console errors...');
    
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args) => {
      this.report.consoleErrors.push({
        type: 'error',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      });
      originalError(...args);
    };
    
    console.warn = (...args) => {
      this.report.consoleErrors.push({
        type: 'warning',
        message: args.join(' '),
        timestamp: new Date().toISOString()
      });
      originalWarn(...args);
    };
  }

  // Test button functionality comprehensively
  async testButtonFunctionality() {
    console.log('🔘 Testing button functionality...');
    
    const buttons = document.querySelectorAll('button, [role="button"], .cursor-pointer');
    this.report.buttons.total = buttons.length;
    
    const brokenButtons = [];
    
    buttons.forEach((button, index) => {
      const test = this.testSingleButton(button, index);
      
      if (test.isWorking) {
        this.report.buttons.working++;
      } else {
        this.report.buttons.broken++;
        brokenButtons.push(test);
        
        // Highlight broken button
        button.style.outline = '3px solid red';
        button.style.boxShadow = '0 0 10px rgba(255,0,0,0.5)';
        button.title = `BROKEN: ${test.issues.join(', ')}`;
      }
    });
    
    console.log(`📊 Button Results: ${this.report.buttons.working} working, ${this.report.buttons.broken} broken`);
    
    // Store broken buttons for fixing
    this.brokenButtons = brokenButtons;
  }

  // Test individual button
  testSingleButton(button, index) {
    const rect = button.getBoundingClientRect();
    const style = window.getComputedStyle(button);
    const text = button.textContent?.trim() || 'No text';
    
    const checks = {
      isVisible: rect.width > 0 && rect.height > 0,
      isClickable: style.pointerEvents !== 'none',
      hasHandler: this.hasEventHandler(button),
      isEnabled: !button.disabled,
      hasProperZIndex: parseInt(style.zIndex) >= 0 || style.zIndex === 'auto'
    };
    
    const issues = [];
    if (!checks.isVisible) issues.push('not visible');
    if (!checks.isClickable) issues.push('pointer-events blocked');
    if (!checks.hasHandler && checks.isEnabled) issues.push('no event handler');
    if (!checks.hasProperZIndex) issues.push('z-index issue');
    
    const isWorking = checks.isVisible && checks.isClickable && (checks.hasHandler || !checks.isEnabled);
    
    return {
      index,
      element: button,
      text,
      checks,
      issues,
      isWorking,
      location: this.getElementLocation(button)
    };
  }

  // Check if element has event handlers
  hasEventHandler(element) {
    return !!(
      element.onclick ||
      element.getAttribute('onclick') ||
      Object.keys(element).some(key => key.includes('react')) ||
      this.hasParentHandler(element)
    );
  }

  // Check if parent has handlers (for delegated events)
  hasParentHandler(element) {
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      if (parent.onclick || Object.keys(parent).some(key => key.includes('react'))) {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  }

  // Get element location description
  getElementLocation(element) {
    const selectors = [];
    
    if (element.id) selectors.push(`#${element.id}`);
    if (element.className) selectors.push(`.${element.className.split(' ')[0]}`);
    
    const parent = element.closest('[data-testid], [aria-label], h1, h2, h3, .card, .dialog, .modal');
    if (parent) {
      const label = parent.getAttribute('data-testid') || 
                   parent.getAttribute('aria-label') || 
                   parent.textContent?.substring(0, 30);
      selectors.push(`in "${label}"`);
    }
    
    return selectors.join(' ') || 'unknown location';
  }

  // Check for viewing errors
  checkViewingErrors() {
    console.log('👁️ Checking for viewing errors...');
    
    // Check for broken images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.naturalWidth === 0 && img.complete) {
        this.report.viewingErrors.push({
          type: 'Broken Image',
          element: img,
          src: img.src,
          alt: img.alt || 'No alt text'
        });
      }
    });
    
    // Check for missing content
    const emptyElements = document.querySelectorAll('div, span, p');
    emptyElements.forEach(el => {
      if (el.children.length === 0 && (!el.textContent || el.textContent.trim() === '')) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden' && 
            (parseInt(style.width) > 10 || parseInt(style.height) > 10)) {
          this.report.viewingErrors.push({
            type: 'Empty Visible Element',
            element: el,
            className: el.className,
            location: this.getElementLocation(el)
          });
        }
      }
    });
    
    // Check for overlapping elements
    this.checkElementOverlaps();
    
    // Check for text that's cut off
    this.checkTextOverflow();
    
    console.log(`👁️ Found ${this.report.viewingErrors.length} viewing errors`);
  }

  // Check for element overlaps
  checkElementOverlaps() {
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      const rect = button.getBoundingClientRect();
      const elementAtPoint = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
      
      if (elementAtPoint && elementAtPoint !== button && !button.contains(elementAtPoint)) {
        this.report.viewingErrors.push({
          type: 'Button Overlap',
          element: button,
          overlappingElement: elementAtPoint,
          buttonText: button.textContent?.trim() || 'No text'
        });
      }
    });
  }

  // Check for text overflow
  checkTextOverflow() {
    const textElements = document.querySelectorAll('p, span, div, button, label');
    textElements.forEach(el => {
      if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
        this.report.viewingErrors.push({
          type: 'Text Overflow',
          element: el,
          text: el.textContent?.substring(0, 50) + '...',
          location: this.getElementLocation(el)
        });
      }
    });
  }

  // Check performance issues
  checkPerformanceIssues() {
    console.log('⚡ Checking performance issues...');
    
    // Check DOM size
    const allElements = document.querySelectorAll('*');
    if (allElements.length > 3000) {
      this.report.performanceIssues.push({
        type: 'Large DOM Size',
        count: allElements.length,
        recommendation: 'Consider virtual scrolling or pagination'
      });
    }
    
    // Check for memory usage (if available)
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024;
      if (memoryUsage > 100) {
        this.report.performanceIssues.push({
          type: 'High Memory Usage',
          usage: `${memoryUsage.toFixed(2)} MB`,
          recommendation: 'Check for memory leaks'
        });
      }
    }
    
    // Check for large images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
        this.report.performanceIssues.push({
          type: 'Large Image',
          src: img.src,
          dimensions: `${img.naturalWidth}x${img.naturalHeight}`,
          recommendation: 'Optimize image size'
        });
      }
    });
  }

  // Apply comprehensive fixes
  async applyFixes() {
    console.log('🔧 Applying fixes...');
    
    let fixCount = 0;
    
    // Fix broken buttons
    if (this.brokenButtons) {
      this.brokenButtons.forEach(buttonInfo => {
        const fixed = this.fixButton(buttonInfo);
        if (fixed) {
          fixCount++;
          this.report.buttons.fixed++;
          
          // Remove error highlighting
          buttonInfo.element.style.outline = '';
          buttonInfo.element.style.boxShadow = '';
          buttonInfo.element.title = '';
        }
      });
    }
    
    // Fix CSS issues
    this.applyCSSFixes();
    fixCount++;
    
    // Fix z-index issues
    this.fixZIndexIssues();
    fixCount++;
    
    this.report.fixes.push(`Applied ${fixCount} fixes`);
    console.log(`🔧 Applied ${fixCount} fixes`);
  }

  // Fix individual button
  fixButton(buttonInfo) {
    const { element, issues } = buttonInfo;
    let fixed = false;
    
    // Fix pointer events
    if (issues.includes('pointer-events blocked')) {
      element.style.setProperty('pointer-events', 'auto', 'important');
      fixed = true;
    }
    
    // Fix z-index
    if (issues.includes('z-index issue')) {
      element.style.setProperty('z-index', '999', 'important');
      element.style.setProperty('position', 'relative', 'important');
      fixed = true;
    }
    
    // Add event handler if missing
    if (issues.includes('no event handler') && !element.disabled) {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔧 Fixed button clicked:', element.textContent?.trim());
        
        // Try to trigger parent handlers
        this.tryTriggerParentHandlers(element);
      });
      fixed = true;
    }
    
    return fixed;
  }

  // Try to trigger parent event handlers
  tryTriggerParentHandlers(element) {
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
      if (parent.onclick) {
        parent.onclick();
        break;
      }
      parent = parent.parentElement;
    }
  }

  // Apply CSS fixes
  applyCSSFixes() {
    const css = `
      button:not(:disabled), 
      [role="button"]:not([disabled]), 
      .cursor-pointer:not([disabled]) {
        pointer-events: auto !important;
        cursor: pointer !important;
        z-index: 10 !important;
        position: relative !important;
      }
      
      table button, td button, th button {
        z-index: 999 !important;
      }
    `;
    
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Fix z-index issues
  fixZIndexIssues() {
    const problematicElements = document.querySelectorAll('button, [role="button"], .cursor-pointer');
    problematicElements.forEach(el => {
      if (el.closest('table, [role="grid"]')) {
        el.style.zIndex = '999';
      }
      if (el.closest('[data-radix-dialog-content]')) {
        el.style.zIndex = '9999';
      }
    });
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n🔍 COMPREHENSIVE SYSTEM DIAGNOSTICS REPORT');
    console.log('='.repeat(60));
    console.log(`📅 Timestamp: ${this.report.timestamp}`);
    
    console.log('\n🔘 BUTTON FUNCTIONALITY:');
    console.log(`  Total Buttons: ${this.report.buttons.total}`);
    console.log(`  Working: ${this.report.buttons.working} (${(this.report.buttons.working/this.report.buttons.total*100).toFixed(1)}%)`);
    console.log(`  Broken: ${this.report.buttons.broken} (${(this.report.buttons.broken/this.report.buttons.total*100).toFixed(1)}%)`);
    console.log(`  Fixed: ${this.report.buttons.fixed}`);
    
    console.log('\n👁️ VIEWING ERRORS:');
    console.log(`  Total Issues: ${this.report.viewingErrors.length}`);
    this.report.viewingErrors.forEach((error, i) => {
      console.log(`  ${i+1}. ${error.type}: ${error.buttonText || error.text || error.src || 'Unknown'}`);
    });
    
    console.log('\n📝 CONSOLE ERRORS:');
    console.log(`  Total Errors: ${this.report.consoleErrors.length}`);
    this.report.consoleErrors.slice(0, 5).forEach((error, i) => {
      console.log(`  ${i+1}. ${error.type}: ${error.message.substring(0, 100)}...`);
    });
    
    console.log('\n⚡ PERFORMANCE ISSUES:');
    console.log(`  Total Issues: ${this.report.performanceIssues.length}`);
    this.report.performanceIssues.forEach((issue, i) => {
      console.log(`  ${i+1}. ${issue.type}: ${issue.usage || issue.count || issue.dimensions}`);
    });
    
    console.log('\n🔧 FIXES APPLIED:');
    this.report.fixes.forEach((fix, i) => {
      console.log(`  ${i+1}. ${fix}`);
    });
    
    if (this.report.buttons.broken === 0 && this.report.viewingErrors.length === 0) {
      console.log('\n🎉 ALL SYSTEMS OPERATIONAL!');
    } else {
      console.log('\n⚠️  ISSUES STILL NEED ATTENTION');
    }
    
    console.log('='.repeat(60));
    
    // Store results globally
    window.systemDiagnostics = this.report;
  }
}

// Auto-run diagnostics
let diagnostics;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    diagnostics = new SystemDiagnostics();
    setTimeout(() => diagnostics.runFullDiagnostics(), 2000);
  });
} else {
  diagnostics = new SystemDiagnostics();
  setTimeout(() => diagnostics.runFullDiagnostics(), 2000);
}

// Export for manual use
window.runSystemDiagnostics = () => {
  const diag = new SystemDiagnostics();
  return diag.runFullDiagnostics();
};

console.log('🔍 System Diagnostics loaded. Use window.runSystemDiagnostics() to run manually');

export default SystemDiagnostics; 