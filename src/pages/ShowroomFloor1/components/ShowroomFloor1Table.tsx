import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, MapPin, FileText, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { ShowroomCar } from './ShowroomCar';
import EditCarDialog from './EditCarDialog';
import MoveCarDialog from './MoveCarDialog';
import PdiViewDialog from './PdiViewDialog';
import SimpleTestDriveDialog from '@/components/SimpleTestDriveDialog';
import PortalActionDropdown from '@/components/ui/PortalActionDropdown';
import ITSoftwareUpdateDialog from '@/components/ITSoftwareUpdateDialog';
import KilometersUpdateDialog from '@/components/KilometersUpdateDialog';
import { kilometersService } from '@/services/kilometersService';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import EnhancedWarrantyBadge from '@/components/EnhancedWarrantyBadge';
import WarrantyFormDialog from '@/components/WarrantyFormDialog';
import { useWarrantyEditor } from '@/hooks/useWarrantyEditor';
import SoftwareModelColumn from '@/components/SoftwareModelColumn';

interface ShowroomFloor1TableProps {
  cars: ShowroomCar[];
  onRemoveFromShowroom: (car: ShowroomCar) => void;
  onManageCar: (car: ShowroomCar) => void;
  onMoveCar: (car: ShowroomCar, destination: string, notes?: string) => void;
}

const ShowroomFloor1Table: React.FC<ShowroomFloor1TableProps> = ({
  cars,
  onRemoveFromShowroom,
  onManageCar,
  onMoveCar
}) => {
  const [selectedCar, setSelectedCar] = useState<ShowroomCar | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showPdiDialog, setShowPdiDialog] = useState(false);
  const [showTestDriveDialog, setShowTestDriveDialog] = useState(false);
  const [showSoftwareDialog, setShowSoftwareDialog] = useState(false);
  const [softwareSelectedCar, setSoftwareSelectedCar] = useState<ShowroomCar | null>(null);
  const [showKilometersDialog, setShowKilometersDialog] = useState(false);
  const [kilometersSelectedCar, setKilometersSelectedCar] = useState<ShowroomCar | null>(null);
  const { toast } = useToast();

  // Warranty editor hook
  const warrantyEditor = useWarrantyEditor((carId: string, warrantyData: any) => {
    // Handle warranty updates
    console.log('Warranty updated for car:', carId, warrantyData);
    // You can add logic here to refresh the car data or update local state
  });

  const handleEditCar = (carId: string, updates: Partial<ShowroomCar>) => {
    // This would be handled by the parent component
    console.log('Edit car:', carId, updates);
  };

  const handleMoveCar = (destination: string, notes?: string) => {
    if (selectedCar) {
      console.log('Move car:', selectedCar.id, 'to:', destination, 'notes:', notes);
      // Call the actual move car function from parent
      onMoveCar(selectedCar, destination, notes);
    }
    setShowMoveDialog(false);
    setSelectedCar(null);
  };

  const handleScheduleTestDrive = (carId: string, testDriveInfo: any) => {
    console.log('Schedule test drive:', carId, testDriveInfo);
  };

  const handleSoftwareClick = (car: ShowroomCar) => {
    setSoftwareSelectedCar(car);
    setShowSoftwareDialog(true);
  };

  const handleSoftwareUpdateComplete = (carVin: string, updateData: any) => {
    console.log('Software update completed for car:', carVin, updateData);
    // Here you would typically update the car data in your state/database
    // For now, we'll just log it
    setSoftwareSelectedCar(null);
    setShowSoftwareDialog(false);
  };

  const handleKilometersClick = (car: ShowroomCar) => {
    setKilometersSelectedCar(car);
    setShowKilometersDialog(true);
  };

  const handleKilometersUpdate = async (carId: string, kilometers: number) => {
    try {
      if (kilometersSelectedCar) {
        await kilometersService.updateKilometersDriven(
          carId,
          kilometersSelectedCar.vinNumber,
          kilometersSelectedCar.model,
          kilometers
        );
        
        // Trigger a re-render by calling the parent's onManageCar
        onManageCar(kilometersSelectedCar);
      }
    } catch (error) {
      console.error('Error updating kilometers:', error);
    } finally {
      setKilometersSelectedCar(null);
      setShowKilometersDialog(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-600 text-white'; // Green for Available
      case 'reserved':
        return 'bg-amber-600 text-white'; // Amber for Reserved
      case 'sold':
        return 'bg-red-600 text-white'; // Red for Sold
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'Available';
      case 'reserved':
        return 'Reserved';
      case 'sold':
        return 'Sold';
      default:
        return status;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'EV':
        return 'category-ev'; // Electric Vehicle
      case 'REV':
        return 'category-rev'; // Range Extended Vehicle
      case 'ICEV':
        return 'category-icev'; // Internal Combustion Engine Vehicle
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <>
      <Card className="border border-gray-200 shadow-sm relative pb-2 border-b-monza-yellow border-b-4">
        <CardHeader className="bg-gray-800 border-b border-gray-700">
          <CardTitle className="text-white">Vehicles on Floor 1</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableCaption>Electric and hybrid vehicles on display</TableCaption>
            <TableHeader>
              <TableRow className="bg-gray-800 hover:bg-gray-700">
                <TableHead className="font-semibold text-white">VIN</TableHead>
                <TableHead className="font-semibold text-white">Model</TableHead>
                <TableHead className="font-semibold text-white">Category</TableHead>
                <TableHead className="font-semibold text-white">Year</TableHead>
                <TableHead className="font-semibold text-white">Color</TableHead>
                <TableHead className="font-semibold text-white">Color interior</TableHead>
                <TableHead className="font-semibold text-white">Price</TableHead>
                <TableHead className="font-semibold text-white">Status</TableHead>
                <TableHead className="font-semibold text-white">Warranty Life</TableHead>
                <TableHead className="font-semibold text-white">Battery</TableHead>
                <TableHead className="font-semibold text-white">Range Capacity</TableHead>
                <TableHead className="font-semibold text-white">Km Driven</TableHead>
                <TableHead className="font-semibold text-white">Horsepower</TableHead>
                <TableHead className="font-semibold text-white">Torque</TableHead>
                <TableHead className="font-semibold text-white">0-100 km/h</TableHead>
                <TableHead className="font-semibold text-white">Top Speed</TableHead>
                <TableHead className="font-semibold text-white">Test Drive</TableHead>
                <TableHead className="font-semibold text-white">PDI</TableHead>
                <TableHead className="font-semibold text-white">Customs</TableHead>
                <TableHead className="font-semibold text-white">Software Model</TableHead>
                <TableHead className="font-semibold text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.length > 0 ? (
                cars.map((car) => (
                  <TableRow key={car.id} className="hover:bg-monza-yellow/10 transition-colors">
                    <TableCell className="font-mono text-sm text-gray-900">{car.vinNumber}</TableCell>
                    <TableCell className="font-medium text-monza-black">{car.model}</TableCell>
                    <TableCell className="text-gray-700">
                      <Badge className={getCategoryColor(car.category)}>
                        {car.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">{car.year}</TableCell>
                    <TableCell className="text-gray-700">{car.color}</TableCell>
                    <TableCell className="text-gray-700">{(car as any).interiorColor || (car as any).interior_color || '-'}</TableCell>
                    <TableCell className="text-gray-900">${car.price.toLocaleString()}</TableCell>
                    <TableCell>
                      {car.testDriveInfo?.isOnTestDrive ? (
                        <Badge className="bg-monza-yellow text-monza-black border border-monza-yellow/60">
                          Test Drive
                        </Badge>
                      ) : (
                        <Badge className={getStatusColor(car.status)}>
                          {getStatusDisplayName(car.status)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <EnhancedWarrantyBadge
                        warranty_life={(car as any).warranty_life}
                        delivery_date={(car as any).delivery_date}
                        vehicle_expiry_date={(car as any).vehicle_expiry_date}
                        battery_expiry_date={(car as any).battery_expiry_date}
                        dms_deadline_date={(car as any).dms_deadline_date}
                        compact={true}
                        onClick={() => {
                          warrantyEditor.openWarrantyDialog(
                            car.id,
                            'cars',
                            {
                              warranty_life: (car as any).warranty_life,
                              delivery_date: (car as any).delivery_date,
                              vehicle_expiry_date: (car as any).vehicle_expiry_date,
                              battery_expiry_date: (car as any).battery_expiry_date,
                              dms_deadline_date: (car as any).dms_deadline_date
                            }
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {car.batteryPercentage ? `${car.batteryPercentage}%` : '-'}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {(car as any).range ? `${(car as any).range} km` : '300 km'}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      <div 
                        className="flex items-center gap-1 cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors rounded px-2 py-1"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleKilometersClick(car);
                        }}
                        title="Click to update kilometers driven"
                      >
                        <MapPin className="h-4 w-4" />
                        {kilometersService.getKilometersDriven(car.id)} km
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {(car as any).horsePower ? `${(car as any).horsePower} HP` : '350 HP'}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {(car as any).torque ? `${(car as any).torque} Nm` : '500 Nm'}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {(car as any).acceleration ? `${(car as any).acceleration}s` : '4.5s'}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {(car as any).topSpeed ? `${(car as any).topSpeed} km/h` : '250 km/h'}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {car.testDriveInfo?.isOnTestDrive ? (
                        <Badge className="bg-monza-yellow text-monza-black border border-monza-yellow/60">
                          Test Drive
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs text-yellow-700 bg-yellow-100 hover:bg-yellow-200 transition-colors">
                          Not Tested
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {car.testDriveInfo?.isOnTestDrive ? (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          Test Drive Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 text-gray-500">
                          Available
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      <Badge className={(car as any).pdiCompleted ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}>
                        {(car as any).pdiCompleted ? (
                          <><span className="mr-1 text-lg">☺</span> Complete</>
                        ) : (
                          <><span className="mr-1 text-lg">☹</span> Pending</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      <Badge variant={(car as any).customs === 'paid' ? 'default' : 'destructive'}>
                        {(car as any).customs === 'paid' ? 'Paid' : 'Not Paid'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      <SoftwareModelColumn
                        softwareVersion={(car as any).softwareVersion}
                        softwareLastUpdated={(car as any).softwareLastUpdated}
                        softwareUpdateBy={(car as any).softwareUpdateBy}
                        softwareUpdateNotes={(car as any).softwareUpdateNotes}
                        compact={true}
                        editable={true}
                        carId={car.id}
                        onSave={(softwareData) => {
                          handleEditCar(car.id, {
                            softwareVersion: softwareData.softwareVersion,
                            softwareLastUpdated: softwareData.softwareLastUpdated,
                            softwareUpdateBy: softwareData.softwareUpdateBy,
                            softwareUpdateNotes: softwareData.softwareUpdateNotes
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <PortalActionDropdown
                        options={[
                          { value: 'edit', label: 'Edit Car' },
                          ...((!car.testDriveInfo?.isOnTestDrive && car.status === 'in_stock') 
                            ? [{ value: 'test_drive', label: 'Test Drive' }] 
                            : []
                          ),
                          { value: 'move', label: 'Move Car' },
                          { value: 'pdi', label: 'PDI Checklist' },
                          { value: 'remove', label: 'Remove' }
                        ]}
                        onAction={(action) => {
                          if (action === 'edit') {
                            setSelectedCar(car);
                            setShowEditDialog(true);
                          } else if (action === 'test_drive') {
                            setSelectedCar(car);
                            setShowTestDriveDialog(true);
                          } else if (action === 'move') {
                            setSelectedCar(car);
                            setShowMoveDialog(true);
                          } else if (action === 'pdi') {
                            setSelectedCar(car);
                            setShowPdiDialog(true);
                          } else if (action === 'remove') {
                            onRemoveFromShowroom(car);
                          }
                        }}
                        id={`actions-${car.id}`}
                        ariaLabel={`Actions for ${car.model} ${car.vinNumber}`}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={18} className="text-center py-6 text-muted-foreground">
                    No vehicles on Floor 1. Add cars using the buttons above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedCar && (
        <>
          <EditCarDialog
            isOpen={showEditDialog}
            onClose={() => {
              setShowEditDialog(false);
              setSelectedCar(null);
            }}
            car={selectedCar}
            onSave={handleEditCar}
          />

          <MoveCarDialog
            isOpen={showMoveDialog}
            onClose={() => {
              setShowMoveDialog(false);
              setSelectedCar(null);
            }}
            car={selectedCar}
            onMoveCar={handleMoveCar}
          />

          <PdiViewDialog
            isOpen={showPdiDialog}
            onClose={() => {
              setShowPdiDialog(false);
              setSelectedCar(null);
            }}
            car={selectedCar}
          />

          <SimpleTestDriveDialog
            isOpen={showTestDriveDialog}
            onClose={() => {
              setShowTestDriveDialog(false);
              setSelectedCar(null);
            }}
            car={selectedCar}
            onStartTestDrive={handleScheduleTestDrive}
            onEndTestDrive={(carId) => console.log('End test drive:', carId)}
          />
        </>
      )}

      {/* Software Update Dialog */}
      <ITSoftwareUpdateDialog
        isOpen={showSoftwareDialog}
        onClose={() => {
          setShowSoftwareDialog(false);
          setSoftwareSelectedCar(null);
        }}
        car={softwareSelectedCar ? {
          vinNumber: softwareSelectedCar.vinNumber,
          model: softwareSelectedCar.model,
          currentVersion: (softwareSelectedCar as any).softwareVersion,
          lastUpdated: (softwareSelectedCar as any).softwareLastUpdated,
          lastUpdatedBy: (softwareSelectedCar as any).softwareUpdateBy,
          notes: (softwareSelectedCar as any).softwareUpdateNotes,
          needsUpdate: !(softwareSelectedCar as any).softwareVersion,
          priority: !(softwareSelectedCar as any).softwareVersion ? 'critical' : 'medium'
        } : null}
        onUpdateComplete={handleSoftwareUpdateComplete}
      />

      {/* Kilometers Update Dialog */}
      <KilometersUpdateDialog
        isOpen={showKilometersDialog}
        onClose={() => {
          setShowKilometersDialog(false);
          setKilometersSelectedCar(null);
        }}
        car={kilometersSelectedCar ? {
          id: kilometersSelectedCar.id,
          vinNumber: kilometersSelectedCar.vinNumber,
          model: kilometersSelectedCar.model,
          year: kilometersSelectedCar.year,
          currentKilometers: (kilometersSelectedCar as any).kilometersDriven
        } : null}
        onUpdate={handleKilometersUpdate}
      />

      {/* Warranty Form Dialog */}
      <WarrantyFormDialog
        isOpen={warrantyEditor.isWarrantyDialogOpen}
        onClose={warrantyEditor.closeWarrantyDialog}
        carId={warrantyEditor.selectedCarId || ''}
        tableName={warrantyEditor.selectedTableName || 'cars'}
        currentWarranty={warrantyEditor.selectedCarWarranty || undefined}
        onSave={warrantyEditor.handleWarrantySave}
      />
    </>
  );
};

export default ShowroomFloor1Table;
