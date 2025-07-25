
import React, { useState } from 'react';
import { MechanicChangeProps } from '../types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import MechanicInput from './MechanicInput';
import MechanicsList from './MechanicsList';
import ReasonInput from './ReasonInput';

const MechanicChangeDialog: React.FC<MechanicChangeProps> = ({
  isOpen,
  onClose,
  repair,
  onSaveMechanics,
}) => {
  const [mechanics, setMechanics] = useState<string[]>([...repair.mechanics]);
  const [mechanicName, setMechanicName] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const addMechanic = () => {
    if (mechanicName.trim() && !mechanics.includes(mechanicName.trim())) {
      setMechanics([...mechanics, mechanicName.trim()]);
      setMechanicName('');
      setError('');
    }
  };

  const removeMechanic = (mechanicToRemove: string) => {
    setMechanics(mechanics.filter(mech => mech !== mechanicToRemove));
  };

  const handleSubmit = () => {
    if (mechanics.length === 0) {
      setError('At least one mechanic is required');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for changing the mechanics');
      return;
    }

    onSaveMechanics(mechanics, reason);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-monza-black">Change Mechanics</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-monza-black">
              Car: <span className="font-normal text-monza-grey">{repair.carCode} - {repair.carModel}</span>
            </label>
          </div>
          
          {/* Current Mechanics Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-monza-black">Current Mechanics:</label>
            <div className="flex flex-wrap gap-2">
              {repair.mechanics.map((mechanic, idx) => (
                <div key={idx} className="bg-monza-grey/10 rounded-full px-3 py-1 text-sm text-monza-grey">
                  {mechanic}
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-monza-black">New Mechanics List:</label>
            <MechanicInput 
              mechanicName={mechanicName}
              setMechanicName={setMechanicName}
              addMechanic={addMechanic}
            />
            
            <MechanicsList 
              mechanics={mechanics} 
              onRemoveMechanic={removeMechanic} 
            />
          </div>
          
          <ReasonInput reason={reason} setReason={setReason} />
          
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MechanicChangeDialog;
