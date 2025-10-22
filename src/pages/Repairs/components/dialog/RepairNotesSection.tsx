
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form';
import {  } from 'lucide-react';
import { CustomCalendarIcon } from '@/components/icons/CustomCalendarIcon';
import { UseFormReturn } from 'react-hook-form';

interface RepairNotesSectionProps {
  form: UseFormReturn<{
    notes: string;
    repairDuration: string;
    startTimestamp: string;
    endTimestamp: string;
    issueDescription: string;
  }>;
}

const RepairNotesSection: React.FC<RepairNotesSectionProps> = ({ form }) => {
  return (
    <div className="space-y-3 bg-green-50 p-4 rounded-lg border border-green-100">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-medium text-green-700">Repair Notes</h3>
      </div>
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <Textarea
            {...field}
            placeholder="Describe the repair issues and work performed..."
            className="min-h-[100px] border-green-200 focus:border-green-300"
          />
        )}
      />
    </div>
  );
};

export default RepairNotesSection;
