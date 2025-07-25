import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, User, FileText, Edit } from 'lucide-react';
import { Car } from '../types';

interface PdiInfoCardProps {
  car: Car;
  onEditPdi: () => void;
}

const PdiInfoCard: React.FC<PdiInfoCardProps> = ({ car, onEditPdi }) => {
  if (!car.pdiCompleted) {
    return null;
  }

  return (
    <Card className="mt-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-green-600" />
            PDI Information
          </div>
          <Button size="sm" variant="outline" onClick={onEditPdi}>
            <Edit className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {car.pdiTechnician && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">Technician:</span>
            <span>{car.pdiTechnician}</span>
          </div>
        )}
        
        {car.pdiDate && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Date:</span>
            <span>{new Date(car.pdiDate).toLocaleDateString()}</span>
          </div>
        )}
        
        {car.pdiNotes && (
          <div className="flex items-start gap-2 text-sm">
            <FileText className="h-3 w-3 text-muted-foreground mt-0.5" />
            <div>
              <span className="font-medium">Notes:</span>
              <p className="text-muted-foreground mt-1">{car.pdiNotes}</p>
            </div>
          </div>
        )}
        
        {car.pdiPhotos && car.pdiPhotos.length > 0 && (
          <div className="text-sm">
            <span className="font-medium">Photos:</span>
            <Badge variant="secondary" className="ml-2">
              {car.pdiPhotos.length} photo{car.pdiPhotos.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PdiInfoCard;
