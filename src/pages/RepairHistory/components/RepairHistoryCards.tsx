
import React from 'react';
import { dateUtils, numberUtils, stringUtils, validationUtils } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, Wrench, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { GarageCar } from '@/pages/Repairs/types';

interface RepairHistoryCardsProps {
  cars: GarageCar[];
  onViewDetails: (car: GarageCar) => void;
}

const RepairHistoryCards: React.FC<RepairHistoryCardsProps> = ({
  cars,
  onViewDetails,
}) => {
  // Removed local formatDateTime - using dateUtils.formatDateTime from utils

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_diagnosis': return 'Diagnosed';
      case 'in_repair': return 'Repaired';
      case 'in_quality_check': return 'Quality Checked';
      case 'ready': return 'Ready';
      case 'delivered': return 'Delivered';
      default: return status.replace('_', ' ').toUpperCase();
    }
  };

  if (cars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-medium">No completed repairs found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Completed garage work will appear here when cars are marked as delivered.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cars.map((car) => (
        <Card key={car.id} className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg flex items-center gap-2">
                <span>{car.carModel}</span>
                <span className="text-sm font-normal text-muted-foreground">({car.carCode})</span>
              </CardTitle>
              <Badge variant="secondary">
                {getStatusLabel(car.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{car.customerName}</p>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {/* Assigned Employee */}
            {car.assignedEmployee && (
              <div className="flex items-center gap-1 text-sm">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Assigned:</span>
                <span className="font-medium">{car.assignedEmployee}</span>
              </div>
            )}
            
            {/* Time tracking */}
            <div className="space-y-1">
              {car.startTimestamp && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Started:
                  </span>
                  <span className="text-xs">{dateUtils.formatDateTime(car.startTimestamp)}</span>
                </div>
              )}
              {car.endTimestamp && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Completed:
                  </span>
                  <span className="text-xs">{dateUtils.formatDateTime(car.endTimestamp)}</span>
                </div>
              )}
            </div>
            
            {/* Mechanics */}
            {car.mechanics && car.mechanics.length > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Wrench className="h-3 w-3" />
                <span className="truncate">{car.mechanics.join(', ')}</span>
              </div>
            )}
            
            {/* Issue Description */}
            <div className="flex items-start gap-1 text-sm text-muted-foreground">
              <FileText className="h-3 w-3 mt-0.5" />
              <span className="line-clamp-2">
                {car.issueDescription || car.workNotes || 'No description available'}
              </span>
            </div>
            
            {/* Parts Used */}
            {car.partsUsed && car.partsUsed.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {car.partsUsed.slice(0, 2).map((part, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-amber-50">
                    {part}
                  </Badge>
                ))}
                {car.partsUsed.length > 2 && (
                  <Badge variant="outline" className="text-xs bg-amber-50">
                    +{car.partsUsed.length - 2} more
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex justify-end pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => onViewDetails(car)}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RepairHistoryCards;
