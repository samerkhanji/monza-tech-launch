
import React, { useState } from 'react';
import { GarageCar, statusLabels } from '../../types';
import { Button } from '@/components/ui/button';
import { Clipboard, ClipboardCheck } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface StatusSectionProps {
  selectedCar: GarageCar;
  onStatusChange?: (status: GarageCar['status'], comments: string) => void;
}

const StatusSection: React.FC<StatusSectionProps> = ({ 
  selectedCar,
  onStatusChange 
}) => {
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<GarageCar['status']>(selectedCar.status);
  const [statusComments, setStatusComments] = useState('');

  const handleStatusSave = () => {
    if (onStatusChange) {
      onStatusChange(newStatus, statusComments);
      toast({
        title: "Status Updated",
        description: `Status changed to ${statusLabels[newStatus]}`,
      });
    }
    setIsChangingStatus(false);
    setStatusComments('');
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">Current Status</h4>
        {!isChangingStatus && onStatusChange && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsChangingStatus(true)}
            className="text-xs h-7"
          >
            <Clipboard className="h-3.5 w-3.5 mr-1" />
            Change Status
          </Button>
        )}
      </div>

      {isChangingStatus ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm">New Status:</label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as GarageCar['status'])}
            >
              <option value="in_diagnosis">In Diagnosis</option>
              <option value="in_repair">In Repair</option>
              <option value="in_quality_check">Quality Check</option>
              <option value="ready">Ready for Pickup</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm">Comments:</label>
            <Textarea
              value={statusComments}
              onChange={(e) => setStatusComments(e.target.value)}
              placeholder="Add comments about this status change..."
              className="min-h-[80px]"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsChangingStatus(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleStatusSave}
            >
              <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
              Save Status
            </Button>
          </div>
        </div>
      ) : (
        <p>
          <span className={`px-3 py-1.5 rounded text-sm font-medium ${
            selectedCar.status === 'in_diagnosis' ? 'bg-blue-100 text-blue-800' :
            selectedCar.status === 'in_repair' ? 'bg-orange-100 text-orange-800' :
            selectedCar.status === 'in_quality_check' ? 'bg-purple-100 text-purple-800' :
            selectedCar.status === 'ready' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {selectedCar.status && statusLabels[selectedCar.status]}
          </span>
        </p>
      )}
    </div>
  );
};

export default StatusSection;
