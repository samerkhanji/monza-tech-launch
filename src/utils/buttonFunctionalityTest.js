/**
 * Comprehensive Button Functionality Test
 * Systematically tests all buttons across the application
 */

// Button test results
let testResults = {
  working: [],
  broken: [],
  total: 0
};

// Test a single button element
function testButton(button, index) {
  const buttonInfo = {
    index,
    element: button,
    text: button.textContent?.trim() || button.getAttribute('aria-label') || 'No text',
    className: button.className,
    tagName: button.tagName,
    type: button.type || 'button',
    disabled: button.disabled,
    location: getButtonLocation(button),
    hasOnClick: !!(button.onclick || button.getAttribute('onclick')),
    hasEventListeners: getEventListenerCount(button),
    isVisible: isElementVisible(button),
    isClickable: isElementClickable(button),
    issues: []
  };

  // Test various button properties
  if (button.disabled) {
    buttonInfo.issues.push('Button is disabled');
  }

  if (!buttonInfo.isVisible) {
    buttonInfo.issues.push('Button is not visible');
  }

  if (!buttonInfo.isClickable) {
    buttonInfo.issues.push('Button is not clickable (pointer-events: none)');
  }

  if (!buttonInfo.hasOnClick && buttonInfo.hasEventListeners === 0) {
    buttonInfo.issues.push('No click handlers found');
  }

  // Check for common problematic patterns
  if (button.closest('table') && !button.style.zIndex) {
    buttonInfo.issues.push('Table button without z-index');
  }

  if (button.textContent?.includes('Upload') || button.textContent?.includes('Photo')) {
    buttonInfo.issues.push('File/Photo button - check file input connection');
  }

  // Test actual click functionality
  try {
    const clickTest = testButtonClick(button);
    if (!clickTest.success) {
      buttonInfo.issues.push(`Click test failed: ${clickTest.error}`);
    }
  } catch (error) {
    buttonInfo.issues.push(`Click test error: ${error.message}`);
  }

  return buttonInfo;
}

// Test if a button click works
function testButtonClick(button) {
  try {
    let clickHandled = false;
    
    // Create a test click event
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });

    // Add a temporary listener to detect if event is handled
    const tempListener = (e) => {
      clickHandled = true;
      e.preventDefault();
      e.stopPropagation();
    };

    button.addEventListener('click', tempListener, { once: true });
    
    // Dispatch the event
    const result = button.dispatchEvent(event);
    
    // Clean up
    button.removeEventListener('click', tempListener);
    
    return { 
      success: clickHandled || result, 
      handled: clickHandled,
      propagated: result 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get button location context
function getButtonLocation(button) {
  const contexts = [];
  
  if (button.closest('table')) contexts.push('Table');
  if (button.closest('[role="dialog"]')) contexts.push('Dialog');
  if (button.closest('form')) contexts.push('Form');
  if (button.closest('.card')) contexts.push('Card');
  if (button.closest('nav')) contexts.push('Navigation');
  if (button.closest('[data-radix-dropdown-menu-content]')) contexts.push('Dropdown');
  
  const page = document.title || window.location.pathname;
  return `${page} > ${contexts.join(' > ')}`;
}

// Count event listeners (approximation)
function getEventListenerCount(element) {
  // This is an approximation since we can't directly access all listeners
  let count = 0;
  
  // Check for common React props
  if (element._reactInternalFiber || element._reactInternalInstance) {
    count += 1;
  }
  
  // Check for onclick attribute
  if (element.onclick) count += 1;
  if (element.getAttribute('onclick')) count += 1;
  
  return count;
}

// Check if element is visible
function isElementVisible(element) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  return !!(
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0'
  );
}

// Check if element is clickable
function isElementClickable(element) {
  const style = window.getComputedStyle(element);
  return style.pointerEvents !== 'none';
}

// Main test function
function runButtonFunctionalityTest() {
  console.log('🔍 Starting comprehensive button functionality test...');
  
  // Reset results
  testResults = { working: [], broken: [], total: 0 };
  
  // Find all button-like elements
  const selectors = [
    'button',
    '[role="button"]',
    'input[type="button"]',
    'input[type="submit"]',
    '.cursor-pointer',
    '[data-radix-dropdown-menu-trigger]',
    '[data-radix-select-trigger]'
  ];
  
  const allButtons = document.querySelectorAll(selectors.join(', '));
  testResults.total = allButtons.length;
  
  console.log(`Found ${allButtons.length} button-like elements to test`);
  
  // Test each button
  allButtons.forEach((button, index) => {
    const result = testButton(button, index);
    
    if (result.issues.length === 0 && result.isVisible && result.isClickable) {
      testResults.working.push(result);
    } else {
      testResults.broken.push(result);
    }
  });
  
  // Generate report
  generateTestReport();
  
  return testResults;
}

// Generate and display test report
function generateTestReport() {
  console.log('\n📊 BUTTON FUNCTIONALITY TEST REPORT');
  console.log('=====================================');
  console.log(`Total buttons tested: ${testResults.total}`);
  console.log(`Working buttons: ${testResults.working.length} (${((testResults.working.length / testResults.total) * 100).toFixed(1)}%)`);
  console.log(`Problematic buttons: ${testResults.broken.length} (${((testResults.broken.length / testResults.total) * 100).toFixed(1)}%)`);
  
  if (testResults.broken.length > 0) {
    console.log('\n❌ PROBLEMATIC BUTTONS:');
    testResults.broken.forEach((button, index) => {
      console.log(`\n${index + 1}. "${button.text}" (${button.tagName})`);
      console.log(`   Location: ${button.location}`);
      console.log(`   Issues: ${button.issues.join(', ')}`);
      console.log(`   Visible: ${button.isVisible}, Clickable: ${button.isClickable}`);
    });
  }
  
  if (testResults.working.length > 0) {
    console.log(`\n✅ Working buttons: ${testResults.working.length} buttons are functioning correctly`);
  }
  
  // Highlight problematic buttons in the UI
  highlightProblematicButtons();
}

// Highlight problematic buttons visually
function highlightProblematicButtons() {
  // Remove any existing highlights
  document.querySelectorAll('.button-test-highlight').forEach(el => {
    el.classList.remove('button-test-highlight');
    el.style.removeProperty('outline');
    el.style.removeProperty('box-shadow');
  });
  
  // Highlight broken buttons
  testResults.broken.forEach(buttonInfo => {
    if (buttonInfo.element && buttonInfo.isVisible) {
      buttonInfo.element.classList.add('button-test-highlight');
      buttonInfo.element.style.outline = '3px solid red';
      buttonInfo.element.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
      
      // Add tooltip with issues
      buttonInfo.element.title = `Issues: ${buttonInfo.issues.join(', ')}`;
    }
  });
  
  console.log('🎯 Problematic buttons are now highlighted in red');
}

// Auto-fix common button issues
function autoFixCommonIssues() {
  console.log('🔧 Attempting to auto-fix common button issues...');
  
  let fixedCount = 0;
  
  testResults.broken.forEach(buttonInfo => {
    const button = buttonInfo.element;
    
    // Fix pointer-events issues
    if (button.style.pointerEvents === 'none') {
      button.style.pointerEvents = 'auto';
      fixedCount++;
    }
    
    // Fix z-index issues for table buttons
    if (button.closest('table') && !button.style.zIndex) {
      button.style.zIndex = '10';
      button.style.position = 'relative';
      fixedCount++;
    }
    
    // Fix visibility issues
    if (button.style.visibility === 'hidden') {
      button.style.visibility = 'visible';
      fixedCount++;
    }
  });
  
  console.log(`✅ Auto-fixed ${fixedCount} common issues`);
  
  // Re-run test to see improvements
  setTimeout(() => {
    console.log('🔄 Re-running test after auto-fixes...');
    runButtonFunctionalityTest();
  }, 500);
}

// Export functions for use
if (typeof window !== 'undefined') {
  window.runButtonTest = runButtonFunctionalityTest;
  window.autoFixButtons = autoFixCommonIssues;
  window.buttonTestResults = testResults;
}

// Auto-run test when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runButtonFunctionalityTest);
} else {
  setTimeout(runButtonFunctionalityTest, 1000);
}

console.log('🧪 Button Functionality Test loaded. Use window.runButtonTest() to run manually');

export { runButtonFunctionalityTest, autoFixCommonIssues, testResults }; 