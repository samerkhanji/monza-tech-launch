import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WarrantyLifeColumnProps {
  value: string | null;
  rowId: string;
  tableName: 'floor_1' | 'floor_2' | 'car_inventory' | 'garage_inventory';
  onUpdate?: (newValue: string) => void;
}

const WarrantyLifeColumn: React.FC<WarrantyLifeColumnProps> = ({
  value,
  rowId,
  tableName,
  onUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const { toast } = useToast();

  // Update local state when prop changes
  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from(tableName)
        .update({ warranty_life: editValue || null })
        .eq('id', rowId);

      if (error) {
        throw error;
      }

      // Call parent callback if provided
      if (onUpdate) {
        onUpdate(editValue);
      }

      setIsEditing(false);
      toast({
        title: "Warranty Updated",
        description: "Warranty life information has been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating warranty:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update warranty information. Please try again.",
        variant: "destructive",
      });
      // Revert to original value on error
      setEditValue(value || '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value || '');
    }
  };

  const getWarrantyStatus = (warrantyText: string) => {
    const text = warrantyText.toLowerCase();
    if (text.includes('expired') || text.includes('0') || text.includes('expired')) {
      return { color: 'bg-red-100 text-red-800', status: 'Expired' };
    } else if (text.includes('month') || text.includes('year')) {
      const months = parseInt(text.match(/(\d+)/)?.[1] || '0');
      if (months <= 3) {
        return { color: 'bg-yellow-100 text-yellow-800', status: 'Expiring Soon' };
      } else {
        return { color: 'bg-green-100 text-green-800', status: 'Active' };
      }
    }
    return { color: 'bg-gray-100 text-gray-800', status: 'Unknown' };
  };

  if (isEditing) {
    return (
      <Input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="w-24 h-8 text-xs border-blue-300 focus:border-blue-500"
        placeholder="e.g., 12 months"
        autoFocus
      />
    );
  }

  if (!value) {
    return (
      <div 
        className="text-gray-400 cursor-pointer hover:text-gray-600 text-xs px-2 py-1 border border-dashed border-gray-300 rounded hover:border-gray-400"
        onClick={() => setIsEditing(true)}
      >
        Click to add
      </div>
    );
  }

  const { color, status } = getWarrantyStatus(value);

  return (
    <div 
      className="cursor-pointer group"
      onClick={() => setIsEditing(true)}
    >
      <Badge 
        variant="secondary" 
        className={`${color} hover:opacity-80 transition-opacity text-xs`}
      >
        {value}
      </Badge>
      <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        Click to edit
      </div>
    </div>
  );
};

export default WarrantyLifeColumn;
