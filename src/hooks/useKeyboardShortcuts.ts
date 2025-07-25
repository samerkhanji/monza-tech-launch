import { useEffect, useRef } from 'react';

interface UseKeyboardShortcutsOptions {
  onClose?: () => void;
  enableEscapeClose?: boolean;
  enableDoubleEscape?: boolean;
  enableCtrlW?: boolean;
}

export const useKeyboardShortcuts = ({
  onClose,
  enableEscapeClose = true,
  enableDoubleEscape = true,
  enableCtrlW = true,
}: UseKeyboardShortcutsOptions) => {
  const lastEscapeTime = useRef<number>(0);
  const escapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!onClose) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Ctrl/Cmd + W for closing dialogs
      if (enableCtrlW && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'w') {
        event.preventDefault();
        onClose();
        return;
      }

      // Handle Escape key behavior
      if (enableEscapeClose && event.key === 'Escape') {
        const currentTime = Date.now();
        
        if (enableDoubleEscape) {
          // Double escape functionality
          if (currentTime - lastEscapeTime.current < 500) {
            // Double tap detected within 500ms
            if (escapeTimeoutRef.current) {
              clearTimeout(escapeTimeoutRef.current);
              escapeTimeoutRef.current = null;
            }
            onClose();
            lastEscapeTime.current = 0;
          } else {
            // First escape tap
            lastEscapeTime.current = currentTime;
            escapeTimeoutRef.current = setTimeout(() => {
              lastEscapeTime.current = 0;
            }, 500);
          }
        } else {
          // Single escape to close
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (escapeTimeoutRef.current) {
        clearTimeout(escapeTimeoutRef.current);
      }
    };
  }, [onClose, enableEscapeClose, enableDoubleEscape, enableCtrlW]);
};

export default useKeyboardShortcuts; 