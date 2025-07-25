
import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MechanicsListProps {
  mechanics: string[];
  onRemoveMechanic: (mechanic: string) => void;
  currentMechanics?: string[];
  readOnly?: boolean;
}

const MechanicsList: React.FC<MechanicsListProps> = ({
  mechanics,
  onRemoveMechanic,
  currentMechanics,
  readOnly = false
}) => {
  if (currentMechanics) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Current Mechanics:</label>
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {currentMechanics.map((mechanic, idx) => (
            <div 
              key={idx} 
              className="bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-3 py-1 text-sm shadow-sm transition-all hover:shadow"
            >
              {mechanic}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {mechanics.map((mech, index) => (
        <div 
          key={index} 
          className={cn(
            "rounded-full px-3 py-1 text-sm flex items-center gap-1 transition-all duration-200 shadow-sm",
            "border bg-amber-50 border-amber-200 text-amber-800 hover:shadow"
          )}
        >
          {mech}
          {!readOnly && (
            <button
              type="button"
              onClick={() => onRemoveMechanic(mech)}
              className="ml-1 text-amber-500 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MechanicsList;
