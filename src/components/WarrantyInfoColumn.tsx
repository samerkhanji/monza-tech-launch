// Warranty Information Column Component
// For displaying and editing warranty information in table columns

import React, { useState } from 'react';
import WarrantyStatusBadge from './WarrantyStatusBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Edit3, Save, X, Shield, AlertTriangle, Plus } from 'lucide-react';

interface WarrantyInfoColumnProps {
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyMonthsRemaining?: number;
  warrantyDaysRemaining?: number;
  warrantyStatus?: 'active' | 'expiring_soon' | 'expired';
  compact?: boolean;
  editable?: boolean;
  onSave?: (data: { warrantyStartDate: string; warrantyEndDate: string }) => void;
  carId?: string;
}

const WarrantyInfoColumn: React.FC<WarrantyInfoColumnProps> = ({
  warrantyStartDate,
  warrantyEndDate,
  warrantyMonthsRemaining = 0,
  warrantyDaysRemaining = 0,
  warrantyStatus = 'active',
  compact = false,
  editable = true,
  onSave,
  carId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editStartDate, setEditStartDate] = useState(warrantyStartDate || '');
  const [editEndDate, setEditEndDate] = useState(warrantyEndDate || '');

  const handleSave = () => {
    if (onSave && editEndDate) {
      onSave({
        warrantyStartDate: editStartDate,
        warrantyEndDate: editEndDate
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditStartDate(warrantyStartDate || '');
    setEditEndDate(warrantyEndDate || '');
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (editable) {
      setIsEditing(true);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString; // Return as-is if invalid date
    }
  };

  // Calculate warranty status for better display
  const getWarrantyStatusInfo = () => {
    if (!warrantyEndDate) return { status: 'no_data', color: 'gray', text: 'No warranty data' };
    
    try {
      const today = new Date();
      const endDate = new Date(warrantyEndDate);
      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining < 0) return { status: 'expired', color: 'red', text: 'Warranty Expired' };
      if (daysRemaining <= 30) return { status: 'expiring_soon', color: 'orange', text: 'Expiring Soon' };
      return { status: 'active', color: 'green', text: 'Warranty Active' };
    } catch {
      return { status: 'unknown', color: 'gray', text: 'Invalid Date' };
    }
  };

  const warrantyInfo = getWarrantyStatusInfo();

  // If no warranty data available and not editing - Show compact date input
  if (!warrantyEndDate && !isEditing) {
    return (
      <div className="p-2">
        <div 
          className={`${editable ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 p-2 rounded border border-dashed border-gray-300 transition-all duration-200' : 'p-2 rounded border border-gray-200 bg-gray-50'}`}
          onClick={(e) => {
            e.stopPropagation();
            if (editable) handleEdit();
          }}
          title={editable ? "Click to add warranty information" : "No warranty data available"}
        >
          <div className="flex items-center gap-2 text-gray-500">
            <Plus className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-600 font-medium">
              {editable ? "Add Warranty Dates" : "No Warranty"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Editing mode with manual text input
  if (isEditing) {
    return (
      <div className="p-2">
        <div className="space-y-2 p-3 border rounded-lg bg-blue-50 border-blue-200">
          <div className="space-y-2">
            <div>
              <Label htmlFor="start-date" className="text-xs font-medium">Start Date</Label>
              <Input
                id="start-date"
                type="text"
                placeholder="2025-01-01"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs font-medium">End Date *</Label>
              <Input
                id="end-date"
                type="text"
                placeholder="2030-12-31"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="h-7 text-xs"
                required
              />
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              onClick={handleSave}
              className="h-6 px-2 text-xs"
              disabled={!editEndDate}
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-6 px-2 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            Format: YYYY-MM-DD
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="p-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={`${editable ? 'cursor-pointer hover:opacity-80' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (editable) handleEdit();
                }}
              >
                <WarrantyStatusBadge
                  warrantyStatus={warrantyStatus}
                  warrantyDaysRemaining={warrantyDaysRemaining}
                  warrantyMonthsRemaining={warrantyMonthsRemaining}
                  showDetails={false}
                  size="sm"
                />
                {editable && (
                  <Edit3 className="w-3 h-3 text-gray-400 ml-1 inline" />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    Expires: {formatDate(warrantyEndDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {warrantyDaysRemaining} days ({warrantyMonthsRemaining} months) remaining
                  </span>
                </div>
                {warrantyStartDate && (
                  <div className="text-xs text-gray-600">
                    Started: {formatDate(warrantyStartDate)}
                  </div>
                )}
                {editable && (
                  <div className="text-xs text-blue-600 font-medium border-t pt-2">
                    Click to edit warranty dates
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  // Display warranty information in table cell
  return (
    <div className="p-2">
      <div 
        className={`${editable ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 p-2 rounded border border-transparent transition-all duration-200' : 'p-2 rounded border border-gray-200'}`}
        onClick={(e) => {
          e.stopPropagation();
          if (editable) handleEdit();
        }}
        title={editable ? "Click to edit warranty dates" : "Warranty information"}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className={`w-4 h-4 text-${warrantyInfo.color}-500`} />
            <span className={`text-sm font-medium text-${warrantyInfo.color}-700`}>
              {warrantyInfo.text}
            </span>
            {editable && (
              <Edit3 className="w-3 h-3 text-gray-400 hover:text-gray-600" />
            )}
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-700">
                Expires: <span className="font-medium">{formatDate(warrantyEndDate)}</span>
              </span>
            </div>
            
            {warrantyStartDate && (
              <div className="flex items-center gap-1">
                <span className="text-gray-700">
                  Started: <span className="font-medium">{formatDate(warrantyStartDate)}</span>
                </span>
              </div>
            )}
            
            {warrantyDaysRemaining > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-orange-500" />
                <span className="text-orange-700">
                  {warrantyDaysRemaining} days remaining
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarrantyInfoColumn;