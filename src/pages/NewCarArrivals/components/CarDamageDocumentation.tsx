
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Camera, FileImage, AlertTriangle } from 'lucide-react';
import { NewCar } from '../types';

interface CarDamageDocumentationProps {
  car: NewCar;
  onUpdateNotes: (carId: string, notes: string) => void;
  onAddPhoto: (carId: string, photoUrl: string) => void;
}

export const CarDamageDocumentation: React.FC<CarDamageDocumentationProps> = ({
  car,
  onUpdateNotes,
  onAddPhoto
}) => {
  const [showDamageDialog, setShowDamageDialog] = useState(false);
  const [notes, setNotes] = useState(car.notes || '');

  const handleSaveNotes = () => {
    onUpdateNotes(car.id, notes);
    setShowDamageDialog(false);
  };

  const damageCount = car.damages?.length || 0;
  const hasDamages = car.hasDamages || damageCount > 0;

  return (
    <>
      <div className="flex flex-col gap-1">
        {hasDamages && (
          <Badge variant="destructive" className="text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {damageCount} Damage{damageCount !== 1 ? 's' : ''}
          </Badge>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDamageDialog(true)}
          className="text-xs"
        >
          <FileImage className="h-3 w-3 mr-1" />
          Document
        </Button>
      </div>

      <Dialog open={showDamageDialog} onOpenChange={setShowDamageDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Document Car Condition - {car.model}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm"><strong>VIN:</strong> {car.vin || car.vinNumber}</p>
              <p className="text-sm"><strong>Model:</strong> {car.model}</p>
              <p className="text-sm"><strong>Color:</strong> {car.color}</p>
            </div>

            {hasDamages && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Reported Damages:</h4>
                {car.damages?.map((damage, index) => (
                  <div key={damage.id || index} className="bg-red-50 p-2 rounded border border-red-200">
                    <p className="text-sm font-medium">{damage.description}</p>
                    <p className="text-xs text-gray-600">
                      Location: {damage.location} | Severity: {damage.severity}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes:</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document any additional observations about the car condition..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDamageDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNotes} className="bg-monza-yellow text-monza-black hover:bg-monza-yellow/80">
                Save Documentation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
