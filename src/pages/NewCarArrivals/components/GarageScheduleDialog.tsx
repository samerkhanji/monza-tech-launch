import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { format, addDays, addHours } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { CustomCalendarIcon } from '@/components/icons/CustomCalendarIcon';
import { NewCarArrival } from '../types';

interface GarageScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: NewCarArrival | null;
  onSchedule: (
    estimatedHours: string,
    workType: 'electrical' | 'painter' | 'detailer' | 'mechanic' | 'body_work',
    priority: 'high' | 'medium' | 'low',
    targetDate: string,
    notes: string
  ) => void;
}

const GarageScheduleDialog: React.FC<GarageScheduleDialogProps> = ({
  open,
  onOpenChange,
  car,
  onSchedule
}) => {
  const [estimatedHours, setEstimatedHours] = useState('0');
  const [estimatedMinutes, setEstimatedMinutes] = useState('30');
  const [workType, setWorkType] = useState<'electrical' | 'painter' | 'detailer' | 'mechanic' | 'body_work'>('mechanic');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert hours and minutes to decimal hours
    const totalHours = parseFloat(estimatedHours) + (parseFloat(estimatedMinutes) / 60);
    const formattedTime = totalHours.toFixed(2);
    
    onSchedule(formattedTime, workType, priority, targetDate, notes);
    
    // Reset form
    setEstimatedHours('0');
    setEstimatedMinutes('30');
    setWorkType('mechanic');
    setPriority('medium');
    setTargetDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    onOpenChange(false);
  };

  const formatDisplayTime = () => {
    const hours = parseInt(estimatedHours);
    const minutes = parseInt(estimatedMinutes);
    
    if (hours === 0 && minutes === 0) return '0 minutes';
    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return hours === 1 ? '1 hour' : `${hours} hours`;
    
    const hourText = hours === 1 ? '1 hour' : `${hours} hours`;
    const minuteText = `${minutes} minutes`;
    return `${hourText} ${minuteText}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CustomCalendarIcon className="h-5 w-5" />
            Schedule Car for Garage
          </DialogTitle>
          <DialogDescription>
            Set Mark's time estimate and schedule details for {car?.vin} ({car?.model})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Est. Time
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="48"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(e.target.value)}
                      className="w-20"
                      required
                    />
                    <span className="text-sm text-muted-foreground">hours</span>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      step="5"
                      value={estimatedMinutes}
                      onChange={(e) => setEstimatedMinutes(e.target.value)}
                      className="w-20"
                      required
                    />
                    <span className="text-sm text-muted-foreground">minutes</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground ml-6">
                  Total: {formatDisplayTime()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="workType" className="text-right">
                Category
              </Label>
              <select
                id="workType"
                value={workType}
                onChange={(e) => setWorkType(e.target.value as any)}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="electrical">Electrical</option>
                <option value="painter">Painter</option>
                <option value="detailer">Detailer</option>
                <option value="mechanic">Mechanic</option>
                <option value="body_work">Body Work</option>
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Priority
              </Label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetDate" className="text-right">
                Schedule Date
              </Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                placeholder="Special instructions..."
              />
            </div>

            {car && (
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium mb-2">Car Details:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>VIN:</strong> {car.vin}</div>
                  <div><strong>Model:</strong> {car.model}</div>
                  <div><strong>Category:</strong> {car.category}</div>
                  <div><strong>Battery:</strong> {car.batteryPercentage}%</div>
                </div>
                {car.damages && car.damages.length > 0 && (
                  <div className="mt-2">
                    <strong>Damages:</strong> {car.damages.length} reported
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Schedule Car
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GarageScheduleDialog;
