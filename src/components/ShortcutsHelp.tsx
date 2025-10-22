import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { useShortcutsHelp } from '@/hooks/useKeyboardShortcuts';
import { Keyboard, X } from 'lucide-react';

export function ShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const { shortcuts, formatShortcut } = useShortcutsHelp();

  useEffect(() => {
    const handleToggle = () => setIsOpen(!isOpen);
    window.addEventListener('toggle-shortcuts-help', handleToggle);
    return () => window.removeEventListener('toggle-shortcuts-help', handleToggle);
  }, [isOpen]);

  const groupedShortcuts = {
    navigation: shortcuts.filter((s: any) => s.description.includes('Go to')),
    actions: shortcuts.filter((s: any) => s.description.includes('New') || s.description.includes('Focus')),
    system: shortcuts.filter((s: any) => 
      s.description.includes('Close') || 
      s.description.includes('Show/Hide') ||
      s.description.includes('Help')
    )
  };

  return (
    <>
      {/* Floating Help Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-12 w-12 shadow-lg"
          title="Keyboard Shortcuts (Alt + H)"
        >
          <Keyboard className="h-5 w-5" />
        </Button>
      </div>

      {/* Shortcuts Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Navigation Shortcuts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🧭 Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupedShortcuts.navigation.map((shortcut: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{shortcut.description.replace('Go to ', '')}</span>
                      <Badge variant="outline" className="font-mono">
                        {formatShortcut(shortcut)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">⚡ Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupedShortcuts.actions.map((shortcut: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{shortcut.description}</span>
                      <Badge variant="outline" className="font-mono">
                        {formatShortcut(shortcut)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Shortcuts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🛠️ System</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {groupedShortcuts.system.map((shortcut: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">{shortcut.description}</span>
                      <Badge variant="outline" className="font-mono">
                        {formatShortcut(shortcut)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pro Tips */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">💡 Pro Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-blue-700 text-sm">
                  <p>• Press <Badge variant="outline" className="font-mono">Alt + H</Badge> to show/hide this help</p>
                  <p>• Most navigation shortcuts use <Badge variant="outline" className="font-mono">Alt</Badge> key</p>
                  <p>• Quick actions use <Badge variant="outline" className="font-mono">Ctrl</Badge> key</p>
                  <p>• Shortcuts work from anywhere in the app (except when typing in inputs)</p>
                  <p>• Press <Badge variant="outline" className="font-mono">Escape</Badge> to close any modal or dialog</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setIsOpen(false)} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
