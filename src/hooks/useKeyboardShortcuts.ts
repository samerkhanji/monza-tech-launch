import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ShortcutAction {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  const shortcuts: ShortcutAction[] = [
    // Navigation shortcuts
    {
      key: 'd',
      altKey: true,
      description: 'Go to Dashboard',
      action: () => navigate('/enhanced-dashboard')
    },
    {
      key: 'i',
      altKey: true,
      description: 'Go to Car Inventory',
      action: () => navigate('/car-inventory')
    },
    {
      key: 'r',
      altKey: true,
      description: 'Go to Repairs',
      action: () => navigate('/repairs')
    },
    {
      key: 'g',
      altKey: true,
      description: 'Go to Garage Schedule',
      action: () => navigate('/garage-schedule')
    },
    {
      key: 'f',
      altKey: true,
      description: 'Go to Finances',
      action: () => navigate('/financial-dashboard')
    },
    {
      key: 's',
      altKey: true,
      description: 'Go to System Status',
      action: () => navigate('/system-status')
    },
    {
      key: 'c',
      altKey: true,
      description: 'Go to Customization',
      action: () => navigate('/customization')
    },
    {
      key: 'p',
      altKey: true,
      description: 'Go to Performance Monitor',
      action: () => navigate('/performance')
    },
    
    // Quick actions
    {
      key: 'n',
      ctrlKey: true,
      description: 'New Car Entry',
      action: () => navigate('/car-inventory')
    },
    {
      key: 'n',
      ctrlKey: true,
      shiftKey: true,
      description: 'New Repair',
      action: () => navigate('/repairs')
    },
    {
      key: 'h',
      altKey: true,
      description: 'Show/Hide Shortcuts Help',
      action: () => {
        const event = new CustomEvent('toggle-shortcuts-help');
        window.dispatchEvent(event);
      }
    },
    
    // Search and focus
    {
      key: '/',
      ctrlKey: true,
      description: 'Focus Search',
      action: () => {
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        } else {
          // If no search input, dispatch search event
          const event = new CustomEvent('global-search');
          window.dispatchEvent(event);
        }
      }
    },
    
    // System shortcuts
    {
      key: 'Escape',
      description: 'Close Modal/Dialog',
      action: () => {
        // Try to close any open modals
        const closeButtons = document.querySelectorAll('[data-dialog-close], .dialog-close, [aria-label*="close"]');
        if (closeButtons.length > 0) {
          (closeButtons[closeButtons.length - 1] as HTMLElement).click();
        }
      }
    }
  ];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        // Exception: Allow Escape to work in inputs too
        if (event.key !== 'Escape') {
          return;
        }
      }

      const matchingShortcut = shortcuts.find(shortcut => {
        return (
          shortcut.key.toLowerCase() === event.key.toLowerCase() &&
          !!shortcut.ctrlKey === event.ctrlKey &&
          !!shortcut.altKey === event.altKey &&
          !!shortcut.shiftKey === event.shiftKey
        );
      });

      if (matchingShortcut) {
        event.preventDefault();
        event.stopPropagation();
        console.log('🎹 Keyboard shortcut triggered:', matchingShortcut.description);
        matchingShortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    // Store shortcuts in global for help display
    (window as any).monzaShortcuts = shortcuts;

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      delete (window as any).monzaShortcuts;
    };
  }, [navigate]);

  return shortcuts;
}

// Hook for displaying shortcuts help
export function useShortcutsHelp() {
  const shortcuts = (window as any).monzaShortcuts || [];
  
  const formatShortcut = (shortcut: ShortcutAction) => {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('Ctrl');
    if (shortcut.altKey) parts.push('Alt');
    if (shortcut.shiftKey) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  return {
    shortcuts,
    formatShortcut
  };
}
