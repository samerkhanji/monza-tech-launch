import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Car } from '../types';
import { format } from 'date-fns';

interface TestDriveHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
}

const TestDriveHistoryDialog: React.FC<TestDriveHistoryDialogProps> = ({
  isOpen,
  onClose,
  car,
}) => {
  if (!car) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Scheduled</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Test Drive History - {car.model} ({car.vinNumber})</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {car.testDriveHistory?.map((testDrive, index) => {
                // Calculate actual duration from start and end times
                const startTime = new Date(testDrive.testDriveStartTime!);
                const endTime = testDrive.testDriveEndTime ? new Date(testDrive.testDriveEndTime) : null;
                const actualDuration = endTime ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) : null;
                
                return (
                  <TableRow key={index}>
                    <TableCell>
                      {format(startTime, 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {endTime ? format(endTime, 'MMM d, yyyy HH:mm') : (
                        <span className="text-orange-600 font-medium">In Progress</span>
                      )}
                    </TableCell>
                    <TableCell>{testDrive.testDriverName}</TableCell>
                    <TableCell>{testDrive.testDriverPhone}</TableCell>
                    <TableCell>
                      {actualDuration ? `${actualDuration} minutes` : (
                        <span className="text-orange-600">In Progress</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {testDrive.isOnTestDrive ? (
                        <Badge variant="default" className="bg-orange-100 text-orange-800">In Progress</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {testDrive.notes || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!car.testDriveHistory || car.testDriveHistory.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No test drive history available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestDriveHistoryDialog; 