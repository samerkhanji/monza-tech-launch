import React from 'react';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Clock } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import RepairDuration from '../RepairDuration';
import { Label } from '@/components/ui/label';

interface TimeTrackingSectionProps {
  form: UseFormReturn<{
    notes: string;
    repairDuration: string;
    startTimestamp: string;
    endTimestamp: string;
    issueDescription: string;
  }>;
}

const TimeTrackingSection: React.FC<TimeTrackingSectionProps> = ({ form }) => {
  return (
    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
      <div className="flex items-center gap-2 mb-1">
        <Clock className="h-4 w-4 text-slate-600" />
        <h3 className="text-sm font-medium text-slate-700">Time Tracking</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
                  <Input
            id="startTime"
                    type="datetime-local"
            value={form.watch('startTimestamp')}
            onChange={(e) => form.setValue('startTimestamp', e.target.value)}
            className="repair-dialog"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
                  <Input
            id="endTime"
                    type="datetime-local"
            value={form.watch('endTimestamp')}
            onChange={(e) => form.setValue('endTimestamp', e.target.value)}
            className="repair-dialog"
            min={form.watch('startTimestamp')}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <FormField
          control={form.control}
          name="repairDuration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Repair Duration</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g., 3-4 days"
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      
      {form.watch('startTimestamp') && form.watch('endTimestamp') && (
        <div className="bg-white p-3 rounded border">
          <h4 className="text-sm font-medium mb-1">Calculated Repair Duration:</h4>
          <RepairDuration 
            startTimestamp={new Date(form.watch('startTimestamp')).toISOString()} 
            endTimestamp={new Date(form.watch('endTimestamp')).toISOString()} 
          />
        </div>
      )}
    </div>
  );
};

export default TimeTrackingSection;
