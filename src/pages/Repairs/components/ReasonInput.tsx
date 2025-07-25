
import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface ReasonInputProps {
  reason: string;
  setReason: (reason: string) => void;
}

const ReasonInput: React.FC<ReasonInputProps> = ({ reason, setReason }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Reason for Change <span className="text-red-500">*</span>
      </label>
      <Textarea
        placeholder="Please explain why you're changing the mechanics"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="resize-none"
      />
    </div>
  );
};

export default ReasonInput;
