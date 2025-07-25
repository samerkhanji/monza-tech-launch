
import React from 'react';
import { RepairRecord } from '@/types';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface MechanicsDisplayProps {
  repair: RepairRecord;
  canChangeMechanics: boolean;
  onOpenMechanicDialog: () => void;
  compactView?: boolean;
}

const MechanicsDisplay: React.FC<MechanicsDisplayProps> = ({ 
  repair, 
  canChangeMechanics, 
  onOpenMechanicDialog,
  compactView = false 
}) => {
  if (compactView) {
    return (
      <div className="mt-2 mb-2 text-xs">
        <span className="text-muted-foreground">Mechanics:</span> {repair.mechanics.length ? 
          repair.mechanics.length > 1 ? `${repair.mechanics[0]} +${repair.mechanics.length - 1}` : repair.mechanics[0] 
          : 'None assigned'}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-muted-foreground">Mechanics:</span>
        {canChangeMechanics && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onOpenMechanicDialog}
            className="h-6 text-xs"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Change
          </Button>
        )}
      </div>
      
      {repair.mechanics.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {repair.mechanics.map((mechanic, index) => (
            <span 
              key={index} 
              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
            >
              {mechanic}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No mechanics assigned</p>
      )}
    </div>
  );
};

export default MechanicsDisplay;
