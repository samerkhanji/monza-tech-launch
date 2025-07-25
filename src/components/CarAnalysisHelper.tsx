
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, Loader2, Car, CheckCircle } from 'lucide-react';
import { useMonzaBotCarAnalysis } from '@/hooks/useMonzaBotCarAnalysis';
import { Badge } from '@/components/ui/badge';

interface CarAnalysisHelperProps {
  onDataExtracted?: (data: any) => void;
  formType?: 'new_car_arrival' | 'repair' | 'inventory';
  title?: string;
  description?: string;
}

const CarAnalysisHelper: React.FC<CarAnalysisHelperProps> = ({
  onDataExtracted,
  formType = 'new_car_arrival',
  title = "Car Analysis Assistant",
  description = "Take a photo or upload an image to automatically extract car information"
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const { isAnalyzing, analysisResult, analyzeCarImage, clearAnalysis } = useMonzaBotCarAnalysis();

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraOpen(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      if (context) {
        context.drawImage(videoRef.current, 0, 0);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageDataUrl);
        handleImageAnalysis(imageDataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setCapturedImage(imageDataUrl);
        handleImageAnalysis(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalysis = async (imageDataUrl: string) => {
    try {
      const result = await analyzeCarImage(imageDataUrl, formType);
      if (result.formFillData && onDataExtracted) {
        onDataExtracted(result.formFillData);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const resetAnalysis = () => {
    setCapturedImage(null);
    clearAnalysis();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!capturedImage && !cameraOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              onClick={startCamera}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              disabled={isAnalyzing}
            >
              <Camera className="h-8 w-8" />
              <span>Take Photo</span>
            </Button>
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              disabled={isAnalyzing}
            >
              <Upload className="h-8 w-8" />
              <span>Upload Image</span>
            </Button>
          </div>
        )}

        {cameraOpen && (
          <div className="space-y-3">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg bg-black"
              style={{ maxHeight: '300px' }}
            />
            <div className="flex gap-2">
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture & Analyze
              </Button>
              <Button onClick={stopCamera} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="space-y-3">
            <img
              src={capturedImage}
              alt="Captured car"
              className="w-full rounded-lg border max-h-64 object-contain"
            />
            
            {isAnalyzing && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">MonzaBot is analyzing the car image...</span>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Analysis Complete</span>
                  <Badge variant="secondary" className="ml-auto">
                    {analysisResult.type}
                  </Badge>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">MonzaBot Analysis:</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {analysisResult.textResponse}
                  </p>
                </div>

                {analysisResult.formFillData && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Extracted Data:</p>
                    <div className="text-xs space-y-1">
                      {Object.entries(analysisResult.formFillData).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium">{key.replace(/_/g, ' ')}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button onClick={resetAnalysis} variant="outline" className="w-full">
              Analyze Another Car
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};

export default CarAnalysisHelper;
