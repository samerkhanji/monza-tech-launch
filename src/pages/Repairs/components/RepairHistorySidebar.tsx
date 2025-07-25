import React from 'react';
import { dateUtils, numberUtils, stringUtils, validationUtils } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, User, Wrench, FileText } from 'lucide-react';
import { CustomCalendarIcon } from '@/components/icons/CustomCalendarIcon';
import { GarageCar } from '../types';

interface RepairHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  repair: GarageCar;
  formatDateTime: (timestamp: string) => string;
}

const RepairHistorySidebar: React.FC<RepairHistorySidebarProps> = ({
  isOpen,
  onClose,
  repair,
  formatDateTime
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white opacity-100 flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {repair.carModel} - {repair.carCode}
          </SheetTitle>
          <SheetDescription>
            Detailed repair information and history
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="mt-6 space-y-6 pb-6">
            {/* Customer Information */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </h3>
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <p><strong>Customer:</strong> {repair.customerName}</p>
                <p><strong>Assigned Employee:</strong> {repair.assignedEmployee}</p>
                <p><strong>Status:</strong> 
                  <Badge variant="outline" className="ml-2">
                    {repair.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </p>
              </div>
            </div>
            
            <Separator />
            
            {/* Time Tracking */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Tracking
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Entry Date:</span>
                  <span className="text-sm">{new Date(repair.entryDate).toLocaleDateString()}</span>
                </div>
                {repair.startTimestamp && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Start Time:</span>
                    <span className="text-sm">{dateUtils.formatDateTime(repair.startTimestamp)}</span>
                  </div>
                )}
                {repair.endTimestamp && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">End Time:</span>
                    <span className="text-sm">{dateUtils.formatDateTime(repair.endTimestamp)}</span>
                  </div>
                )}
                {repair.repairDuration && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="text-sm">{repair.repairDuration}</span>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
            
            {/* Issue Description */}
            {repair.issueDescription && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Issue Description
                </h3>
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <p className="text-sm">{repair.issueDescription}</p>
                </div>
              </div>
            )}
            
            {/* Work Notes */}
            {repair.workNotes && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Work Notes
                </h3>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <p className="text-sm">{repair.workNotes}</p>
                </div>
              </div>
            )}
            
            {/* Part Numbers Used */}
            {repair.partsUsed && repair.partsUsed.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Part Numbers Used
                </h3>
                <div className="flex flex-wrap gap-2">
                  {repair.partsUsed.map((partNumber, index) => (
                    <Badge key={index} variant="secondary" className="font-mono font-semibold">
                      {partNumber}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Mechanics */}
            {repair.mechanics && repair.mechanics.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned Mechanics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {repair.mechanics.map((mechanic, index) => (
                    <Badge key={index} variant="outline">
                      {mechanic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default RepairHistorySidebar;
