import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

function TestModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999]"
      onClick={onClose}
    >
      <div
        className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full z-[100000] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold">This is a test modal</h2>
        <p>Click outside to close. If you see this, modal rendering works.</p>
        <button onClick={onClose} className="mt-4 bg-black text-white px-4 py-2 rounded">
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}

export default function TestModalPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-20">
      <h1 className="text-2xl font-bold mb-6">Test Modal Page</h1>
      <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setOpen(true)}>
        Open Modal
      </button>
      <TestModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}


