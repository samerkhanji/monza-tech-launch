/**
 * Utility function to handle button click events in table cells
 * Prevents event propagation and default behavior to avoid conflicts
 */
export const handleTableButtonClick = <T extends unknown[]>(
  event: React.MouseEvent,
  handler: (...args: T) => void,
  ...args: T
): void => {
  event.preventDefault();
  event.stopPropagation();
  handler(...args);
};

/**
 * Higher-order function to wrap event handlers with proper event management
 */
export const withEventHandling = <T extends unknown[]>(
  handler: (...args: T) => void
) => {
  return (event: React.MouseEvent, ...args: T) => {
    handleTableButtonClick(event, handler, ...args);
  };
};

/**
 * Async version for async handlers
 */
export const handleTableButtonClickAsync = async <T extends unknown[]>(
  event: React.MouseEvent,
  handler: (...args: T) => Promise<void>,
  ...args: T
): Promise<void> => {
  event.preventDefault();
  event.stopPropagation();
  
  try {
    await handler(...args);
  } catch (error) {
    console.error('Button handler error:', error);
  }
};

/**
 * Wrapper for dropdown menu item clicks
 */
export const handleDropdownItemClick = <T extends unknown[]>(
  event: React.MouseEvent,
  handler: (...args: T) => void,
  ...args: T
): void => {
  event.preventDefault();
  event.stopPropagation();
  
  // Close any open dropdowns by triggering a click outside
  const dropdown = event.currentTarget.closest('[data-radix-dropdown-menu-content]');
  if (dropdown) {
    const trigger = document.querySelector('[data-radix-dropdown-menu-trigger][data-state="open"]');
    if (trigger instanceof HTMLElement) {
      trigger.click();
    }
  }
  
  handler(...args);
};

/**
 * Badge click handler with visual feedback
 */
export const handleBadgeClick = <T extends unknown[]>(
  event: React.MouseEvent,
  handler: (...args: T) => void,
  ...args: T
): void => {
  event.preventDefault();
  event.stopPropagation();
  
  // Add visual feedback
  const target = event.currentTarget as HTMLElement;
  target.style.transform = 'scale(0.95)';
  setTimeout(() => {
    target.style.transform = '';
  }, 150);
  
  handler(...args);
};

/**
 * Generic form button handler
 */
export const handleFormButtonClick = <T extends unknown[]>(
  event: React.MouseEvent,
  handler: (...args: T) => void,
  ...args: T
): void => {
  event.preventDefault();
  handler(...args);
};

/**
 * Modal/Dialog button handler
 */
export const handleModalButtonClick = <T extends unknown[]>(
  event: React.MouseEvent,
  handler: (...args: T) => void,
  ...args: T
): void => {
  event.preventDefault();
  event.stopPropagation();
  handler(...args);
}; 