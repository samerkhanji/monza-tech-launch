
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { FormField, FormControl } from '@/components/ui/form';
import { Wrench } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';

interface IssueDescriptionSectionProps {
  form: UseFormReturn<{
    notes: string;
    repairDuration: string;
    startTimestamp: string;
    endTimestamp: string;
    issueDescription: string;
  }>;
}

const IssueDescriptionSection: React.FC<IssueDescriptionSectionProps> = ({ form }) => {
  return (
    <div className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-100">
      <div className="flex items-center gap-2 mb-1">
        <Wrench className="h-4 w-4 text-red-600" />
        <h3 className="text-sm font-medium text-red-700">Issue Description</h3>
      </div>
      <FormField
        control={form.control}
        name="issueDescription"
        render={({ field }) => (
          <Textarea
            {...field}
            placeholder="Describe what's wrong with the car in detail..."
            className="min-h-[100px] border-red-200 focus:border-red-300"
          />
        )}
      />
    </div>
  );
};

export default IssueDescriptionSection;
