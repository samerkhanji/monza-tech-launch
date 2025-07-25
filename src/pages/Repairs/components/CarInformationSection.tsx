import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from '@/components/ui/calendar';
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { CustomCalendarIcon } from "@/components/icons/CustomCalendarIcon";
import { CAR_MODELS } from '@/types';
import { DateTimeInput } from '@/components/ui/datetime-input';

interface CarInformationSectionProps {
  carCode: string;
  setCarCode: (code: string) => void;
  arrivalDate: Date | undefined;
  setArrivalDate: (date: Date | undefined) => void;
  handleGenerateCarCode: (modelId: string) => void;
}

const CarInformationSection: React.FC<CarInformationSectionProps> = ({
  carCode,
  setCarCode,
  arrivalDate,
  setArrivalDate,
  handleGenerateCarCode,
}) => {
  const [arrivalDateState, setArrivalDateState] = useState<Date>();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Car Information</h3>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Car Model</label>
        <select 
          required
          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
          onChange={(e) => handleGenerateCarCode(e.target.value)}
        >
          <option value="">Select a car model</option>
          {CAR_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} {model.year}
            </option>
          ))}
        </select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Car Code</label>
        <Input 
          required
          placeholder="e.g., VF2401"
          value={carCode}
          onChange={(e) => setCarCode(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Customer Name</label>
        <Input 
          required
          placeholder="Enter customer name"
        />
      </div>
      
      {/* Arrival Date & Time */}
      <DateTimeInput
        label="Arrival Date & Time"
        value={arrivalDateState}
        onChange={(date) => setArrivalDateState(date)}
        required={true}
        showTime={true}
      />
    </div>
  );
};

export default CarInformationSection;
