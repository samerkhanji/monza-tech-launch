
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Camera, CheckCircle, Edit, AlertCircle, Upload } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GuidedPhotoCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onFormComplete: (formData: CarFormData) => void;
}

interface CarFormData {
  vin: string;
  model: string;
  color: string;
  year: number;
  batteryPercentage: number;
  vehicleCategory: 'EV' | 'REV';
  hasDamages: boolean;
  damageDescription: string;
  notes: string;
}

interface CaptureStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  capturedImage?: string;
  extractedData?: any;
}

const GuidedPhotoCapture: React.FC<GuidedPhotoCaptureProps> = ({ isOpen, onClose, onFormComplete }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [formData, setFormData] = useState<CarFormData>({
    vin: '',
    model: '',
    color: '',
    year: new Date().getFullYear(),
    batteryPercentage: 100,
    vehicleCategory: 'EV',
    hasDamages: false,
    damageDescription: '',
    notes: ''
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [steps, setSteps] = useState<CaptureStep[]>([
    {
      id: 'vin',
      title: 'Capture VIN Number',
      description: 'Take a clear photo of the VIN number. Usually located on the dashboard near the windshield or on the driver\'s side door frame.',
      completed: false
    },
    {
      id: 'vehicle',
      title: 'Capture Vehicle Photo',
      description: 'Take a clear photo of the entire vehicle showing its exterior, color, and overall condition.',
      completed: false
    }
  ]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      toast({
        title: "Error",
        description: "Failed to start camera. Please check camera permissions.",
        variant: "destructive",
      });
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
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        analyzePhoto(imageDataUrl, steps[currentStep].id);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        analyzePhoto(imageDataUrl, steps[currentStep].id);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePhoto = async (imageData: string, stepType: string) => {
    setIsAnalyzing(true);
    
    try {
      const context = {
        userRole: user?.role,
        userName: user?.name,
        currentRoute: '/new-car-arrivals',
        analysisType: 'guided_photo_capture',
        stepType,
        timestamp: new Date().toISOString()
      };

      let prompt = '';
      if (stepType === 'vin') {
        prompt = `Analyze this VIN number photo and extract:
        - VIN number (17 characters)
        - Any visible vehicle information (make, model, year if possible)
        
        Focus on accuracy. If the VIN is not clearly visible, indicate that a clearer photo is needed.`;
      } else if (stepType === 'vehicle') {
        prompt = `Analyze this vehicle photo and extract:
        - Vehicle make and model
        - Color (be specific, e.g., "Pearl White", "Metallic Blue")
        - Approximate year if identifiable
        - Vehicle type (Electric/Hybrid indicators)
        - Overall condition and any visible damages
        - License plate if visible
        
        Provide detailed but structured information.`;
      }

      const { data, error } = await supabase.functions.invoke('monzabot-gpt', {
        body: {
          message: prompt,
          context,
          imageData
        }
      });

      if (error) {
        throw new Error(`Analysis failed: ${error.message}`);
      }

      // Update the step with captured data
      const updatedSteps = [...steps];
      updatedSteps[currentStep] = {
        ...updatedSteps[currentStep],
        completed: true,
        capturedImage: imageData,
        extractedData: data.response
      };
      setSteps(updatedSteps);

      // Extract and populate form data
      if (stepType === 'vin') {
        // Try to extract VIN from the response
        const vinMatch = data.response.match(/[A-HJ-NPR-Z0-9]{17}/);
        if (vinMatch) {
          setFormData(prev => ({ ...prev, vin: vinMatch[0] }));
        }
      } else if (stepType === 'vehicle') {
        // Parse vehicle information and update form
        updateFormFromVehicleAnalysis(data.response);
      }

      toast({
        title: "Photo Analyzed",
        description: `${steps[currentStep].title} completed successfully`,
      });

      // Move to next step or show review
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setShowReviewDialog(true);
      }

    } catch (error) {
      console.error('Error analyzing photo:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze the photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateFormFromVehicleAnalysis = (analysisText: string) => {
    // Simple parsing logic - in a real app, you'd want more sophisticated parsing
    const lowerText = analysisText.toLowerCase();
    
    // Extract color
    const colorKeywords = ['white', 'black', 'red', 'blue', 'silver', 'gray', 'grey', 'pearl', 'metallic'];
    const foundColor = colorKeywords.find(color => lowerText.includes(color));
    
    // Extract model information
    const modelKeywords = ['voyah', 'free', 'tesla', 'byd', 'nio'];
    const foundModel = modelKeywords.find(model => lowerText.includes(model));

    // Check for damage indicators
    const damageKeywords = ['damage', 'scratch', 'dent', 'crack', 'broken'];
    const hasDamage = damageKeywords.some(keyword => lowerText.includes(keyword));

    setFormData(prev => ({
      ...prev,
      color: foundColor ? foundColor.charAt(0).toUpperCase() + foundColor.slice(1) : prev.color,
      model: foundModel ? foundModel.charAt(0).toUpperCase() + foundModel.slice(1) : prev.model,
      hasDamages: hasDamage,
      damageDescription: hasDamage ? 'Detected from photo analysis - please verify' : '',
      notes: `Auto-filled from photo analysis: ${analysisText.substring(0, 200)}...`
    }));
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
    setCurrentStep(0);
    setSteps(steps.map(step => ({ ...step, completed: false, capturedImage: undefined, extractedData: undefined })));
  };

  const handleFormSubmit = () => {
    onFormComplete(formData);
    handleClose();
    toast({
      title: "Form Completed",
      description: "Vehicle information has been added to arrivals",
    });
  };

  React.useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Guided Photo Capture for New Car
              <Badge variant="outline">Step {currentStep + 1} of {steps.length}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Camera Section */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{steps[currentStep]?.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {steps[currentStep]?.description}
                  </p>

                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg border"
                  />

                  <div className="flex gap-2">
                    <Button onClick={capturePhoto} disabled={isAnalyzing} className="flex-1">
                      <Camera className="h-4 w-4 mr-2" />
                      {isAnalyzing ? 'Analyzing...' : 'Capture Photo'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isAnalyzing}
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {isAnalyzing && (
                    <div className="text-center p-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-sm text-muted-foreground">Analyzing with GPT-4o...</p>
                    </div>
                  )}

                  <canvas ref={canvasRef} className="hidden" />
                </CardContent>
              </Card>
            </div>

            {/* Progress Section */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3">
                        {step.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className={`h-5 w-5 rounded-full border-2 ${
                            index === currentStep ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
                          }`} />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${step.completed ? 'text-green-700' : 'text-gray-700'}`}>
                            {step.title}
                          </p>
                          {step.completed && step.extractedData && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Analysis completed
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {steps.every(step => step.completed) && (
                    <Button 
                      onClick={() => setShowReviewDialog(true)} 
                      className="w-full mt-4"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Review & Edit Information
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Review & Edit Vehicle Information
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please review the information extracted from your photos and make any necessary corrections:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>VIN Number</Label>
                <Input
                  value={formData.vin}
                  onChange={(e) => setFormData(prev => ({ ...prev, vin: e.target.value }))}
                  placeholder="17-character VIN"
                />
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="e.g., Voyah Free"
                />
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="e.g., Pearl White"
                />
              </div>

              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Battery Percentage</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.batteryPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, batteryPercentage: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <RadioGroup 
                  value={formData.vehicleCategory} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vehicleCategory: value as 'EV' | 'REV' }))}
                  className="flex flex-row gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EV" id="ev-review" />
                    <Label htmlFor="ev-review">EV</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="REV" id="rev-review" />
                    <Label htmlFor="rev-review">REV</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Damages Detected</Label>
              <RadioGroup 
                value={formData.hasDamages ? 'yes' : 'no'} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, hasDamages: value === 'yes' }))}
                className="flex flex-row gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no-damage-review" />
                  <Label htmlFor="no-damage-review">No</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="has-damage-review" />
                  <Label htmlFor="has-damage-review">Yes</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.hasDamages && (
              <div className="space-y-2">
                <Label>Damage Description</Label>
                <Textarea
                  value={formData.damageDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, damageDescription: e.target.value }))}
                  placeholder="Describe the damages..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleFormSubmit}>
                Add Vehicle to Arrivals
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GuidedPhotoCapture;
