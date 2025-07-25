
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';

interface MechanicInputProps {
  mechanicName: string;
  setMechanicName: (name: string) => void;
  addMechanic: () => void;
}

const MechanicInput: React.FC<MechanicInputProps> = ({
  mechanicName,
  setMechanicName,
  addMechanic
}) => {
  return (
    <div className="flex space-x-2">
      <Input
        placeholder="Enter mechanic name"
        value={mechanicName}
        onChange={(e) => setMechanicName(e.target.value)}
        className="flex-1"
      />
      <Button 
        type="button"
        onClick={addMechanic}
        disabled={!mechanicName.trim()}
        size="icon"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MechanicInput;
