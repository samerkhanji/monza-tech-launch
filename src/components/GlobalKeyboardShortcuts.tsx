import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Keyboard, X } from 'lucide-react';

const GlobalKeyboardShortcuts: React.FC = () => {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // F1 or Ctrl/Cmd + / to show shortcuts help
      if (event.key === 'F1' || 
          ((event.ctrlKey || event.metaKey) && event.key === '/')) {
        event.preventDefault();
        setShowShortcuts(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const shortcutGroups = [
    {
      title: 'Dialog & Form Controls',
      shortcuts: [
        { keys: ['Esc', 'Esc'], description: 'Close any open dialog/form (double-tap)' },
        { keys: ['Ctrl/⌘', 'W'], description: 'Close current dialog/form' },
        { keys: ['Enter'], description: 'Submit form (when submit button is focused)' },
        { keys: ['Tab'], description: 'Navigate between form fields' },
      ]
    },
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['Ctrl/⌘', 'K'], description: 'Open command palette (if available)' },
        { keys: ['Alt', '←'], description: 'Browser back' },
        { keys: ['Alt', '→'], description: 'Browser forward' },
      ]
    },
    {
      title: 'General',
      shortcuts: [
        { keys: ['F1'], description: 'Show this help dialog' },
        { keys: ['Ctrl/⌘', '/'], description: 'Show this help dialog' },
        { keys: ['F5'], description: 'Refresh page' },
        { keys: ['Ctrl/⌘', 'R'], description: 'Refresh page' },
      ]
    }
  ];

  return (
    <>
      {/* Global keyboard shortcut indicator */}
      <div className="fixed bottom-4 left-4 z-50">
        <button
          onClick={() => setShowShortcuts(true)}
          className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-colors duration-200"
          title="Keyboard shortcuts (F1)"
        >
          <Keyboard className="h-4 w-4" />
        </button>
      </div>

      {/* Shortcuts help dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {shortcutGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-900 border-b pb-1">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 font-mono text-xs px-2 py-1">
                              {key}
                            </Badge>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-gray-400 text-xs">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Pro tip */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Pro Tip</h4>
              <p className="text-sm text-blue-800">
                When any dialog or form is open, you can quickly close it by double-tapping the <Badge variant="outline" className="mx-1">Esc</Badge> key or using <Badge variant="outline" className="mx-1">Ctrl/⌘+W</Badge>. This works throughout the entire MonzaBot application!
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={() => setShowShortcuts(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GlobalKeyboardShortcuts; 