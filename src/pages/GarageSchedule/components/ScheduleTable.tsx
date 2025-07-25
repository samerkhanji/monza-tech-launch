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
import { Button } from '@/components/ui/button';
import { Eye, Edit, Clock } from 'lucide-react';
import { CustomCalendarIcon } from '@/components/icons/CustomCalendarIcon';

interface ScheduleTableProps {
  schedules: any[];
  onScheduleClick: (schedule: any) => void;
  onEditSchedule?: (schedule: any) => void;
}

const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedules,
  onScheduleClick,
  onEditSchedule
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-yellow-600 text-white';
      case 'low': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-600 text-white';
      case 'in_progress': return 'bg-yellow-600 text-white';
      case 'completed': return 'bg-green-600 text-white';
      case 'cancelled': return 'bg-red-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <Card className="border border-gray-200 shadow-sm relative pb-2 border-b-monza-yellow border-b-4">
      <CardHeader className="bg-gray-800 border-b border-gray-700">
        <CardTitle className="text-white">Garage Schedule</CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
      <Table>
          <TableCaption>Scheduled garage operations and appointments</TableCaption>
        <TableHeader>
            <TableRow className="bg-gray-800 hover:bg-gray-700">
              <TableHead className="font-semibold text-white">Date</TableHead>
              <TableHead className="font-semibold text-white">Time</TableHead>
              <TableHead className="font-semibold text-white">Vehicle</TableHead>
              <TableHead className="font-semibold text-white">Customer</TableHead>
              <TableHead className="font-semibold text-white">Service Type</TableHead>
              <TableHead className="font-semibold text-white">Priority</TableHead>
              <TableHead className="font-semibold text-white">Status</TableHead>
              <TableHead className="font-semibold text-white">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schedules.length > 0 ? (
              schedules.map((schedule) => (
                <TableRow key={schedule.id} className="hover:bg-monza-yellow/10 transition-colors">
                  <TableCell className="text-gray-900">
                    {schedule.date ? new Date(schedule.date).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {schedule.time || schedule.startTime || 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium text-monza-black">
                    <div>
                      <div>{schedule.vehicleModel || schedule.carModel || 'N/A'}</div>
                      {schedule.vinNumber && (
                        <div className="text-sm text-gray-500 font-mono">{schedule.vinNumber}</div>
                      )}
                      </div>
                    </TableCell>
                  <TableCell className="text-gray-700">
                    {schedule.customerName || schedule.clientName || 'N/A'}
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {schedule.serviceType || schedule.workType || 'General Service'}
                    </TableCell>
                    <TableCell>
                    <Badge className={getPriorityColor(schedule.priority || 'medium')}>
                      {schedule.priority || 'Medium'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                    <Badge className={getStatusColor(schedule.status || 'scheduled')}>
                      {schedule.status || 'Scheduled'}
                          </Badge>
                    </TableCell>
                    <TableCell>
                    <div className="flex gap-1">
                        <Button 
                        size="sm" 
                          variant="outline" 
                        onClick={() => onScheduleClick(schedule)}
                        className="h-8 w-8 p-0 border-gray-300 text-gray-700 hover:bg-monza-yellow/20 hover:border-monza-yellow/30 hover:text-monza-black"
                        >
                        <Eye className="h-4 w-4" />
                        </Button>
                      {onEditSchedule && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => onEditSchedule(schedule)}
                          className="h-8 w-8 p-0 border-gray-300 text-gray-700 hover:bg-monza-yellow/20 hover:border-monza-yellow/30 hover:text-monza-black"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      </div>
                    </TableCell>
                  </TableRow>
              ))
          ) : (
            <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  No scheduled operations
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </CardContent>
    </Card>
  );
};

export default ScheduleTable;
