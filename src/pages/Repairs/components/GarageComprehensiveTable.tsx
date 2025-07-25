import React, { useState } from 'react';
import { dateUtils } from '@/lib/utils';
import { GarageCar, statusLabels } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Clock, Users, Wrench, Info, User } from 'lucide-react';
import CarDetailsProductivityDialog from './CarDetailsProductivityDialog';
import { useRepairStageManagement } from '../hooks/useRepairStageManagement';
import TableSearch from '@/components/ui/table-search';

interface GarageComprehensiveTableProps {
  cars: GarageCar[];
  onUpdateStatus: (id: string, status: GarageCar['status']) => void;
  isGarageManager: boolean;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

const GarageComprehensiveTable: React.FC<GarageComprehensiveTableProps> = ({
  cars,
  onUpdateStatus,
  isGarageManager,
  searchTerm,
  setSearchTerm
}) => {
  const [selectedCar, setSelectedCar] = useState<GarageCar | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [allCars, setAllCars] = useState<GarageCar[]>(cars);

  // Use the repair stage management hook for delivery handling
  const { changeCarStatus } = useRepairStageManagement(allCars, setAllCars);

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

  const getStatusColor = (status: GarageCar['status']) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'in_repair': return 'bg-orange-100 text-orange-800';
      case 'in_diagnosis': return 'bg-blue-100 text-blue-800';
      case 'in_quality_check': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (carId: string, newStatus: GarageCar['status']) => {
    const car = cars.find(c => c.id === carId);
    if (car) {
      // Use the stage management hook for delivery workflow
      changeCarStatus(car, newStatus);
      // Also call the parent handler
      onUpdateStatus(carId, newStatus);
    }
  };

  // Filter out delivered cars from the display
  const activeCars = cars.filter(car => car.status !== 'delivered');

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Garage Workflow & Employee Tracking Dashboard ({activeCars.length} active cars)
            </CardTitle>
            {searchTerm !== undefined && setSearchTerm && (
              <TableSearch
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search cars, customers, employees, issues..."
                className="w-full sm:w-auto"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car Details</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Team</TableHead>
                <TableHead>Issue & Work Notes</TableHead>
                <TableHead>Time Tracking</TableHead>
                <TableHead>Productivity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeCars.length > 0 ? (
                activeCars.map((car) => (
                  <TableRow key={car.id} className="hover:bg-amber-50/30">
                    <TableCell>
                      <div>
                        <div className="font-medium">{car.carModel}</div>
                        <div className="text-sm text-muted-foreground">Code: {car.carCode}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Entry: {new Date(car.entryDate).toLocaleDateString()}
                          {car.expectedExitDate && (
                            <div>Expected Exit: {car.expectedExitDate}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>{car.customerName}</TableCell>
                    
                    <TableCell>
                      <div className="space-y-2">
                        <Badge className={`text-xs ${getStatusColor(car.status)}`}>
                          {statusLabels[car.status]}
                        </Badge>
                        {car.statusComments && (
                          <div className="text-xs bg-gray-50 p-1.5 rounded border max-w-[200px]">
                            {car.statusComments.length > 50 
                              ? car.statusComments.substring(0, 50) + '...' 
                              : car.statusComments}
                          </div>
                        )}
                        <div className="mt-2">
                          <select 
                            className="h-7 w-full rounded-md border border-input bg-background px-2 text-xs"
                            value={car.status}
                            onChange={(e) => handleStatusChange(car.id, e.target.value as any)}
                          >
                            <option disabled>Change Status</option>
                            <option value="in_diagnosis">In Diagnosis</option>
                            <option value="in_repair">In Repair</option>
                            <option value="in_quality_check">Quality Check</option>
                            <option value="ready">Ready for Pickup</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">{car.assignedEmployee}</div>
                        {car.mechanics && car.mechanics.length > 0 && (
                          <div>
                            <div className="text-xs font-medium mb-1">Mechanics:</div>
                            <div className="flex flex-wrap gap-1">
                              {car.mechanics.map((mechanic, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {mechanic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {car.partsUsed && car.partsUsed.length > 0 && (
                          <div>
                            <div className="text-xs font-medium mb-1">Parts Used:</div>
                            <div className="text-xs text-muted-foreground">
                              {car.partsUsed.join(', ')}
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-2 max-w-xs">
                        {car.issueDescription && (
                          <div className="text-sm bg-red-50 p-2 rounded border border-red-100">
                            <div className="flex items-center gap-1 mb-1 text-xs font-semibold">
                              <Wrench className="h-3 w-3" />
                              Issue:
                            </div>
                            {car.issueDescription.length > 100 
                              ? car.issueDescription.substring(0, 100) + '...'
                              : car.issueDescription
                            }
                          </div>
                        )}
                        {car.workNotes && (
                          <div className="text-sm bg-amber-50 p-2 rounded border border-amber-100">
                            <div className="flex items-center gap-1 mb-1 text-xs font-semibold">
                              <User className="h-3 w-3" />
                              Work Notes:
                            </div>
                            {car.workNotes.length > 100 
                              ? car.workNotes.substring(0, 100) + '...' 
                              : car.workNotes}
                          </div>
                        )}
                        {!car.issueDescription && !car.workNotes && (
                          <span className="text-muted-foreground text-sm">No notes available</span>
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
                          <div className="text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100">
                            Started: {dateUtils.formatDateTime(car.startTimestamp)}
                          </div>
                        )}
                        {car.endTimestamp && (
                          <div className="text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                            Finished: {dateUtils.formatDateTime(car.endTimestamp)}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          Updated: {new Date(car.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {car.startTimestamp && car.endTimestamp ? (
                          <Badge variant="default">
                            {calculateDuration(car.startTimestamp, car.endTimestamp)}
                          </Badge>
                        ) : car.startTimestamp ? (
                          <Badge variant="secondary">In Progress</Badge>
                        ) : (
                          <Badge variant="outline">Not Started</Badge>
                        )}
                        {car.repairDuration && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Duration: {car.repairDuration}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDetails(car)}
                        >
                          <Info className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        {isGarageManager && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openDetails(car)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                    No cars found in the garage.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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

export default GarageComprehensiveTable;
