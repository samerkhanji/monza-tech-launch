
import React from 'react';
import { dateUtils, numberUtils, stringUtils, validationUtils } from '@/lib/utils';
import { GarageCar } from '../../types';
import { User } from 'lucide-react';

interface CustomerInfoSectionProps {
  selectedCar: GarageCar;
}

const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({ selectedCar }) => {
  // Removed local formatDateTime - using dateUtils.formatDateTime from utils

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
      <div className="flex items-center gap-2 mb-3">
        <User className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-medium text-blue-700">Customer Information</h3>
      </div>
      <p className="text-sm mb-1"><strong>Name:</strong> {selectedCar.customerName}</p>
      <p className="text-xs text-muted-foreground">
        <strong>Entry Date:</strong> {dateUtils.formatDateTime(selectedCar.entryDate)}
        {selectedCar.expectedExitDate && ` | Expected Exit: ${selectedCar.expectedExitDate}`}
      </p>
    </div>
  );
};

export default CustomerInfoSection;
