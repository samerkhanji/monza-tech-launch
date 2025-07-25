import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from '@/components/ui/calendar';
import { format } from "date-fns";
import { CustomCalendarIcon } from "@/components/icons/CustomCalendarIcon";
import MechanicInput from './MechanicInput';
import MechanicsList from './MechanicsList';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimeInput } from '@/components/ui/datetime-input';

interface RepairDetailsSectionProps {
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  estimatedCompletionDate: Date | undefined;
  setEstimatedCompletionDate: (date: Date | undefined) => void;
  mechanics: string[];
  mechanicName: string;
  setMechanicName: (name: string) => void;
  addMechanic: () => void;
  removeMechanic: (mechanicName: string) => void;
}

const RepairDetailsSection: React.FC<RepairDetailsSectionProps> = ({
  startDate,
  setStartDate,
  estimatedCompletionDate,
  setEstimatedCompletionDate,
  mechanics,
  mechanicName,
  setMechanicName,
  addMechanic,
  removeMechanic
}) => {

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Repair Details</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Assigned Employee</label>
        <select 
          required
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="">Select an employee</option>
          <option value="Mark">Mark</option>
          <option value="Elie">Elie</option>
          <option value="Khalil">Khalil</option>
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Mechanics</label>
        <MechanicInput
          mechanicName={mechanicName}
          setMechanicName={setMechanicName}
          addMechanic={addMechanic}
        />
        
        <MechanicsList 
          mechanics={mechanics}
          onRemoveMechanic={removeMechanic}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Repair Stage</label>
        <select 
          required
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
          defaultValue="diagnosis"
        >
          <option value="diagnosis">Diagnosis</option>
          <option value="repair" disabled>Repair (After Diagnosis)</option>
          <option value="quality_check" disabled>Quality Check (After Repair)</option>
          <option value="ready" disabled>Ready (After Quality Check)</option>
        </select>
        <p className="text-xs text-muted-foreground mt-1">New repairs typically start in Diagnosis stage</p>
      </div>
      
      {/* Start Date & Time */}
      <DateTimeInput
        label="Start Date & Time"
        value={startDate}
        onChange={setStartDate}
        required={true}
        showTime={true}
      />
      
      {/* Estimated Completion Date & Time */}
      <DateTimeInput
        label="Estimated Completion Date & Time"
        value={estimatedCompletionDate}
        onChange={setEstimatedCompletionDate}
        required={false}
        showTime={true}
      />
    </div>
  );
};

export default RepairDetailsSection;
