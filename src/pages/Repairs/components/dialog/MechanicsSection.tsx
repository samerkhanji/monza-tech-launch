
import React, { useState } from 'react';
import { User, Clock, Edit } from 'lucide-react';
import MechanicInput from '../MechanicInput';
import MechanicsList from '../MechanicsList';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface MechanicsSectionProps {
  mechanics: string[];
  mechanicName: string;
  setMechanicName: (name: string) => void;
  addMechanic: () => void;
  removeMechanic: (mechanicName: string) => void;
  onSaveNotes?: (notes: string) => void;
  workNotes?: string;
}

const MechanicsSection: React.FC<MechanicsSectionProps> = ({
  mechanics,
  mechanicName,
  setMechanicName,
  addMechanic,
  removeMechanic,
  onSaveNotes,
  workNotes = ''
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [mechanicNotes, setMechanicNotes] = useState(workNotes);

  const handleSaveNotes = () => {
    if (onSaveNotes) {
      onSaveNotes(mechanicNotes);
      toast({
        title: "Work Notes Saved",
        description: "Mechanic work notes have been updated"
      });
    }
    setIsEditingNotes(false);
  };

  return (
    <div className="space-y-3 bg-amber-50 p-4 rounded-lg border border-amber-100">
      <div className="flex items-center gap-2 mb-1">
        <User className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-medium text-amber-700">Mechanics Working on this Car</h3>
      </div>
      <MechanicInput
        mechanicName={mechanicName}
        setMechanicName={setMechanicName}
        addMechanic={addMechanic}
      />
      
      <MechanicsList 
        mechanics={mechanics} 
        onRemoveMechanic={removeMechanic}
      />
      
      {onSaveNotes && (
        <div className="mt-4 pt-3 border-t border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <h4 className="text-sm font-medium text-amber-700">Work Notes</h4>
            </div>
            
            {!isEditingNotes && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingNotes(true)}
                className="h-7 text-xs"
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Edit Notes
              </Button>
            )}
          </div>
          
          {isEditingNotes ? (
            <div className="space-y-3">
              <Textarea
                value={mechanicNotes}
                onChange={(e) => setMechanicNotes(e.target.value)}
                placeholder="Enter notes about the work being done..."
                className="min-h-[100px] border-amber-200 focus:border-amber-300"
              />
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsEditingNotes(false);
                    setMechanicNotes(workNotes);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleSaveNotes}
                >
                  Save Notes
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-3 rounded border border-amber-200 text-sm">
              {workNotes ? workNotes : <span className="text-gray-400 italic">No work notes yet</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MechanicsSection;
