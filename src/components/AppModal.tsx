import React, { useEffect, useId, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Tailwind max width class, e.g., `max-w-3xl` */
  maxWidth?: string;
  /** Optional title for the dialog header; improves accessibility */
  title?: React.ReactNode;
  /** Optional plain text description for screen readers */
  description?: string;
  /** Whether clicking on the overlay closes the modal */
  closeOnOverlayClick?: boolean;
  /** Show an accessible close button in the top-right */
  showCloseButton?: boolean;
  /** Enable closing with the Escape key */
  closeOnEsc?: boolean;
  /** Optional ref to focus when the dialog opens */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** Additional Tailwind classes for the content container */
  className?: string;
  /** Optional portal container; defaults to document.body */
  container?: HTMLElement | null;
};

export default function AppModal({
  open,
  onClose,
  children,
  maxWidth = 'max-w-3xl',
  title,
  description,
  closeOnOverlayClick = true,
  showCloseButton = true,
  closeOnEsc = true,
  initialFocusRef,
  className,
  container,
}: AppModalProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const headingId = useId();
  const descriptionId = useId();

  // Let Radix handle scroll locking via its own primitives (no manual body lock)

  // Manage focus: trap within dialog, restore on close, Esc to close
  useEffect(() => {
    if (!open) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    const focusableSelector = [
      'a[href]',
      'area[href]',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const focusFirstElement = () => {
      const containerEl = contentRef.current;
      if (!containerEl) return;
      const target = initialFocusRef?.current || (containerEl.querySelector(focusableSelector) as HTMLElement | null);
      if (target) {
        target.focus();
      } else {
        containerEl.focus();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEsc) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const containerEl = contentRef.current;
        if (!containerEl) return;
        const focusable = Array.from(containerEl.querySelectorAll<HTMLElement>(focusableSelector)).filter(
          (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1 && !el.getAttribute('aria-hidden')
        );
        if (focusable.length === 0) {
          event.preventDefault();
          containerEl.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const current = document.activeElement as HTMLElement | null;
        if (event.shiftKey) {
          if (current === first || !containerEl.contains(current)) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (current === last || !containerEl.contains(current)) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    const timer = window.setTimeout(focusFirstElement, 0);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the previously focused trigger element
      previouslyFocusedElementRef.current?.focus?.();
    };
  }, [open, closeOnEsc, onClose, initialFocusRef]);

  const ariaLabelledBy = useMemo(() => (title ? `${headingId}-title` : undefined), [title, headingId]);
  const ariaDescribedBy = useMemo(
    () => (description ? `${descriptionId}-description` : undefined),
    [description, descriptionId]
  );

  if (!open) return null;

  const overlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnOverlayClick) return;
    if (event.target === overlayRef.current) {
      onClose();
    }
    
  };

  return createPortal(
    <div
      ref={overlayRef}
      className={clsx(
        'fixed inset-0 z-[1000] bg-black/20 flex items-center justify-center relative',
        'data-[state=open]:opacity-100 data-[state=closed]:opacity-0 transition-opacity duration-200 ease-out'
      )}
      data-state="open"
      onClick={overlayClick}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        className={clsx(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(850px,95vw)] z-[1001]',
          maxWidth,
          'bg-white rounded-xl shadow-2xl ring-1 ring-black/5',
          'max-h-[85vh] overflow-y-auto',
          'p-4 sm:p-6',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 mb-3 sm:mb-4">
            {title ? (
              <h2 id={`${headingId}-title`} className="text-lg sm:text-xl font-semibold text-gray-900">
                {title}
              </h2>
            ) : (
              <span />
            )}
            {showCloseButton && (
              <button
                type="button"
                aria-label="Close dialog"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {description && (
          <p id={`${descriptionId}-description`} className="text-sm text-gray-600 mb-3 sm:mb-4">
            {description}
          </p>
        )}

        {children}
      </div>
    </div>,
    container ?? document.body
  );
}


