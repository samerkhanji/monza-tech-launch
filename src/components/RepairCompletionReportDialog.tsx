import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Camera, 
  FileText, 
  Save, 
  Wrench, 
  CheckCircle,
  Car
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import RepairPhotoCapture from './RepairPhotoCapture';

interface RepairCompletionReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  carData?: {
    id: string;
    carCode: string;
    carModel: string;
    customerName: string;
    assignedMechanic: string;
    workType: string;
    estimatedHours: number;
    issue?: string;
    startTime?: string;
  };
  onReportSubmitted?: (reportData: any) => void;
}

interface RepairPhoto {
  id: string;
  dataUrl: string;
  timestamp: string;
  description: string;
  photoType: 'before' | 'after' | 'during' | 'issue';
  mechanicName: string;
  issueCategory: string;
  severity: 'minor' | 'moderate' | 'severe';
}

const RepairCompletionReportDialog: React.FC<RepairCompletionReportDialogProps> = ({
  isOpen,
  onClose,
  carData,
  onReportSubmitted
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    issue_description: carData?.issue || '',
    solution_description: '',
    actual_hours: 0,
    technician_name: carData?.assignedMechanic || '',
    quality_rating: 5,
    warranty_period: 6,
  });

  const [repairPhotos, setRepairPhotos] = useState<RepairPhoto[]>([]);

  const steps = [
    { id: 0, title: 'Repair Details', icon: Wrench },
    { id: 1, title: 'Photo Documentation', icon: Camera },
    { id: 2, title: 'Quality Review', icon: CheckCircle }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 0:
        return formData.issue_description && formData.solution_description && formData.actual_hours > 0;
      case 1:
        return repairPhotos.length > 0;
      case 2:
        return formData.quality_rating > 0 && formData.technician_name;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    } else {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const repairData = {
        ...formData,
        car_vin: carData?.carCode || 'UNKNOWN',
        car_model: carData?.carModel || '',
        client_name: carData?.customerName || '',
        photos: repairPhotos,
      };

      toast({
        title: "Repair Report Saved",
        description: "Repair documentation has been saved successfully.",
      });

      if (onReportSubmitted) {
        onReportSubmitted(repairData);
      }

      onClose();
      
    } catch (error) {
      console.error('Error saving repair report:', error);
      toast({
        title: "Save Error",
        description: "Failed to save repair report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Repair Completion Report
            {carData && (
              <Badge variant="outline" className="ml-2">
                {carData.carCode}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between py-4 border-b">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                index === currentStep 
                  ? 'bg-blue-100 text-blue-800' 
                  : index < currentStep 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
              }`}>
                <step.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  index < currentStep ? 'bg-green-300' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        <ScrollArea className="flex-1 px-1">
          {currentStep === 0 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Car & Repair Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Car Code</Label>
                      <Input value={carData?.carCode || ''} disabled />
                    </div>
                    <div>
                      <Label>Car Model</Label>
                      <Input value={carData?.carModel || ''} disabled />
                    </div>
                    <div>
                      <Label>Customer Name</Label>
                      <Input value={carData?.customerName || ''} disabled />
                    </div>
                    <div>
                      <Label>Technician Name</Label>
                      <Input 
                        value={formData.technician_name}
                        onChange={(e) => handleInputChange('technician_name', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Issue Description *</Label>
                    <Textarea
                      value={formData.issue_description}
                      onChange={(e) => handleInputChange('issue_description', e.target.value)}
                      placeholder="Describe the original issue..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>Solution Description *</Label>
                    <Textarea
                      value={formData.solution_description}
                      onChange={(e) => handleInputChange('solution_description', e.target.value)}
                      placeholder="Describe how the repair was completed..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>Actual Hours Worked *</Label>
                    <Input 
                      type="number" 
                      step="0.5"
                      value={formData.actual_hours}
                      onChange={(e) => handleInputChange('actual_hours', Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Photo Documentation
                    <Badge variant="outline" className="ml-2">
                      {repairPhotos.length} photos captured
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Required:</strong> Please take before and after photos to document the repair process.
                      This helps with quality control and future reference.
                    </p>
                  </div>
                  
                  <RepairPhotoCapture
                    car={{
                      id: carData?.id || '1',
                      carCode: carData?.carCode || '',
                      carModel: carData?.carModel || '',
                      customerName: carData?.customerName || '',
                      assignedEmployee: formData.technician_name,
                      status: 'in_repair',
                      issueDescription: formData.issue_description,
                      repairDuration: '',
                      startTimestamp: '',
                      endTimestamp: undefined,
                      completionPercentage: 50,
                      repairStage: 'in_progress',
                      lastUpdated: new Date().toISOString(),
                      workNotes: formData.solution_description,
                      statusComments: '',
                      beforePhotos: [],
                      afterPhotos: []
                    }}
                    mechanicName={formData.technician_name}
                    onPhotosUpdate={(photos) => {
                      // Convert RepairPhoto to our format
                      const convertedPhotos = photos.map(photo => ({
                        ...photo,
                        issueCategory: carData?.workType || '',
                        severity: 'minor' as const
                      }));
                      setRepairPhotos(convertedPhotos);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Quality Review & Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Quality Rating</Label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded"
                      value={formData.quality_rating}
                      onChange={(e) => handleInputChange('quality_rating', Number(e.target.value))}
                    >
                      <option value={5}>★★★★★ Excellent</option>
                      <option value={4}>★★★★☆ Good</option>
                      <option value={3}>★★★☆☆ Average</option>
                      <option value={2}>★★☆☆☆ Below Average</option>
                      <option value={1}>★☆☆☆☆ Poor</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label>Warranty Period (Months)</Label>
                    <Input 
                      type="number" 
                      value={formData.warranty_period}
                      onChange={(e) => handleInputChange('warranty_period', Number(e.target.value))}
                    />
                  </div>

                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800 text-lg">Repair Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div><strong>Car:</strong> {carData?.carCode} - {carData?.carModel}</div>
                      <div><strong>Customer:</strong> {carData?.customerName}</div>
                      <div><strong>Technician:</strong> {formData.technician_name}</div>
                      <div><strong>Hours Worked:</strong> {formData.actual_hours}h</div>
                      <div><strong>Photos Taken:</strong> {repairPhotos.length}</div>
                      <div><strong>Quality Rating:</strong> {formData.quality_rating}/5 stars</div>
                      <div><strong>Warranty:</strong> {formData.warranty_period} months</div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting || !validateStep(currentStep)}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Complete Repair
                  </>
                )}
              </Button>
            )}
          </div>
          
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RepairCompletionReportDialog;