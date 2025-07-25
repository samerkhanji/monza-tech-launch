
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Camera, FileImage } from 'lucide-react';
import { GarageCar } from '@/pages/Repairs/types';

interface RepairHistoryTableProps {
  repairs: GarageCar[];
  onViewDetails: (repair: GarageCar) => void;
  onViewPhotos: (repair: GarageCar, type: 'before' | 'after') => void;
}

const RepairHistoryTable: React.FC<RepairHistoryTableProps> = ({
  repairs,
  onViewDetails,
  onViewPhotos
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Car Model</TableHead>
            <TableHead>Car Code</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Photos</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repairs.map((repair) => (
            <TableRow key={repair.id}>
              <TableCell className="font-medium">{repair.carModel}</TableCell>
              <TableCell>{repair.carCode}</TableCell>
              <TableCell>{repair.customerName}</TableCell>
              <TableCell className="max-w-xs truncate">
                {repair.issueDescription || 'No description'}
              </TableCell>
              <TableCell>
                <Badge className={`${getStatusColor(repair.status)} text-white`}>
                  {repair.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                {repair.repairDuration || 'Not specified'}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {repair.beforePhotos && repair.beforePhotos.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewPhotos(repair, 'before')}
                      className="flex items-center gap-1"
                    >
                      <Camera className="h-3 w-3" />
                      Before ({repair.beforePhotos.length})
                    </Button>
                  )}
                  {repair.afterPhotos && repair.afterPhotos.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewPhotos(repair, 'after')}
                      className="flex items-center gap-1"
                    >
                      <FileImage className="h-3 w-3" />
                      After ({repair.afterPhotos.length})
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(repair)}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default RepairHistoryTable;
