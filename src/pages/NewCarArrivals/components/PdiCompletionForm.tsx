
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PdiCompletionFormProps {
  carId: string;
  technician: string;
  setTechnician: React.Dispatch<React.SetStateAction<string>>;
  pdiNotes: string;
  setPdiNotes: React.Dispatch<React.SetStateAction<string>>;
  handleAssignPdiTechnician: (carId: string) => void;
}

export const PdiCompletionForm: React.FC<PdiCompletionFormProps> = ({
  carId,
  technician,
  setTechnician,
  pdiNotes,
  setPdiNotes,
  handleAssignPdiTechnician
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col gap-2 min-w-[300px]">
        <div>
          <Label htmlFor={`technician-${carId}`}>PDI Technician</Label>
          <Input
            id={`technician-${carId}`}
            type="text"
            value={technician}
            onChange={(e) => setTechnician(e.target.value)}
            placeholder="Enter technician name"
            className="w-full"
          />
        </div>
        
        <div>
          <Label htmlFor={`notes-${carId}`}>PDI Notes</Label>
          <Textarea 
            id={`notes-${carId}`}
            placeholder="Enter PDI notes"
            value={pdiNotes}
            onChange={(e) => setPdiNotes(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Button 
          size="sm"
          onClick={() => handleAssignPdiTechnician(carId)}
          className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/80"
        >
          Complete PDI
        </Button>
      </div>
    </div>
  );
};
