import React from 'react';
import { createPortal } from 'react-dom';

interface ModalsPortalProps {
  children: React.ReactNode;
  isOpen?: boolean;
}

export function ModalsPortal({ children, isOpen = true }: ModalsPortalProps) {
  const el = document.getElementById('modals-root');
  if (!el) return null;
  
  // Only enable pointer events when there's content AND modal is open
  const hasContent = !!children && isOpen;
  
  if (hasContent) {
    el.style.position = 'fixed';
    el.style.inset = '0';
    el.style.zIndex = '500'; // Keep it below extreme values
    el.style.pointerEvents = 'auto';
  } else {
    el.style.position = 'static';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '0';
    el.style.removeProperty('inset');
  }
  
  return createPortal(children, el);
}

// Safe wrapper for any modal content
export function SafeModal({ 
  children, 
  isOpen, 
  onClose 
}: { 
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  
  return (
    <ModalsPortal isOpen={isOpen}>
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
        style={{ pointerEvents: 'auto' }}
      >
        <div 
          className="bg-white rounded-lg p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'auto' }}
        >
          {children}
        </div>
      </div>
    </ModalsPortal>
  );
}
