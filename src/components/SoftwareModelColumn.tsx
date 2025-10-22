// Software Model Column Component
// For displaying and editing software version information in table columns

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit3, Save, X, Monitor, Calendar, User } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SoftwareModelColumnProps {
  softwareVersion?: string;
  softwareLastUpdated?: string;
  softwareUpdateBy?: string;
  softwareUpdateNotes?: string;
  compact?: boolean;
  editable?: boolean;
  onSave?: (data: { 
    softwareVersion: string; 
    softwareLastUpdated?: string;
    softwareUpdateBy?: string;
    softwareUpdateNotes?: string;
  }) => void;
  carId?: string;
}

const SoftwareModelColumn: React.FC<SoftwareModelColumnProps> = ({
  softwareVersion,
  softwareLastUpdated,
  softwareUpdateBy,
  softwareUpdateNotes,
  compact = false,
  editable = true,
  onSave,
  carId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editVersion, setEditVersion] = useState(softwareVersion || '');
  const [editUpdateBy, setEditUpdateBy] = useState(softwareUpdateBy || '');
  const [editNotes, setEditNotes] = useState(softwareUpdateNotes || '');

  const handleSave = () => {
    if (onSave && editVersion.trim()) {
      onSave({
        softwareVersion: editVersion.trim(),
        softwareLastUpdated: new Date().toISOString(),
        softwareUpdateBy: editUpdateBy.trim() || 'System',
        softwareUpdateNotes: editNotes.trim()
      });
      
      toast({
        title: "✅ Software Version Updated",
        description: `Updated to v${editVersion.trim()}`,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditVersion(softwareVersion || '');
    setEditUpdateBy(softwareUpdateBy || '');
    setEditNotes(softwareUpdateNotes || '');
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (editable) {
      setIsEditing(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // If no software version and not editing
  if (!softwareVersion && !isEditing) {
    return (
      <div 
        className={`text-sm ${editable ? 'cursor-pointer hover:text-blue-600 hover:underline' : ''}`}
        onClick={editable ? handleEdit : undefined}
        title={editable ? "Click to add software version" : undefined}
      >
        <Badge 
          variant="secondary" 
          className={`text-xs text-yellow-700 bg-yellow-100 border border-yellow-300 ${editable ? 'hover:bg-yellow-200 hover:border-yellow-400 cursor-pointer' : ''}`}
        >
          {editable ? "Click to add version" : "Update Needed"}
        </Badge>
      </div>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <div className="space-y-3 p-3 border rounded-lg bg-blue-50 min-w-64">
        <div className="space-y-2">
          <div>
            <Label htmlFor="software-version" className="text-xs">Software Version</Label>
            <Input
              id="software-version"
              placeholder="e.g., 2.1.0"
              value={editVersion}
              onChange={(e) => setEditVersion(e.target.value)}
              className="h-7 text-xs"
              required
            />
          </div>
          <div>
            <Label htmlFor="update-by" className="text-xs">Updated By</Label>
            <Input
              id="update-by"
              placeholder="e.g., IT Technician"
              value={editUpdateBy}
              onChange={(e) => setEditUpdateBy(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label htmlFor="update-notes" className="text-xs">Update Notes</Label>
            <Textarea
              id="update-notes"
              placeholder="Notes about this update..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="text-xs"
              rows={2}
            />
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            onClick={handleSave}
            className="h-6 px-2 text-xs"
            disabled={!editVersion.trim()}
          >
            <Save className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="h-6 px-2 text-xs"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div 
        className={`flex items-center gap-1 ${editable ? 'cursor-pointer hover:opacity-80' : ''}`}
        onClick={editable ? handleEdit : undefined}
        title={editable ? "Click to edit software version" : undefined}
      >
        <Badge 
          variant="outline" 
          className="text-xs hover:bg-blue-50 transition-colors"
        >
          v{softwareVersion}
        </Badge>
        {editable && (
          <Edit3 className="w-3 h-3 text-gray-400" />
        )}
      </div>
    );
  }

  return (
    <div 
      className={`space-y-2 ${editable ? 'cursor-pointer hover:bg-blue-50 hover:border-blue-200 p-2 rounded border border-transparent transition-colors' : ''}`}
      onClick={editable ? handleEdit : undefined}
      title={editable ? "Click to edit software version" : undefined}
    >
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className="text-xs hover:bg-blue-50 transition-colors"
        >
          <Monitor className="w-3 h-3 mr-1" />
          v{softwareVersion}
        </Badge>
        {editable && (
          <Edit3 className="w-3 h-3 text-gray-400" />
        )}
      </div>
      
      <div className="text-xs text-gray-600 space-y-1">
        {softwareLastUpdated && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>Updated: {formatDate(softwareLastUpdated)}</span>
          </div>
        )}
        {softwareUpdateBy && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>By: {softwareUpdateBy}</span>
          </div>
        )}
        {softwareUpdateNotes && (
          <div className="text-xs text-gray-500 italic">
            "{softwareUpdateNotes}"
          </div>
        )}
      </div>
    </div>
  );
};

export default SoftwareModelColumn;