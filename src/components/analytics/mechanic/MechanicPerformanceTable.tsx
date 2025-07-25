
import React from 'react';
import { Card } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { MechanicData } from './types';

interface MechanicPerformanceTableProps {
  data: MechanicData[];
}

const MechanicPerformanceTable: React.FC<MechanicPerformanceTableProps> = ({ data }) => {
  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-4">Detailed Mechanic Performance</h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mechanic Name</TableHead>
            <TableHead>Specialization</TableHead>
            <TableHead>Completed Repairs</TableHead>
            <TableHead>Avg. Repair Time</TableHead>
            <TableHead>On-Time Rate</TableHead>
            <TableHead>Most Repaired Car</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((mechanic) => (
            <TableRow key={mechanic.name}>
              <TableCell className="font-medium">{mechanic.name}</TableCell>
              <TableCell>{mechanic.specialization}</TableCell>
              <TableCell>{mechanic.completedRepairs}</TableCell>
              <TableCell>{mechanic.avgRepairTime} days</TableCell>
              <TableCell>{mechanic.onTimeRate}%</TableCell>
              <TableCell>{mechanic.mostRepairedCar}</TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                <p className="text-muted-foreground">No mechanics match your search criteria.</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};

export default MechanicPerformanceTable;
