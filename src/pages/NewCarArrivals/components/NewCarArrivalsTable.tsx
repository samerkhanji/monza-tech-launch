import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Car, CheckCircle, Clock } from 'lucide-react';
import { EnhancedVehicle } from '@/types';
import ActionDropdown from '@/components/ui/ActionDropdown';

interface NewCarArrivalsTableProps {
  vehicles: EnhancedVehicle[];
  onVehicleClick: (vehicle: EnhancedVehicle) => void;
  onEditVehicle?: (vehicle: EnhancedVehicle) => void;
}

const NewCarArrivalsTable: React.FC<NewCarArrivalsTableProps> = ({
  vehicles,
  onVehicleClick,
  onEditVehicle
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'EV': return 'bg-green-600 text-white';
      case 'REV': return 'bg-blue-600 text-white';
      case 'ICEV': return 'bg-amber-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getTaxStatusColor = (status: string) => {
    return status === 'paid' ? 'bg-green-600 text-white' : 'bg-red-600 text-white';
  };

  return (
    <Card className="border border-gray-200 shadow-sm relative pb-2 border-b-monza-yellow border-b-4">
      <CardHeader className="bg-gray-800 border-b border-gray-700">
        <CardTitle className="text-white">New Car Arrivals</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
    <Table>
          <TableCaption>Recently arrived vehicles pending processing</TableCaption>
          <TableHeader>
            <TableRow className="bg-gray-800 hover:bg-gray-700">
              <TableHead className="font-semibold text-white">VIN</TableHead>
              <TableHead className="font-semibold text-white">Model</TableHead>
              <TableHead className="font-semibold text-white">Year</TableHead>
              <TableHead className="font-semibold text-white">Color</TableHead>
              <TableHead className="font-semibold text-white">Category</TableHead>
              <TableHead className="font-semibold text-white">Tax Status</TableHead>
              <TableHead className="font-semibold text-white">Battery</TableHead>
              <TableHead className="font-semibold text-white">Arrival Date</TableHead>
              <TableHead className="font-semibold text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
      <TableBody>
            {vehicles.length > 0 ? (
              vehicles.map((vehicle) => (
                <TableRow key={vehicle.id} className="hover:bg-monza-yellow/10 transition-colors">
                  <TableCell className="font-mono text-sm text-gray-900">{vehicle.vinNumber}</TableCell>
                  <TableCell className="font-medium text-monza-black">
                    <div>
                      {vehicle.brand && <div className="text-sm text-gray-500">{vehicle.brand}</div>}
                      <div>{vehicle.model}</div>
                      {vehicle.customModelName && <div className="text-sm text-gray-500">{vehicle.customModelName}</div>}
              </div>
            </TableCell>
                  <TableCell className="text-gray-700">{vehicle.year}</TableCell>
                  <TableCell className="text-gray-700">{vehicle.color}</TableCell>
            <TableCell>
                    <Badge className={getCategoryColor(vehicle.category)}>
                      {vehicle.category}
                    </Badge>
            </TableCell>
            <TableCell>
                    <Badge className={getTaxStatusColor(vehicle.taxStatus)}>
                      {vehicle.taxStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {vehicle.batteryPercentage !== undefined ? `${vehicle.batteryPercentage}%` : 'N/A'}
            </TableCell>
                  <TableCell className="text-gray-700">
                    {new Date(vehicle.arrivalTimestamp).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ActionDropdown
                      options={[
                        { value: 'view', label: 'View Details' },
                        ...(onEditVehicle ? [{ value: 'edit', label: 'Edit Vehicle' }] : [])
                      ]}
                      onAction={(action) => {
                        if (action === 'view') onVehicleClick(vehicle);
                        else if (action === 'edit' && onEditVehicle) onEditVehicle(vehicle);
                      }}
                      ariaLabel={`Actions for ${vehicle.model} ${vehicle.vinNumber}`}
                    />
            </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-6 text-muted-foreground">
                  No new car arrivals to process
            </TableCell>
          </TableRow>
            )}
      </TableBody>
    </Table>
      </CardContent>
    </Card>
  );
};

export default NewCarArrivalsTable;
