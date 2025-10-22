import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

interface IsolatedDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  onSave: () => void;
  onCancel: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const IsolatedDropdown: React.FC<IsolatedDropdownProps> = ({
  value,
  onValueChange,
  options,
  onSave,
  onCancel,
  triggerRef
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      setIsVisible(true);
    }
  }, [triggerRef]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        padding: '8px',
        minWidth: '200px'
      }}
    >
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full h-8">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent 
          position="popper" 
          side="bottom" 
          align="start"
          sideOffset={4}
          avoidCollisions={true}
          collisionBoundary={document.body}
          style={{ zIndex: 10000 }}
        >
          {options.map(option => (
            <SelectItem key={option} value={option}>
              {option.replace('_', ' ').toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2 mt-2">
        <Button size="sm" onClick={onSave} className="h-6 w-6 p-0">
          <Save className="h-3 w-3" />
        </Button>
        <Button size="sm" onClick={onCancel} variant="outline" className="h-6 w-6 p-0">
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default IsolatedDropdown; 