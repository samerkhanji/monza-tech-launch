import React, { useState, useEffect } from 'react';
import { dateUtils, numberUtils, stringUtils, validationUtils } from '@/lib/utils';
import { GarageCar, statusLabels } from '../types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableCaption
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Clock, Info, Wrench, User, Car, Timer, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GarageTableProps {
  cars: GarageCar[];
  onUpdateStatus: (id: string, status: GarageCar['status']) => void;
  onOpenDetails: (car: GarageCar) => void;
}

const GarageTable: React.FC<GarageTableProps> = ({ 
  cars, 
  onUpdateStatus,
  onOpenDetails
}) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer every second for test drive displays
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTestDriveTime = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const elapsed = Math.floor((currentTime - start) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'in_diagnosis': return 'bg-blue-600 text-white';
      case 'in_repair': return 'bg-yellow-600 text-white';
      case 'in_quality_check': return 'bg-purple-600 text-white';
      case 'ready': return 'bg-green-600 text-white';
      case 'completed': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'in_diagnosis': return <AlertTriangle className="h-4 w-4" />;
      case 'in_repair': return <Wrench className="h-4 w-4" />;
      case 'in_quality_check': return <CheckCircle className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const calculateCompletionPercentage = (status: string): number => {
    switch (status) {
      case 'in_diagnosis': return 25;
      case 'in_repair': return 50;
      case 'in_quality_check': return 75;
      case 'ready': return 100;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm relative pb-2 border-b-monza-yellow border-b-4">
      <CardHeader className="bg-gray-800 border-b border-gray-700">
        <CardTitle className="text-white">Garage Operations</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
      <Table>
          <TableCaption>Vehicles currently in garage for repairs and maintenance</TableCaption>
        <TableHeader>
            <TableRow className="bg-gray-800 hover:bg-gray-700">
              <TableHead className="font-semibold text-white">VIN</TableHead>
              <TableHead className="font-semibold text-white">Model</TableHead>
              <TableHead className="font-semibold text-white">Customer</TableHead>
              <TableHead className="font-semibold text-white">Status</TableHead>
              <TableHead className="font-semibold text-white">Progress</TableHead>
              <TableHead className="font-semibold text-white">Estimated Completion</TableHead>
              <TableHead className="font-semibold text-white">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cars.length > 0 ? (
            cars.map((car) => (
                <TableRow key={car.id} className="hover:bg-monza-yellow/10 transition-colors">
                  <TableCell className="font-mono text-sm text-gray-900">{car.carCode}</TableCell>
                  <TableCell className="font-medium text-monza-black">{car.carModel}</TableCell>
                  <TableCell className="text-gray-700">{car.customerName || 'N/A'}</TableCell>
                <TableCell>
                    <Badge className={getStageColor(car.status)}>
                        <div className="flex items-center gap-1">
                        {getStageIcon(car.status)}
                        {statusLabels[car.status]}
                      </div>
                    </Badge>
                </TableCell>
                <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-monza-yellow h-2 rounded-full transition-all duration-300"
                          style={{ width: `${calculateCompletionPercentage(car.status)}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 min-w-[3rem]">
                        {calculateCompletionPercentage(car.status)}%
                      </span>
                    </div>
                </TableCell>
                  <TableCell className="text-gray-700">
                    {car.estimatedCompletionTimestamp 
                      ? new Date(car.estimatedCompletionTimestamp).toLocaleDateString()
                      : 'TBD'
                    }
                </TableCell>
                <TableCell>
                    <div className="flex gap-1">
                    <Button 
                        size="sm" 
                      variant="outline" 
                      onClick={() => onOpenDetails(car)}
                        className="h-8 w-8 p-0 border-gray-300 text-gray-700 hover:bg-monza-yellow/20 hover:border-monza-yellow/30 hover:text-monza-black"
                    >
                        <Info className="h-4 w-4" />
                    </Button>
                    <select 
                      className="h-8 w-full rounded-md border border-input bg-background px-3 text-xs"
                      value={car.status}
                      onChange={(e) => onUpdateStatus(car.id, e.target.value as any)}
                    >
                      <option disabled>Change Status</option>
                      <option value="in_diagnosis">In Diagnosis</option>
                      <option value="in_repair">In Repair</option>
                      <option value="in_quality_check">Quality Check</option>
                      <option value="ready">Ready for Pickup</option>
                    </select>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  No vehicles currently in garage operations
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </CardContent>
    </Card>
  );
};

export default GarageTable;
