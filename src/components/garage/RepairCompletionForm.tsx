import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { 
  Camera, 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileImage,
  Clock,
  User,
  Wrench,
  Package,
  Star,
  MessageSquare,
  Save,
  Send
} from "lucide-react";

interface RepairCompletionFormProps {
  isOpen: boolean;
  onClose: () => void;
  carDetails: {
    id: string;
    carCode: string;
    carModel: string;
    customerName: string;
    assignedMechanic: string;
    workType: string;
    status: string;
    issueDescription: string;
    partsUsed: string[];
    toolsUsed: string[];
    estimatedDuration: string;
    actualDuration?: string;
    startTime?: string;
    endTime?: string;
  } | null;
  onSubmit: (completionData: RepairCompletionData) => void;
}

export interface RepairCompletionData {
  carId: string;
  carCode: string;
  carModel: string;
  customerName: string;
  assignedMechanic: string;
  workType: string;
  issueDescription: string;
  solutionDescription: string;
  repairSteps: string[];
  partsUsed: Array<{
    partNumber: string;
    partName: string;
    quantity: number;
    cost: number;
    supplier: string;
  }>;
  toolsUsed: string[];
  totalLaborHours: number;
  totalCost: number;
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'expert';
  qualityRating: number;
  clientSatisfaction: number;
  warrantPeriod: number;
  followUpRequired: boolean;
  followUpNotes: string;
  beforePhotos: string[];
  afterPhotos: string[];
  mechanicNotes: string;
  completionDate: string;
  recommendation: string;
}

export const RepairCompletionForm: React.FC<RepairCompletionFormProps> = ({
  isOpen,
  onClose,
  carDetails,
  onSubmit
}) => {
  const [formData, setFormData] = useState<Partial<RepairCompletionData>>({
    solutionDescription: '',
    repairSteps: [''],
    partsUsed: [],
    toolsUsed: [],
    totalLaborHours: 0,
    totalCost: 0,
    difficultyLevel: 'medium',
    qualityRating: 5,
    clientSatisfaction: 5,
    warrantPeriod: 12,
    followUpRequired: false,
    followUpNotes: '',
    beforePhotos: [],
    afterPhotos: [],
    mechanicNotes: '',
    recommendation: ''
  });

  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'before' | 'after'>('before');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize form data when carDetails changes
  React.useEffect(() => {
    if (carDetails) {
      setFormData(prev => ({
        ...prev,
        carId: carDetails.id,
        carCode: carDetails.carCode,
        carModel: carDetails.carModel,
        customerName: carDetails.customerName,
        assignedMechanic: carDetails.assignedMechanic,
        workType: carDetails.workType,
        issueDescription: carDetails.issueDescription,
        toolsUsed: carDetails.toolsUsed || [],
        totalLaborHours: carDetails.actualDuration ? 
          parseFloat(carDetails.actualDuration.replace('h', '')) : 
          parseFloat(carDetails.estimatedDuration || '0'),
        partsUsed: carDetails.partsUsed?.map(part => ({
          partNumber: part,
          partName: part,
          quantity: 1,
          cost: 0,
          supplier: 'Monza Parts'
        })) || []
      }));
    }
  }, [carDetails]);

  const handleInputChange = (field: keyof RepairCompletionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addRepairStep = () => {
    setFormData(prev => ({
      ...prev,
      repairSteps: [...(prev.repairSteps || []), '']
    }));
  };

  const updateRepairStep = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      repairSteps: prev.repairSteps?.map((step, i) => i === index ? value : step) || []
    }));
  };

  const removeRepairStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      repairSteps: prev.repairSteps?.filter((_, i) => i !== index) || []
    }));
  };

  const handleFileUpload = (files: FileList | null, type: 'before' | 'after') => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => file.type.startsWith('image/'));

    if (validFiles.length !== fileArray.length) {
      toast({
        title: "Invalid Files",
        description: "Only image files are allowed",
        variant: "destructive"
      });
      return;
    }

    if (type === 'before') {
      setBeforePhotos(prev => [...prev, ...validFiles]);
    } else {
      setAfterPhotos(prev => [...prev, ...validFiles]);
    }

    // Convert to base64 for storage
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (type === 'before') {
          setFormData(prev => ({
            ...prev,
            beforePhotos: [...(prev.beforePhotos || []), base64]
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            afterPhotos: [...(prev.afterPhotos || []), base64]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number, type: 'before' | 'after') => {
    if (type === 'before') {
      setBeforePhotos(prev => prev.filter((_, i) => i !== index));
      setFormData(prev => ({
        ...prev,
        beforePhotos: prev.beforePhotos?.filter((_, i) => i !== index) || []
      }));
    } else {
      setAfterPhotos(prev => prev.filter((_, i) => i !== index));
      setFormData(prev => ({
        ...prev,
        afterPhotos: prev.afterPhotos?.filter((_, i) => i !== index) || []
      }));
    }
  };

  const startCamera = async (mode: 'before' | 'after') => {
    setCameraMode(mode);
    setShowCamera(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Unable to access camera",
        variant: "destructive"
      });
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        
        if (cameraMode === 'before') {
          setFormData(prev => ({
            ...prev,
            beforePhotos: [...(prev.beforePhotos || []), base64]
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            afterPhotos: [...(prev.afterPhotos || []), base64]
          }));
        }

        toast({
          title: "Photo Captured",
          description: `${cameraMode === 'before' ? 'Before' : 'After'} photo added successfully`
        });
      }
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const validateForm = () => {
    if (!formData.solutionDescription?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a solution description",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.repairSteps?.some(step => step.trim())) {
      toast({
        title: "Missing Information",
        description: "Please add at least one repair step",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.mechanicNotes?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please add mechanic notes",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateForm() || !carDetails) return;

    const completionData: RepairCompletionData = {
      ...formData as RepairCompletionData,
      completionDate: new Date().toISOString(),
      repairSteps: formData.repairSteps?.filter(step => step.trim()) || []
    };

    onSubmit(completionData);
    onClose();
    
    // Reset form
    setFormData({
      solutionDescription: '',
      repairSteps: [''],
      partsUsed: [],
      toolsUsed: [],
      totalLaborHours: 0,
      totalCost: 0,
      difficultyLevel: 'medium',
      qualityRating: 5,
      clientSatisfaction: 5,
      warrantPeriod: 12,
      followUpRequired: false,
      followUpNotes: '',
      beforePhotos: [],
      afterPhotos: [],
      mechanicNotes: '',
      recommendation: ''
    });
    setBeforePhotos([]);
    setAfterPhotos([]);
  };

  if (!carDetails) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Complete Repair - Submit to History
            </DialogTitle>
            <DialogDescription>
              Provide detailed information about the completed repair for {carDetails.carModel} ({carDetails.carCode})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Car Information Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Repair Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Car:</span>
                    <span>{carDetails.carModel} ({carDetails.carCode})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Customer:</span>
                    <span>{carDetails.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Mechanic:</span>
                    <span>{carDetails.assignedMechanic}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Work Type:</span>
                    <Badge variant="outline">{carDetails.workType.replace('_', ' ')}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issue & Solution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Original Issue Description</Label>
                <div className="p-3 bg-gray-50 rounded-md border text-sm">
                  {carDetails.issueDescription || 'No issue description provided'}
                </div>
              </div>
              <div>
                <Label htmlFor="solution">Solution Description *</Label>
                <Textarea
                  id="solution"
                  placeholder="Describe how the issue was resolved..."
                  value={formData.solutionDescription}
                  onChange={(e) => handleInputChange('solutionDescription', e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Repair Steps */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Repair Steps Performed *</Label>
                <Button size="sm" variant="outline" onClick={addRepairStep}>
                  Add Step
                </Button>
              </div>
              <div className="space-y-2">
                {formData.repairSteps?.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Step ${index + 1}...`}
                      value={step}
                      onChange={(e) => updateRepairStep(index, e.target.value)}
                      className="flex-1"
                    />
                    {formData.repairSteps && formData.repairSteps.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeRepairStep(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )) || []}
              </div>
            </div>

            {/* Quality & Assessment */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <select
                  id="difficulty"
                  value={formData.difficultyLevel}
                  onChange={(e) => handleInputChange('difficultyLevel', e.target.value)}
                  className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white mt-1"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <div>
                <Label htmlFor="quality">Quality Rating</Label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <Star
                      key={rating}
                      className={`h-5 w-5 cursor-pointer ${
                        rating <= (formData.qualityRating || 0) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                      onClick={() => handleInputChange('qualityRating', rating)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="satisfaction">Client Satisfaction</Label>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <Star
                      key={rating}
                      className={`h-5 w-5 cursor-pointer ${
                        rating <= (formData.clientSatisfaction || 0) 
                          ? 'text-green-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                      onClick={() => handleInputChange('clientSatisfaction', rating)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="warranty">Warranty (months)</Label>
                <Input
                  id="warranty"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.warrantPeriod}
                  onChange={(e) => handleInputChange('warrantPeriod', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Labor & Cost */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="laborHours">Total Labor Hours</Label>
                <Input
                  id="laborHours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.totalLaborHours}
                  onChange={(e) => handleInputChange('totalLaborHours', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="totalCost">Total Cost (AED)</Label>
                <Input
                  id="totalCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalCost}
                  onChange={(e) => handleInputChange('totalCost', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Photo Documentation */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Photo Documentation</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before Photos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">Before Photos (Optional)</Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startCamera('before')}
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        Camera
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files, 'before')}
                  />
                  
                  <div className="grid grid-cols-2 gap-2 min-h-[120px] border-2 border-dashed border-gray-300 rounded-lg p-2">
                    {formData.beforePhotos?.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Before ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => removePhoto(index, 'before')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {(!formData.beforePhotos || formData.beforePhotos.length === 0) && (
                      <div className="col-span-2 flex items-center justify-center text-gray-500 text-sm">
                        <FileImage className="h-8 w-8 mr-2" />
                        No before photos added
                      </div>
                    )}
                  </div>
                </div>

                {/* After Photos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm">After Photos (Optional)</Label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startCamera('after')}
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        Camera
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 min-h-[120px] border-2 border-dashed border-gray-300 rounded-lg p-2">
                    {formData.afterPhotos?.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`After ${index + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => removePhoto(index, 'after')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {(!formData.afterPhotos || formData.afterPhotos.length === 0) && (
                      <div className="col-span-2 flex items-center justify-center text-gray-500 text-sm">
                        <FileImage className="h-8 w-8 mr-2" />
                        No after photos added
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Follow-up */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="followUp"
                  checked={formData.followUpRequired}
                  onChange={(e) => handleInputChange('followUpRequired', e.target.checked)}
                />
                <Label htmlFor="followUp">Follow-up Required</Label>
              </div>
              
              {formData.followUpRequired && (
                <Textarea
                  placeholder="Follow-up notes and instructions..."
                  value={formData.followUpNotes}
                  onChange={(e) => handleInputChange('followUpNotes', e.target.value)}
                  rows={2}
                />
              )}
            </div>

            {/* Mechanic Notes */}
            <div>
              <Label htmlFor="mechanicNotes">Mechanic Notes & Details *</Label>
              <Textarea
                id="mechanicNotes"
                placeholder="Additional notes, observations, or recommendations..."
                value={formData.mechanicNotes}
                onChange={(e) => handleInputChange('mechanicNotes', e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Recommendations */}
            <div>
              <Label htmlFor="recommendations">Recommendations for Customer</Label>
              <Textarea
                id="recommendations"
                placeholder="Future maintenance recommendations, warnings, or advice..."
                value={formData.recommendation}
                onChange={(e) => handleInputChange('recommendation', e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
              <Send className="h-4 w-4 mr-2" />
              Submit to Repair History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera Modal */}
      {showCamera && (
        <Dialog open={showCamera} onOpenChange={stopCamera}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Capture {cameraMode === 'before' ? 'Before' : 'After'} Photo
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg border"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={stopCamera}>
                Cancel
              </Button>
              <Button onClick={capturePhoto}>
                <Camera className="h-4 w-4 mr-2" />
                Capture Photo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};