import React, { useState } from 'react';
import { GarageCar } from '../types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Clock, Users, Wrench, FileText, X, Camera, TrendingUp } from 'lucide-react';
import PartNumberScannerDialog from '@/components/PartNumberScannerDialog';
import { workflowTrackingService } from '@/services/workflowTrackingService';
import { productivityTrackingService } from '@/services/productivityTrackingService';
import { useAuth } from '@/contexts/AuthContext';

interface CarDetailsProductivityDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedCar: GarageCar | null;
  onSave: (carId: string, updates: any) => void;
}

const CarDetailsProductivityDialog: React.FC<CarDetailsProductivityDialogProps> = ({
  isOpen,
  setIsOpen,
  selectedCar,
  onSave
}) => {
  const { user } = useAuth();
  const [issueDescription, setIssueDescription] = useState(selectedCar?.issueDescription || '');
  const [workNotes, setWorkNotes] = useState(selectedCar?.workNotes || '');
  const [partsUsed, setPartsUsed] = useState<string[]>(selectedCar?.partsUsed || []);
  const [newPart, setNewPart] = useState('');
  const [mechanics, setMechanics] = useState<string[]>(selectedCar?.mechanics || []);
  const [newMechanic, setNewMechanic] = useState('');
  const [startTimestamp, setStartTimestamp] = useState(
    selectedCar?.startTimestamp ? new Date(selectedCar.startTimestamp).toISOString().slice(0, 16) : ''
  );
  const [endTimestamp, setEndTimestamp] = useState(
    selectedCar?.endTimestamp ? new Date(selectedCar.endTimestamp).toISOString().slice(0, 16) : ''
  );
  
  // New productivity tracking fields
  const [workType, setWorkType] = useState<'electrical' | 'painter' | 'detailer' | 'mechanic' | 'body_work'>('mechanic');
  const [estimatedHours, setEstimatedHours] = useState<number>(8);
  const [actualHours, setActualHours] = useState<number>(0);
  const [estimatedCompletion, setEstimatedCompletion] = useState('');
  const [qualityIssues, setQualityIssues] = useState<string[]>([]);
  const [newQualityIssue, setNewQualityIssue] = useState('');
  const [productivityNotes, setProductivityNotes] = useState('');

  React.useEffect(() => {
    if (selectedCar) {
      setIssueDescription(selectedCar.issueDescription || '');
      setWorkNotes(selectedCar.workNotes || '');
      setPartsUsed(selectedCar.partsUsed || []);
      setMechanics(selectedCar.mechanics || []);
      setStartTimestamp(selectedCar.startTimestamp ? new Date(selectedCar.startTimestamp).toISOString().slice(0, 16) : '');
      setEndTimestamp(selectedCar.endTimestamp ? new Date(selectedCar.endTimestamp).toISOString().slice(0, 16) : '');
      
      // Set estimated completion to 8 hours after start if not set
      if (selectedCar.startTimestamp && !estimatedCompletion) {
        const start = new Date(selectedCar.startTimestamp);
        start.setHours(start.getHours() + estimatedHours);
        setEstimatedCompletion(start.toISOString().slice(0, 16));
      }
      
      // Calculate actual hours if both start and end are set
      if (selectedCar.startTimestamp && selectedCar.endTimestamp) {
        const start = new Date(selectedCar.startTimestamp);
        const end = new Date(selectedCar.endTimestamp);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        setActualHours(Math.round(hours * 100) / 100);
      }
    }
  }, [selectedCar]);

  const handlePartNumberScanned = (partNumber: string) => {
    setNewPart(partNumber);
    toast({
      title: "Part number scanned",
      description: `Part number ${partNumber} ready to add`,
    });
  };

  const addPart = () => {
    if (newPart.trim() && !partsUsed.includes(newPart.trim())) {
      setPartsUsed([...partsUsed, newPart.trim()]);
      setNewPart('');
    }
  };

  const removePart = (part: string) => {
    setPartsUsed(partsUsed.filter(p => p !== part));
  };

  const addMechanic = () => {
    if (newMechanic.trim() && !mechanics.includes(newMechanic.trim())) {
      setMechanics([...mechanics, newMechanic.trim()]);
      setNewMechanic('');
    }
  };

  const removeMechanic = (mechanic: string) => {
    setMechanics(mechanics.filter(m => m !== mechanic));
  };

  const addQualityIssue = () => {
    if (newQualityIssue.trim() && !qualityIssues.includes(newQualityIssue.trim())) {
      setQualityIssues([...qualityIssues, newQualityIssue.trim()]);
      setNewQualityIssue('');
    }
  };

  const removeQualityIssue = (issue: string) => {
    setQualityIssues(qualityIssues.filter(q => q !== issue));
  };

  const handleSave = async () => {
    if (!selectedCar) return;

    const updates = {
      issueDescription,
      workNotes,
      partsUsed,
      mechanics,
      startTimestamp: startTimestamp ? new Date(startTimestamp).toISOString() : selectedCar.startTimestamp,
      endTimestamp: endTimestamp ? new Date(endTimestamp).toISOString() : selectedCar.endTimestamp,
      lastUpdated: new Date().toISOString()
    };

    // Track productivity data if we have the necessary information
    if (startTimestamp && mechanics.length > 0) {
      try {
        const status: 'in_progress' | 'completed' | 'delayed' | 'cancelled' = endTimestamp ? 'completed' : 'in_progress';
        
        const productivityData = {
          carId: selectedCar.id,
          carCode: selectedCar.carCode,
          customerName: selectedCar.customerName,
          assignedMechanics: mechanics,
          workType: workType,
          estimatedHours: estimatedHours,
          actualHours: endTimestamp ? actualHours : undefined,
          estimatedStart: startTimestamp,
          actualStart: startTimestamp,
          estimatedCompletion: estimatedCompletion || new Date(Date.now() + estimatedHours * 60 * 60 * 1000).toISOString(),
          actualCompletion: endTimestamp || undefined,
          status: status,
          productivityNotes: productivityNotes,
          qualityIssues: qualityIssues
        };

        await productivityTrackingService.trackProductivity(productivityData);
        
        toast({
          title: "Productivity Tracked",
          description: "Car details and productivity metrics have been recorded for AI analysis.",
        });
      } catch (error) {
        console.error('Error tracking productivity:', error);
        toast({
          title: "Productivity Tracking Failed",
          description: "Car details saved but productivity tracking failed.",
          variant: "destructive"
        });
      }
    }

    onSave(selectedCar.id, updates);

    // Track client interaction
    await workflowTrackingService.trackClientInteraction({
      clientName: selectedCar.customerName,
      clientPhone: '',
      clientLicensePlate: '',
      carVin: selectedCar.carCode,
      interactionType: 'repair_update',
      notes: `Updated repair details: ${workNotes || 'No specific notes'}`,
      employee: user?.name || 'Unknown Employee'
    });

    // Track workflow event for repair update
    await workflowTrackingService.trackWorkflowEvent({
      eventType: 'repair_details_updated',
      entityType: 'repair',
      entityId: selectedCar.id,
      userName: user?.name || 'Unknown User',
      metadata: {
        carCode: selectedCar.carCode,
        customerName: selectedCar.customerName,
        partsCount: partsUsed.length,
        mechanicsCount: mechanics.length,
        workType: workType,
        estimatedHours: estimatedHours
      }
    });
    
    toast({
      title: "Details Updated",
      description: `Details for ${selectedCar.carCode} have been saved successfully.`,
    });
  };

  if (!selectedCar) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[900px] h-[90vh] bg-white opacity-100 flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Edit Car Details - {selectedCar.carModel} ({selectedCar.carCode})
          </DialogTitle>
          <DialogDescription>
            Update repair details, track productivity metrics, and manage team assignments.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Customer Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-medium text-blue-700">Customer Information</h3>
              </div>
              <p className="text-sm">Customer: {selectedCar.customerName}</p>
              <p className="text-sm">Assigned Employee: {selectedCar.assignedEmployee}</p>
              <p className="text-sm">Entry Date: {new Date(selectedCar.entryDate).toLocaleDateString()}</p>
            </div>

            {/* Productivity Tracking Section */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-medium text-green-700">Productivity Tracking</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workType">Work Type</Label>
                  <Select value={workType} onValueChange={(value: 'electrical' | 'painter' | 'detailer' | 'mechanic' | 'body_work') => setWorkType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select work type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electrical">Electrical</SelectItem>
                      <SelectItem value="painter">Painting</SelectItem>
                      <SelectItem value="detailer">Detailing</SelectItem>
                      <SelectItem value="mechanic">Mechanical</SelectItem>
                      <SelectItem value="body_work">Body Work</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedCompletion">Estimated Completion</Label>
                  <Input
                    id="estimatedCompletion"
                    type="datetime-local"
                    value={estimatedCompletion}
                    onChange={(e) => setEstimatedCompletion(e.target.value)}
                    className="repair-dialog"
                  />
                </div>
                {endTimestamp && (
                  <div className="space-y-2">
                    <Label htmlFor="actualHours">Actual Hours</Label>
                    <Input
                      id="actualHours"
                      type="number"
                      step="0.1"
                      min="0"
                      value={actualHours}
                      onChange={(e) => setActualHours(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Issue Description */}
            <div className="space-y-2">
              <Label htmlFor="issueDescription" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Issue Description
              </Label>
              <Textarea
                id="issueDescription"
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the issue with the vehicle..."
                className="min-h-[100px]"
              />
            </div>

            {/* Work Notes */}
            <div className="space-y-2">
              <Label htmlFor="workNotes" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Work Notes
              </Label>
              <Textarea
                id="workNotes"
                value={workNotes}
                onChange={(e) => setWorkNotes(e.target.value)}
                placeholder="Detailed work notes and observations..."
                className="min-h-[100px]"
              />
            </div>

            {/* Productivity Notes */}
            <div className="space-y-2">
              <Label htmlFor="productivityNotes" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Productivity Notes
              </Label>
              <Textarea
                id="productivityNotes"
                value={productivityNotes}
                onChange={(e) => setProductivityNotes(e.target.value)}
                placeholder="Notes about efficiency, delays, or productivity insights..."
                className="min-h-[80px]"
              />
            </div>

            {/* Quality Issues */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Quality Issues
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newQualityIssue}
                  onChange={(e) => setNewQualityIssue(e.target.value)}
                  placeholder="Add quality issue..."
                  onKeyPress={(e) => e.key === 'Enter' && addQualityIssue()}
                />
                <Button type="button" onClick={addQualityIssue}>Add Issue</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {qualityIssues.map((issue, index) => (
                  <Badge key={index} variant="destructive" className="flex items-center gap-1">
                    {issue}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeQualityIssue(issue)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Part Numbers Used */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Part Numbers Used
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newPart}
                  onChange={(e) => setNewPart(e.target.value)}
                  placeholder="Add part number..."
                  onKeyPress={(e) => e.key === 'Enter' && addPart()}
                  className="flex-1"
                />
                <PartNumberScannerDialog onPartNumberScanned={handlePartNumberScanned}>
                  <Button variant="outline" size="sm" type="button" title="Scan Part Number">
                    <Camera className="h-4 w-4" />
                  </Button>
                </PartNumberScannerDialog>
                <Button type="button" onClick={addPart}>Add Part</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {partsUsed.map((part, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    <span className="font-mono font-semibold">{part}</span>
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removePart(part)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Mechanics */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assigned Mechanics
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newMechanic}
                  onChange={(e) => setNewMechanic(e.target.value)}
                  placeholder="Add mechanic name..."
                  onKeyPress={(e) => e.key === 'Enter' && addMechanic()}
                />
                <Button type="button" onClick={addMechanic}>Add Mechanic</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {mechanics.map((mechanic, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {mechanic}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeMechanic(mechanic)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Time Tracking */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-medium text-green-700">Time Tracking</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={startTimestamp}
                    onChange={(e) => setStartTimestamp(e.target.value)}
                    className="repair-dialog"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={endTimestamp}
                    onChange={(e) => setEndTimestamp(e.target.value)}
                    className="repair-dialog"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex-shrink-0 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            Save & Track Productivity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CarDetailsProductivityDialog;
