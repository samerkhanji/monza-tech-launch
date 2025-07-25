import React, { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface EnhancedDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onClose?: () => void;
  enableKeyboardShortcuts?: boolean;
  enableDoubleEscape?: boolean;
  enableCtrlW?: boolean;
  className?: string;
}

const EnhancedDialog: React.FC<EnhancedDialogProps> = ({
  children,
  open,
  onClose,
  enableKeyboardShortcuts = true,
  enableDoubleEscape = true,
  enableCtrlW = true,
  className,
}) => {
  // Add keyboard shortcuts if enabled
  useKeyboardShortcuts({
    onClose: enableKeyboardShortcuts ? onClose : undefined,
    enableDoubleEscape,
    enableCtrlW,
  });

  // Add a visual indicator for keyboard shortcuts
  useEffect(() => {
    if (enableKeyboardShortcuts && onClose) {
      const showTooltip = setTimeout(() => {
        // Only show if no other dialogs are open
        const existingTooltip = document.querySelector('.keyboard-shortcut-tooltip');
        if (!existingTooltip) {
          const tooltip = document.createElement('div');
          tooltip.className = 'keyboard-shortcut-tooltip fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm z-[100] opacity-0 transition-opacity duration-300';
          tooltip.innerHTML = `
            <div class="flex flex-col gap-1">
              <div><kbd class="px-2 py-1 bg-gray-700 rounded text-xs">Esc</kbd> ${enableDoubleEscape ? '(double-tap)' : ''} Close</div>
              ${enableCtrlW ? '<div><kbd class="px-2 py-1 bg-gray-700 rounded text-xs">Ctrl/⌘+W</kbd> Close</div>' : ''}
            </div>
          `;
          document.body.appendChild(tooltip);
          
          // Fade in
          setTimeout(() => {
            tooltip.style.opacity = '1';
          }, 100);
          
          // Auto hide after 3 seconds
          setTimeout(() => {
            tooltip.style.opacity = '0';
            setTimeout(() => {
              if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
              }
            }, 300);
          }, 3000);
        }
      }, 1000); // Show after 1 second

      return () => clearTimeout(showTooltip);
    }
  }, [enableKeyboardShortcuts, enableDoubleEscape, enableCtrlW, onClose]);

  return (
    <Dialog 
      open={open}
      onOpenChange={(isOpen) => !isOpen && onClose?.()} 
    >
      <DialogContent className={className}>
        {children}
      </DialogContent>
    </Dialog>
  );
};

// Also create a simple hook for existing dialogs
export const useDialogKeyboardShortcuts = (onClose?: () => void) => {
  useKeyboardShortcuts({
    onClose,
    enableDoubleEscape: true,
    enableCtrlW: true,
  });
};

export default EnhancedDialog; 