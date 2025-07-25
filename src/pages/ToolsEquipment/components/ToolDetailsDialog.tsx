import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ToolDetailsDialogProps {
  isOpen: boolean;
  tool: any;
  onClose: () => void;
}

const ToolDetailsDialog: React.FC<ToolDetailsDialogProps> = ({ isOpen, tool, onClose }) => {
  if (!tool) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tool.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Type</h4>
              <Badge variant="outline">{tool.type}</Badge>
            </div>
            <div>
              <h4 className="font-medium">Category</h4>
              <p>{tool.category}</p>
            </div>
            <div>
              <h4 className="font-medium">Location</h4>
              <p className="capitalize">{tool.location}</p>
            </div>
            <div>
              <h4 className="font-medium">Condition</h4>
              <Badge>{tool.condition}</Badge>
            </div>
            <div>
              <h4 className="font-medium">Purchase Price</h4>
              <p>${tool.purchasePrice?.toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-medium">Current Value</h4>
              <p>${tool.currentValue?.toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-medium">Usage Hours</h4>
              <p>{tool.usageHours}h</p>
            </div>
            <div>
              <h4 className="font-medium">Assigned To</h4>
              <p>{tool.assignedTo || 'Unassigned'}</p>
            </div>
          </div>

          {tool.description && (
            <div>
              <h4 className="font-medium">Description</h4>
              <p>{tool.description}</p>
            </div>
          )}

          {tool.notes && (
            <div>
              <h4 className="font-medium">Notes</h4>
              <p>{tool.notes}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ToolDetailsDialog; 