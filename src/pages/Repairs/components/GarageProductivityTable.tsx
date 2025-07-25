
import React, { useState } from 'react';
import { dateUtils, numberUtils, stringUtils, validationUtils } from '@/lib/utils';
import { GarageCar } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Clock, Users, Wrench, TrendingUp, Brain } from 'lucide-react';
import CarDetailsProductivityDialog from './CarDetailsProductivityDialog';
import AIProductivityDashboard from '@/components/AIProductivityDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GarageProductivityTableProps {
  cars: GarageCar[];
  isGarageManager: boolean;
}

const GarageProductivityTable: React.FC<GarageProductivityTableProps> = ({
  cars,
  isGarageManager
}) => {
  const [selectedCar, setSelectedCar] = useState<GarageCar | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Removed local formatDateTime - using dateUtils.formatDateTime from utils

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 'Ongoing';
    try {
      const hours = Math.round((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60));
      return `${hours}h`;
    } catch (e) {
      return 'N/A';
    }
  };

  const openDetails = (car: GarageCar) => {
    setSelectedCar(car);
    setDetailsOpen(true);
  };

  return (
    <>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Current Operations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Garage Productivity & Employee Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Car</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Team</TableHead>
                    <TableHead>Issue Description</TableHead>
                    <TableHead>Time Tracking</TableHead>
                    <TableHead>Productivity</TableHead>
                    {isGarageManager && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cars.map((car) => (
                    <TableRow key={car.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{car.carModel}</div>
                          <div className="text-sm text-muted-foreground">{car.carCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>{car.customerName}</TableCell>
                      <TableCell>
                        <Badge variant={
                          car.status === 'ready' ? 'default' :
                          car.status === 'in_repair' ? 'secondary' :
                          'outline'
                        }>
                          {car.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{car.assignedEmployee}</div>
                          {car.mechanics && car.mechanics.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {car.mechanics.map((mechanic, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {mechanic}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {car.issueDescription ? (
                            <div className="text-sm bg-red-50 p-2 rounded border border-red-100">
                              <Wrench className="h-3 w-3 inline mr-1" />
                              {car.issueDescription.length > 50 
                                ? car.issueDescription.substring(0, 50) + '...'
                                : car.issueDescription
                              }
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No description</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Arrived: {new Date(car.entryDate).toLocaleDateString()}</span>
                          </div>
                          {car.startTimestamp && (
                            <div>Started: {dateUtils.formatDateTime(car.startTimestamp)}</div>
                          )}
                          {car.endTimestamp && (
                            <div>Finished: {dateUtils.formatDateTime(car.endTimestamp)}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {car.startTimestamp && car.endTimestamp ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {calculateDuration(car.startTimestamp, car.endTimestamp)}
                            </Badge>
                          ) : car.startTimestamp ? (
                            <Badge variant="secondary">In Progress</Badge>
                          ) : (
                            <Badge variant="outline">Not Started</Badge>
                          )}
                          {car.estimatedCompletionTimestamp && (
                            <div className="text-xs text-muted-foreground">
                              Est: {dateUtils.formatDateTime(car.estimatedCompletionTimestamp)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {isGarageManager && (
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openDetails(car)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Details
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <AIProductivityDashboard />
        </TabsContent>
      </Tabs>

      {selectedCar && (
        <CarDetailsProductivityDialog
          isOpen={detailsOpen}
          setIsOpen={setDetailsOpen}
          selectedCar={selectedCar}
          onSave={(carId, updates) => {
            console.log('Saving car details:', carId, updates);
            setDetailsOpen(false);
          }}
        />
      )}
    </>
  );
};

export default GarageProductivityTable;
